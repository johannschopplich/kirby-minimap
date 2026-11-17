import { describe, expect, it, vi } from "vitest";
import { useTabFields } from "../../src/panel/composables/tab-fields";

const view: { props: Record<string, unknown> } = { props: {} };

vi.mock("kirbyuse", () => ({
  usePanel: () => ({ view }),
}));

const TEXT_FIELD = { name: "dates", type: "text" };
const COLUMN = { fields: { dates: TEXT_FIELD, divider: { type: "line" } } };

describe("useTabFields", () => {
  it.each([
    ["a record", { main: COLUMN }],
    ["an array", [COLUMN]],
  ])(
    "collects the fields of columns given as %s, leaving out `line` fields",
    (_, columns) => {
      view.props = { tab: { columns } };

      expect(useTabFields().value).toEqual({ dates: TEXT_FIELD });
    },
  );

  it("returns no fields for a view without a tab", () => {
    view.props = {};

    expect(useTabFields().value).toEqual({});
  });
});
