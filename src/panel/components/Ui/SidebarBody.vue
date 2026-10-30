<script setup lang="ts">
import type { MinimapField } from "../../types";

defineProps<{
  fields: MinimapField[];
  isOpen: boolean;
  collapseLabel: string;
  expandLabel: string;
  requiredLabel: string;
}>();

const emit = defineEmits<{
  toggle: [];
  close: [];
  jumpField: [name: string];
  jumpBlock: [id: string];
}>();
</script>

<template>
  <nav
    class="k-panel-minimap"
    :data-open="String(isOpen)"
    @click.self="emit('close')"
  >
    <div class="k-panel-minimap-body">
      <menu>
        <div v-for="(field, index) in fields" :key="field.name ?? index">
          <div
            class="k-panel-minimap-menu-item"
            :class="[
              isOpen ? 'km-py-[var(--spacing-2)]' : 'km-py-[var(--spacing-3)]',
            ]"
            :data-active="String(Boolean(field.isActive))"
            @click="field.name && emit('jumpField', field.name)"
          >
            <template v-if="isOpen">
              <span class="k-label-text km-[font-weight:var(--font-semi)]">
                {{ field.label }}
              </span>
              <span
                v-if="field.required"
                :title="requiredLabel"
                class="km-[font-weight:var(--font-semi)] km-ms-[var(--spacing-1)] km-text-[color:var(--theme-color-600)]"
                data-theme="negative"
                v-text="'✶'"
              />
            </template>
            <div v-else class="km-h-px km-flex-1 km-bg-[var(--color-text)]" />
          </div>
          <div
            v-for="(block, blockIndex) in field.blocks"
            :key="`${blockIndex}-${block.id}`"
            class="k-panel-minimap-menu-item km-flex km-items-center km-gap-[var(--spacing-2)] km-py-[var(--spacing-1)]"
            :data-active="String(Boolean(block.isActive))"
            @click="block.id && emit('jumpBlock', block.id)"
          >
            <k-icon :type="block.icon" />
            <span class="k-label-text">
              {{ block.text }}
            </span>
          </div>
        </div>
      </menu>
    </div>

    <k-button
      :icon="isOpen ? 'angle-right' : 'angle-left'"
      :title="isOpen ? collapseLabel : expandLabel"
      size="xs"
      class="k-panel-minimap-toggle"
      @click="emit('toggle')"
    />
  </nav>
</template>

<style>
/* What follows mirrors Kirby's own collapsible menu, selector for selector,
   with the sides swapped.

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
  background-color: var(--panel-color-back);
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
  .k-panel:has(> .k-panel-minimap) {
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
