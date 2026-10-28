import type { Panel } from "kirby-types";
import { setActivePanel } from "kirbyuse";
import { afterEach, describe, expect, it } from "vitest";
import { useTabFields } from "../../src/panel/composables/tab-fields";

const TEXT_FIELD = { name: "dates", type: "text" };
const COLUMN = { fields: { dates: TEXT_FIELD, divider: { type: "line" } } };

describe("useTabFields", () => {
  afterEach(() => setActivePanel(undefined));

  it.each([
    ["a record", { main: COLUMN }],
    ["an array", [COLUMN]],
  ])(
    "collects the fields of columns given as %s, leaving out `line` fields",
    (_, columns) => {
      setActivePanel({
        view: { props: { tab: { columns } } },
      } as unknown as Panel);

      expect(useTabFields().value).toEqual({ dates: TEXT_FIELD });
    },
  );

  it("returns no fields for a view without a tab", () => {
    setActivePanel({ view: { props: {} } } as unknown as Panel);

    expect(useTabFields().value).toEqual({});
  });
});
