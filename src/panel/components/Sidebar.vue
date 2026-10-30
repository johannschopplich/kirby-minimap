<script setup lang="ts">
import { useContent, useHelpers, usePanel } from "kirbyuse";
import { computed, nextTick, ref, watch } from "vue";
import { useBlocks } from "../composables/blocks";
import {
  useEventListener,
  useIntersectionObserver,
} from "../composables/events";
import { useTabFields } from "../composables/tab-fields";
import {
  BLOCK_TEXT_LIMIT,
  DESKTOP_MEDIA_QUERY,
  EXCLUDED_FIELD_TYPES,
  EXPANDED_STATE_STORAGE_KEY,
} from "../constants";
import SidebarBody from "./Ui/SidebarBody.vue";

const panel = usePanel();
const helpers = useHelpers();
const { currentContent } = useContent();
const { getFieldBlocks, getBlockIcon, extractBlockText, scrollToBlock } =
  useBlocks();
const fields = useTabFields();

const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY);
const isDesktop = ref(desktopMedia.matches);

const isExpanded = ref(
  localStorage.getItem(EXPANDED_STATE_STORAGE_KEY) === "true",
);
const isOverlayOpen = ref(false);
const isOpen = computed(() =>
  isDesktop.value ? isExpanded.value : isOverlayOpen.value,
);

const activeFieldNames = ref<string[]>([]);
const activeBlockIds = ref<string[]>([]);
const stopObservingField = new Map<string, () => void>();
const stopObservingBlock = new Map<string, () => void>();

const observer = useIntersectionObserver({
  rootMargin: "0px",
  threshold: 0,
});

// The same check Kirby's fieldset renders a field by, so a field its `when`
// condition hides is left out here too.
const visibleFields = computed(() =>
  Object.entries(fields.value).filter(([, field]) =>
    helpers.field.isVisible(field, currentContent.value),
  ),
);

const resolvedFields = computed(() =>
  visibleFields.value.map(([name, field]) => {
    const content = currentContent.value[name];
    const blocks = getFieldBlocks(field, content)
      .filter((block) => !EXCLUDED_FIELD_TYPES.has(block.type))
      .map((block) => ({
        id: block.id,
        icon: getBlockIcon(block.type, field),
        text: extractBlockText(block, field).slice(0, BLOCK_TEXT_LIMIT),
        isActive: activeBlockIds.value.includes(block.id),
      }));

    return {
      name,
      label: field.label ?? name,
      required: field.required,
      isActive: activeFieldNames.value.includes(name),
      blocks,
    };
  }),
);

const listedBlockIds = computed(() =>
  resolvedFields.value.flatMap((field) =>
    field.blocks.map((block) => block.id),
  ),
);

useEventListener(desktopMedia, "change", (event) => {
  isDesktop.value = event.matches;

  // The header sits a few pixels lower once the topbar has room for the view
  // buttons, so the offset the sidebar aligns to is measured per layout.
  if (event.matches) nextTick(measureHeaderOffset);
});

watch(isExpanded, (newValue) => {
  localStorage.setItem(EXPANDED_STATE_STORAGE_KEY, String(newValue));
  updateMinimapWidth();
});

// One panel at a time: the overlay and Kirby's menu would otherwise share a
// phone-width viewport between them and leave the view a sliver.
watch(isOverlayOpen, (newValue) => {
  if (newValue) panel.menu.close();
});

watch(
  () => panel.menu.isOpen,
  (newValue) => {
    if (newValue) isOverlayOpen.value = false;
  },
);

// Reads the content only through the listed fields, never `currentContent`
// directly: Kirby switches `panel.view` to the next view while the sidebar is
// still mounted, and `panel.content.version()` throws for a view without
// content versions.
watch(
  () => listedBlockIds.value.join(),
  () => {
    updateBlockObservers();
  },
);

// Kirby renders a field it shows again as a new element, and only after this
// flush, so its observer waits a tick.
watch(
  () => visibleFields.value.map(([name]) => name).join(),
  async () => {
    await nextTick();
    updateFieldObservers();
    updateBlockObservers();
  },
);

watch(
  [() => panel.view.path, () => panel.view.props.tab],
  async () => {
    isOverlayOpen.value = false;
    cleanupObservers();

    await observeViewElements();
  },
  { immediate: true },
);

updateMinimapWidth();
measureHeaderOffset();

