export const PLUGIN_MODEL_FIELDS_API_ROUTE = "__minimap__/model-fields";

export const OPEN_STATE_STORAGE_KEY = "kirby$minimap";

/**
 * Kirby's own menu breakpoint. It has no custom property for it, and a media
 * query could not read one anyway.
 *
 * @see https://github.com/getkirby/kirby/blob/main/panel/src/components/View/Menu.vue
 */
export const DESKTOP_MEDIA_QUERY = "(min-width: 60rem)";

/** Field and block types that carry nothing to jump to. */
export const EXCLUDED_FIELD_TYPES = new Set(["gap", "hidden", "line"]);

/** Icons for the default block types, which ship no fieldset icon. */
export const BLOCK_ICON_MAP: Record<string, string> = {
  heading: "title",
  text: "text",
  image: "image",
  gallery: "dashboard",
  video: "video",
  code: "code",
  quote: "quote",
  markdown: "markdown",
  list: "list-bullet",
  line: "divider",
  table: "menu",
};

export const BLOCK_ANIMATION_CLASS = "k-panel-minimap-highlight";

export const BLOCK_TEXT_LIMIT = 50;
