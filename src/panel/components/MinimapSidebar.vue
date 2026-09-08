<script setup lang="ts">
import type {
  MinimapField,
  MinimapModelField,
  MinimapViewColumn,
  MinimapViewTab,
} from "../types";
import { computed, nextTick, ref, useContent, usePanel, watch } from "kirbyuse";
import { useBlocks } from "../composables/blocks";
import {
  useEventListener,
  useIntersectionObserver,
} from "../composables/events";
import {
  DESKTOP_MEDIA_QUERY,
  EXCLUDED_FIELD_TYPES,
  OPEN_STATE_STORAGE_KEY,
  PLUGIN_MODEL_FIELDS_API_ROUTE,
} from "../constants";

const panel = usePanel();
const { currentContent, contentChanges } = useContent();
const { getBlockIcon, extractBlockText, scrollToBlock } = useBlocks();

const minimap = ref<HTMLElement>();

const desktopMedia = window.matchMedia(DESKTOP_MEDIA_QUERY);
const isDesktop = ref(desktopMedia.matches);

// Two states, because the minimap is two things. On desktop it is a sidebar
// that is either expanded or a strip of dashes, and that choice is worth
// remembering. Below the breakpoint it is an overlay over the view, which
// starts closed on every load the way Kirby's mobile menu does.
const isExpanded = ref(
  localStorage.getItem(OPEN_STATE_STORAGE_KEY) === "true" || false,
);
const isOverlayOpen = ref(false);
const isOpen = computed(() =>
  isDesktop.value ? isExpanded.value : isOverlayOpen.value,
);

const fields = ref<Record<string, MinimapModelField>>({});
const activeFieldNames = ref<string[]>([]);
const activeBlockIds = ref<string[]>([]);
const observedBlockIds = new Set<string>();

const resolvedFields = computed<Record<string, MinimapField>>(() =>
  Object.fromEntries(
    Object.entries(fields.value).map(([key, field]) => {
      const content = contentChanges.value[key] ?? currentContent.value[key];
      const blocks =
        field.type === "blocks" && Array.isArray(content)
          ? content
              .filter((block) => !EXCLUDED_FIELD_TYPES.has(block.type))
              .map((block) => ({
                ...block,
                _icon: getBlockIcon(block.type, field),
                _text: extractBlockText(block, field),
                _active: activeBlockIds.value.includes(block.id),
              }))
          : [];

      return [
        key,
        {
          ...field,
          blocks,
          _active: activeFieldNames.value.includes(field.name),
        },
      ];
    }),
  ),
);

useEventListener(desktopMedia, "change", (event) => {
  isDesktop.value = event.matches;

  // The header sits a few pixels lower once the topbar has room for the view
  // buttons, so the offset the sidebar aligns to is measured per layout.
  if (event.matches) nextTick(measureHeaderOffset);
});

const observer = useIntersectionObserver({
  rootMargin: "0px",
  threshold: 0,
});

