import type { KirbyAnyFieldProps } from "kirby-types";
import type { PanelViewColumn } from "../types";
import { usePanel } from "kirbyuse";
import { computed } from "vue";
import { EXCLUDED_FIELD_TYPES } from "../constants";

export function useTabFields() {
  const panel = usePanel();

  return computed<Record<string, KirbyAnyFieldProps>>(() => {
    const columns = (panel.view.props.tab?.columns ?? []) as
      PanelViewColumn[] | Record<string, PanelViewColumn>;

    return Object.fromEntries(
      Object.values(columns)
        .flatMap((column) => Object.entries(column.fields))
        .filter(([, field]) => !EXCLUDED_FIELD_TYPES.has(field.type)),
    );
  });
}
