import type {
  KirbyAnyFieldProps,
  PanelViewProps,
  PanelViewPropsTabColumn,
} from "kirby-types";
import { usePanel } from "kirbyuse";
import { computed } from "vue";
import { EXCLUDED_FIELD_TYPES } from "../constants";

export function useTabFields() {
  const panel = usePanel();

  return computed<Record<string, KirbyAnyFieldProps>>(() => {
    const { tab } = panel.view.props as PanelViewProps;

    return Object.fromEntries(
      Object.values<PanelViewPropsTabColumn>(tab?.columns ?? [])
        .flatMap((column) => Object.entries(column.fields))
        .filter(([, field]) => !EXCLUDED_FIELD_TYPES.has(field.type)),
    );
  });
}
