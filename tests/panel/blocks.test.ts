import type { KirbyAnyFieldProps, KirbyBlock } from "kirby-types";
import { describe, expect, it, vi } from "vitest";
import { useBlocks } from "../../src/panel/composables/blocks";

vi.mock("kirbyuse", () => ({
  usePanel: vi.fn(),
}));

const HEADING: KirbyBlock = {
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

describe("getFieldBlockElementKeys", () => {
  const { getFieldBlockElementKeys } = useBlocks();

  it("keys a block anew once it moves to the next column in reading order", () => {
    const field = {
      type: "layout",
      fieldsets: {},
      layouts: [["1/2", "1/2"]],
    } as KirbyAnyFieldProps;
    const rows = (left: KirbyBlock[], right: KirbyBlock[]) => [
      {
        id: "row",
        columns: [
          { id: "left", blocks: left },
          { id: "right", blocks: right },
        ],
      },
    ];

    expect(getFieldBlockElementKeys(field, rows([HEADING], []))).not.toEqual(
      getFieldBlockElementKeys(field, rows([], [HEADING])),
    );
  });
});
