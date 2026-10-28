import type { KirbyAnyFieldProps, KirbyBlockValue } from "kirby-types";
import { describe, expect, it } from "vitest";
import { useBlocks } from "../../src/panel/composables/blocks";

const HEADING: KirbyBlockValue = {
  content: { text: "Heading" },
  id: "heading",
  isHidden: false,
  type: "heading",
};

describe("getFieldBlocks", () => {
  const { getFieldBlocks } = useBlocks();

  it("returns the blocks of a custom type that extends blocks", () => {
    const field = { type: "customblocks", fieldsets: {} } as KirbyAnyFieldProps;

    expect(getFieldBlocks(field, [HEADING])).toEqual([HEADING]);
  });

  it("flattens the columns of a custom type that extends layout", () => {
    const field = {
      type: "customlayout",
      fieldsets: {},
      layouts: [["1/2", "1/2"]],
    } as KirbyAnyFieldProps;
    const rows = [{ columns: [{ blocks: [] }, { blocks: [HEADING] }] }];

    expect(getFieldBlocks(field, rows)).toEqual([HEADING]);
  });

  it("returns no blocks for a structure field", () => {
    const field = { type: "structure", fields: {} } as KirbyAnyFieldProps;

    expect(getFieldBlocks(field, [{ text: "a" }])).toEqual([]);
  });
});
