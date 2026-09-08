import type { KirbyAnyFieldProps } from "kirby-types";
import type { PanelViewColumn, PanelViewTab } from "../types";
import { usePanel } from "kirbyuse";
import {
  EXCLUDED_FIELD_TYPES,
  PLUGIN_MODEL_FIELDS_API_ROUTE,
} from "../constants";

export function useModelFields() {
  const panel = usePanel();

  /**
   * Returns the fields of the current view's model that the sidebar lists,
   * keyed in lower case the way Kirby stores content.
   */
  async function getModelFields(): Promise<Record<string, KirbyAnyFieldProps>> {
    const modelFields = await panel.api.get<Record<string, KirbyAnyFieldProps>>(
      PLUGIN_MODEL_FIELDS_API_ROUTE,
      { id: panel.view.path },
      undefined,
      /* silent */ true,
    );

    const tabFieldNames =
      panel.view.props.tabs && panel.view.props.tabs.length > 1
        ? currentTabFieldNames()
        : undefined;

    return Object.fromEntries(
      Object.entries(modelFields).filter(
        ([name, field]) =>
          !EXCLUDED_FIELD_TYPES.has(field.type) &&
          (!tabFieldNames || tabFieldNames.has(name)),
      ),
    );
  }

  /**
   * Returns the names of the fields the current tab holds, in lower case; the
   * view props keep the blueprint's spelling.
   */
  function currentTabFieldNames() {
    const fieldNames = new Set<string>();
    const tab: PanelViewTab = panel.view.props.tab;
    const columns: PanelViewColumn[] = Array.isArray(tab.columns)
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

  return {
    getModelFields,
  };
}
