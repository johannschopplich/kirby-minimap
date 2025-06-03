import { usePanel } from "kirbyuse";

const BLOCK_ICON_MAP = {
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

const BLOCK_ANIMATION_CLASS = "k-panel-minimap-highlight";

export function useBlocks() {
  const panel = usePanel();

  /**
   * Get the icon name for a block based on its type.
   *
   * @param {string} type - The block type
   * @param {object} field - The field object containing fieldsets
   * @returns {string} - The icon name to use
   */
  function getBlockIcon(type, field) {
    return field.fieldsets[type].icon || (BLOCK_ICON_MAP[type] ?? "box");
  }

  /**
   * Get the most relevant text from a block based on its type.
   *
   * @param {object} block - The block object
   * @param {object} field - The field object containing fieldsets
   * @returns {string} - The text to display for the block
   */
  function extractBlockText(block, field) {
    const { content, type } = block;

    switch (type) {
      case "heading":
        return stripHtml(content.text);
      case "text":
        return stripHtml(content.text);
      case "image":
        return content.alt || panel.t("field.blocks.image.name");
      case "gallery":
        return content.images?.length
          ? `${panel.t("field.blocks.gallery.name")} (${content.images.length})`
          : panel.t("field.blocks.gallery.name");
      case "video":
        return stripHtml(content.caption) || panel.t("field.blocks.video.name");
      case "code":
        return (
          panel.t("field.blocks.code.name") +
          (content.language ? ` (${content.language})` : "")
        );
      case "quote":
        return (
          stripHtml(content.text) ||
          stripHtml(content.citation) ||
          panel.t("field.blocks.quote.name")
        );
      case "markdown":
        return content.text
          ? stripHtml(content.text)
          : panel.t("field.blocks.markdown.name");
      case "list":
        return panel.t("field.blocks.list.name");
      case "line":
        return panel.t("field.blocks.line.name");
      case "table":
        return panel.t("field.blocks.table.name");
      default:
        return (
          field.fieldsets[type].name ||
          type.charAt(0).toUpperCase() + type.slice(1)
        );
    }
  }

  /**
   * Scroll to a specific block in the editor.
   *
   * @param {string} blockId - The ID of the block to scroll to
   */
  function scrollToBlock(blockId) {
    if (!blockId) return;

    const blockElement = document.querySelector(`[data-id="${blockId}"]`);
    if (!blockElement) return;

    blockElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    blockElement.classList.add(BLOCK_ANIMATION_CLASS);
    setTimeout(() => {
      blockElement.classList.remove(BLOCK_ANIMATION_CLASS);
    }, 2000);

    // Close the mobile menu
    // See: https://github.com/getkirby/kirby/blob/938fe98951cace6c77aab744779bf4e0799ad705/panel/src/panel/menu.js#L25
    if (window.matchMedia?.("(max-width: 60rem)").matches) {
      panel.menu.close();
    }
  }

  return {
    getBlockIcon,
    extractBlockText,
    scrollToBlock,
  };
}

/**
 * Strip HTML tags from a string and limit its length.
 *
 * @param {string} html - HTML string to strip
 * @param {number} limit - Character limit for the result
 * @returns {string} - Stripped text with length limit
 */
function stripHtml(html, limit = 50) {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "");
  return text.substring(0, limit);
}
