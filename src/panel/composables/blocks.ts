import type { KirbyBlockValue } from "kirby-types";
import type { MinimapModelField } from "../types";
import { usePanel } from "kirbyuse";
import {
  BLOCK_ANIMATION_CLASS,
  BLOCK_ANIMATION_DURATION,
  BLOCK_ICON_MAP,
  BLOCK_TEXT_LIMIT,
} from "../constants";

export function useBlocks() {
  const panel = usePanel();

  /** Returns the icon for a block type, preferring the one its fieldset declares. */
  function getBlockIcon(type: string, field: MinimapModelField): string {
    return field.fieldsets?.[type]?.icon || (BLOCK_ICON_MAP[type] ?? "box");
  }

  /**
   * Returns the block's most meaningful text for display, falling back to the
   * block type's name.
   */
  function extractBlockText(
    block: KirbyBlockValue,
    field: MinimapModelField,
  ): string {
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
      case "table":
        return panel.t("field.blocks.table.name");
      default:
        return (
          field.fieldsets?.[type]?.name ||
          type.charAt(0).toUpperCase() + type.slice(1)
        );
    }
  }

  /** Scrolls a block into view and pulses a highlight on it. */
  function scrollToBlock(blockId: string) {
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
    }, BLOCK_ANIMATION_DURATION);
  }

  return {
    getBlockIcon,
    extractBlockText,
    scrollToBlock,
  };
}

/** Strips HTML tags from a string and cuts it to the sidebar's limit. */
function stripHtml(html: string | undefined, limit = BLOCK_TEXT_LIMIT): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "");
  return text.slice(0, limit);
}