watch(isExpanded, (newValue) => {
  localStorage.setItem(OPEN_STATE_STORAGE_KEY, String(newValue));
  updateMinimapWidth(newValue);
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

watch(
  [currentContent, contentChanges],
  () => {
    updateBlockObservers();
  },
  { deep: true },
);

// Watch for navigation changes in the Panel.
watch(
  [() => panel.view.path, () => panel.view.props.tab],
  async () => {
    isOverlayOpen.value = false;
    cleanupObservers();

    await initializeMinimapContent();
  },
  { immediate: true },
);

initializeMinimapUI();

// Sets up the UI elements that only need to be initialized once.
function initializeMinimapUI() {
  updateMinimapWidth(isExpanded.value);
  measureHeaderOffset();
}

// Align the minimap with the top of the header's content box, i.e. the view title.
function measureHeaderOffset() {
  const header = document.querySelector(".k-header");
  const headerContentTop = header
    ? header.getBoundingClientRect().top +
      Number.parseFloat(getComputedStyle(header).paddingTop)
    : 0;
  setCssProperty("--minimap-top-offset", `${headerContentTop}px`);
}

// Fetches fields and sets up observers for the current view.
async function initializeMinimapContent() {
  if (panel.view.path !== "site" && !panel.view.path.startsWith("pages/")) {
    return;
  }

  // Ensure all Panel components are loaded before querying DOM elements.
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

  const modelFields = await panel.api.get<Record<string, MinimapModelField>>(
    PLUGIN_MODEL_FIELDS_API_ROUTE,
    { id: panel.view.path },
    undefined,
    // Silent
    true,
  );

  let filteredFields = modelFields;

  // Filter fields based on current tab.
  if (panel.view.props.tabs && panel.view.props.tabs.length > 1) {
    const currentTabFieldNames = extractCurrentTabFieldNames();

    filteredFields = Object.fromEntries(
      Object.entries(modelFields).filter(([key]) =>
        currentTabFieldNames.has(key),
      ),
    );
  }

  // Remove excluded field types from the model fields.
  for (const [key, field] of Object.entries(filteredFields)) {
    if (EXCLUDED_FIELD_TYPES.has(field.type)) {
      delete filteredFields[key];
    }
  }

  fields.value = filteredFields;

  // Set up observers for each field.
  for (const fieldName of Object.keys(fields.value)) {
    const fieldElement = document.querySelector(`.k-field-name-${fieldName}`);
    if (!fieldElement) continue;

    observer.observe(fieldElement, (isIntersecting) => {
      if (isIntersecting) {
        activeFieldNames.value.push(fieldName);
      } else {
        activeFieldNames.value = activeFieldNames.value.filter(
          (name) => name !== fieldName,
        );
      }
    });
  }

  updateBlockObservers();
}

// Cleans up observers and resets tracking state to prevent memory leaks.
function cleanupObservers() {
  if (!observer) return;

  observer.disconnect();

  activeFieldNames.value = [];
  activeBlockIds.value = [];
  observedBlockIds.clear();
}

// Observes new blocks and unobserves deleted blocks.
function updateBlockObservers() {
  if (!observer) return;

  const currentBlockIds = new Set<string>();

  // Add observers for all blocks in all block fields.
  for (const field of Object.values(fields.value)) {
    if (field.type !== "blocks") continue;

    const content =
      contentChanges.value[field.name] ?? currentContent.value[field.name];
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      currentBlockIds.add(block.id);
      if (observedBlockIds.has(block.id)) continue;

      const blockElement = document.querySelector(`[data-id="${block.id}"]`);
      if (!blockElement) continue;

      observer.observe(blockElement, (isIntersecting) => {
        if (isIntersecting) {
          activeBlockIds.value.push(block.id);
        } else {
          activeBlockIds.value = activeBlockIds.value.filter(
            (id) => id !== block.id,
          );
        }
      });

      observedBlockIds.add(block.id);
    }
  }

  // Unobserve and remove blocks that no longer exist.
  const deletedBlockIds = [...observedBlockIds].filter(
    (id) => !currentBlockIds.has(id),
  );

  if (deletedBlockIds.length) {
    activeBlockIds.value = activeBlockIds.value.filter(
      (activeId) => !deletedBlockIds.includes(activeId),
    );

    for (const id of deletedBlockIds) {
      observedBlockIds.delete(id);
    }
  }
}

function toggle() {
  if (isDesktop.value) {
    isExpanded.value = !isExpanded.value;
    return;
  }

  isOverlayOpen.value = !isOverlayOpen.value;
}

function updateMinimapWidth(isOpen = false) {
  setCssProperty(
    "--minimap-width",
    isOpen ? "var(--minimap-width-open)" : "var(--minimap-width-closed)",
  );
}

function setCssProperty(property: string, value: string) {
  document.documentElement.style.setProperty(property, value);
}

// The API keys its fields the way Kirby stores content, in lower case, while
// the view props keep the blueprint's spelling. A camel-cased field name would
// otherwise match nothing and drop out of the list.
function extractCurrentTabFieldNames() {
  const fieldNames = new Set<string>();

  const tab = panel.view.props.tab as MinimapViewTab;
  const columns: MinimapViewColumn[] = Array.isArray(tab.columns)
    ? tab.columns
    : Object.values(tab.columns);

  for (const column of columns) {
    for (const section of Object.values(column.sections)) {
      if (section.type !== "fields") continue;

      for (const field of Object.values(section.fields ?? {})) {
        fieldNames.add(field.name.toLowerCase());
      }
    }
  }

  return fieldNames;
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
  <nav
    ref="minimap"
    class="k-panel-minimap"
    :data-open="String(isOpen)"
    @click.self="isOverlayOpen = false"
  >
    <div class="k-panel-minimap-body">
      <menu>
        <template v-for="field in Object.values(resolvedFields)">
          <div :key="field.name">
            <div
              class="k-panel-minimap-menu-item"
              :class="[
                isOpen
                  ? 'km-py-[var(--spacing-2)]'
                  : 'km-py-[var(--spacing-3)]',
              ]"
              :data-active="String(field._active)"
              @click="jumpToField(field.name)"
            >
              <template v-if="isOpen">
                <span class="k-label-text km-[font-weight:var(--font-semi)]">
                  {{ field.label }}
                </span>
                <span
                  v-if="field.required"
                  :title="panel.t('field.required')"
                  class="km-[font-weight:var(--font-semi)] km-ms-[var(--spacing-1)] km-text-[var(--theme-color-600)]"
                  data-theme="negative"
                  v-text="'✶'"
                />
              </template>
              <div v-else class="km-h-px km-flex-1 km-bg-[var(--color-text)]" />
            </div>
            <template v-if="field.type === 'blocks' && field.blocks.length">
              <div
                v-for="(block, blockIndex) in field.blocks"
                :key="`${blockIndex}-${block.id}`"
                class="k-panel-minimap-menu-item km-flex km-items-center km-gap-[var(--spacing-2)] km-py-[var(--spacing-1)]"
                :data-active="String(block._active)"
                @click="jumpToBlock(block.id)"
              >
                <k-icon :type="block._icon" />
                <span class="k-label-text">
                  {{ block._text }}
                </span>
              </div>
            </template>
          </div>
        </template>
      </menu>
    </div>

    <k-button
      :icon="isOpen ? 'angle-right' : 'angle-left'"
      :title="isOpen ? panel.t('collapse') : panel.t('expand')"
      size="xs"
      class="k-panel-minimap-toggle"
      @click="toggle"
    />
  </nav>
</template>

<style>
/* What follows mirrors Kirby's own collapsible menu, selector for selector,
   with the sides swapped. The comments below mark where the minimap parts ways
   with it.

   @see https://github.com/getkirby/kirby/blob/main/panel/src/components/View/Menu.vue */

/* Diverges: Kirby toggles the menu through `--menu-display`, the minimap
   through its width, so that the collapsed strip of dashes stays visible.
   `--menu-shadow` holds here because Kirby resets it to `none` on `.k-panel`
   inside the same breakpoint. */
.k-panel-minimap {
  position: fixed;
  inset-inline-end: 0;
  inset-block: 0;
  z-index: var(--z-navigation);
  width: var(--minimap-width-overlay);
  background-color: var(--panel-color-back);
  box-shadow: var(--menu-shadow);
}

.k-panel-minimap[data-open="false"] {
  width: 0;
}

.k-panel-minimap[data-open="false"] .k-panel-minimap-body {
  display: none;
}

/* Diverges: Kirby puts the backdrop on `.k-panel::after` at `--z-drawer` and
   makes it `pointer-events: none`. Ours is a child of the nav at `z-index: -1`,
   so it covers the view, stays behind the panel itself, and still receives the
   `@click.self` that closes the overlay. */
.k-panel-minimap[data-open="true"]::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background: var(--overlay-color-back);
}