function measureHeaderOffset() {
  const header = document.querySelector(".k-header");
  const headerContentTop = header
    ? header.getBoundingClientRect().top +
      Number.parseFloat(getComputedStyle(header).paddingTop)
    : 0;
  setCssProperty("--minimap-top-offset", `${headerContentTop}px`);
}

async function observeViewElements() {
  if (panel.isLoading) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        () => panel.isLoading,
        () => {
          nextTick(() => stop());
          resolve();
        },
      );
    });
  }

  // The tab's fields render only after this flush.
  await nextTick();

  updateFieldObservers();
  updateBlockObservers();
}

function cleanupObservers() {
  observer.disconnect();

  activeFieldNames.value = [];
  activeBlockIds.value = [];
  stopObservingField.clear();
  stopObservingBlock.clear();
}

function updateFieldObservers() {
  const visibleFieldNames = new Set<string>();

  for (const [name] of visibleFields.value) {
    visibleFieldNames.add(name);
    observeField(name);
  }

  unobserveHiddenFields(visibleFieldNames);
}

function observeField(name: string) {
  if (stopObservingField.has(name)) return;

  const fieldElement = document.querySelector(`.k-field-name-${name}`);
  if (!fieldElement) return;

  const stop = observer.observe(fieldElement, (isIntersecting) => {
    if (isIntersecting) {
      activeFieldNames.value.push(name);
    } else {
      activeFieldNames.value = activeFieldNames.value.filter(
        (activeName) => activeName !== name,
      );
    }
  });

  stopObservingField.set(name, stop);
}

function unobserveHiddenFields(visibleFieldNames: Set<string>) {
  const hiddenFieldNames = [...stopObservingField.keys()].filter(
    (name) => !visibleFieldNames.has(name),
  );
  if (!hiddenFieldNames.length) return;

  activeFieldNames.value = activeFieldNames.value.filter(
    (activeName) => !hiddenFieldNames.includes(activeName),
  );

  for (const name of hiddenFieldNames) {
    stopObservingField.get(name)?.();
    stopObservingField.delete(name);
  }
}

function updateBlockObservers() {
  for (const blockId of listedBlockIds.value) observeBlock(blockId);

  unobserveDeletedBlocks(new Set(listedBlockIds.value));
}

function observeBlock(blockId: string) {
  if (stopObservingBlock.has(blockId)) return;

  const blockElement = document.querySelector(`[data-id="${blockId}"]`);
  if (!blockElement) return;

  const stop = observer.observe(blockElement, (isIntersecting) => {
    if (isIntersecting) {
      activeBlockIds.value.push(blockId);
    } else {
      activeBlockIds.value = activeBlockIds.value.filter(
        (activeId) => activeId !== blockId,
      );
    }
  });

  stopObservingBlock.set(blockId, stop);
}

function unobserveDeletedBlocks(currentBlockIds: Set<string>) {
  const deletedBlockIds = [...stopObservingBlock.keys()].filter(
    (id) => !currentBlockIds.has(id),
  );
  if (!deletedBlockIds.length) return;

  activeBlockIds.value = activeBlockIds.value.filter(
    (activeId) => !deletedBlockIds.includes(activeId),
  );

  for (const id of deletedBlockIds) {
    stopObservingBlock.get(id)?.();
    stopObservingBlock.delete(id);
  }
}

function toggle() {
  if (isDesktop.value) {
    isExpanded.value = !isExpanded.value;
    return;
  }

  isOverlayOpen.value = !isOverlayOpen.value;
}

function updateMinimapWidth() {
  setCssProperty(
    "--minimap-width",
    isExpanded.value
      ? "var(--minimap-width-open)"
      : "var(--minimap-width-closed)",
  );
}

function setCssProperty(property: string, value: string) {
  document.documentElement.style.setProperty(property, value);
}

function jumpToField(fieldName: string) {
  const fieldElement = document.querySelector(`.k-field-name-${fieldName}`);
  if (!fieldElement) return;

  fieldElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  isOverlayOpen.value = false;
}

function jumpToBlock(blockId: string) {
  scrollToBlock(blockId);
  isOverlayOpen.value = false;
}
</script>

<template>
  <SidebarBody
    :fields="resolvedFields"
    :is-open="isOpen"
    :collapse-label="panel.t('collapse')"
    :expand-label="panel.t('expand')"
    :required-label="panel.t('field.required')"
    @toggle="toggle"
    @close="isOverlayOpen = false"
    @jump-field="jumpToField"
    @jump-block="jumpToBlock"
  />
</template>