.k-panel-minimap-body {
  padding-block: var(--menu-padding);
  overscroll-behavior: contain;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

.k-panel-minimap-toggle {
  --button-align: flex-start;
  --button-width: var(--menu-toggle-width);
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 100%;
  align-items: flex-start;
  border-radius: 0;
  overflow: visible;
  transition: opacity 0.2s;
}

.k-panel-minimap-toggle:focus {
  outline: 0;
}

.k-panel-minimap-toggle .k-button-icon {
  display: grid;
  place-items: center;
  height: var(--menu-toggle-height);
  width: var(--menu-toggle-width);
  margin-top: var(--menu-padding);
  border-block: 1px solid var(--menu-color-border);
  border-inline-start: 1px solid var(--menu-color-border);
  background: var(--panel-color-back);
  border-start-start-radius: var(--button-rounded);
  border-end-start-radius: var(--button-rounded);
}

/* Diverges: Kirby scopes this to the desktop query, where its own toggle is
   the only one that exists. Ours is reachable on every width. */
.k-panel-minimap-toggle:focus-visible .k-button-icon {
  outline: var(--outline);
  border-radius: var(--button-rounded);
}

/* Diverges: Kirby's menu rows are `.k-panel-menu-button`s, which carry a
   background rather than an edge marker. `--menu-color-back` is Kirby's menu
   surface, not a hover tint. */
.k-panel-minimap-menu-item {
  cursor: pointer;
  border-inline-start-width: 2px;
  border-inline-start-style: solid;
  border-inline-start-color: transparent;
  padding-inline: var(--menu-padding);
}

.k-panel-minimap-menu-item:hover {
  background-color: var(--menu-color-back);
}

.k-panel-minimap-menu-item[data-active="true"] {
  border-inline-start-color: var(--color-focus);
}

/* No counterpart in Kirby: the pulse a jumped-to block gets. */
.k-panel-minimap-highlight {
  animation: highlight-pulse 2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes highlight-pulse {
  0%,
  100% {
    box-shadow: none;
  }
  50% {
    box-shadow: inset 0 0 0 2px var(--color-focus);
  }
}

@media (min-width: 60rem) {
  /* `--main-end` mirrors Kirby's `--main-start`, the space `.k-panel-main`
     keeps clear for the menu; Kirby declares no such token. */
  .k-panel {
    --main-end: var(--minimap-width);
  }

  .k-panel-main {
    margin-inline-end: var(--main-end);
  }

  .k-panel-minimap {
    width: var(--minimap-width);
    border-left: 1px solid var(--menu-color-border);
  }

  .k-panel-minimap[data-open="false"] {
    width: var(--minimap-width);
  }

  .k-panel-minimap[data-open="false"] .k-panel-minimap-body,
  .k-panel-minimap-body {
    display: block;
    padding-top: calc(var(--minimap-top-offset) + var(--spacing-1));
  }

  .k-panel-minimap[data-open="true"]::before {
    content: none;
  }

  /* Diverges: Kirby drives this from JS through a `data-hover` attribute,
     noting that CSS `:hover` flickered; ours has not. */
  .k-panel-minimap-toggle {
    --button-height: 100%;
    inset-block: 0;
    opacity: 0;
  }

  .k-panel-minimap-toggle:focus-visible,
  .k-panel-minimap:hover .k-panel-minimap-toggle {
    opacity: 1;
  }

  .k-panel-minimap-menu-item {
    border-inline-start-width: 1px;
  }
}
</style>
