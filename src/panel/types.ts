import type { KirbyAnyFieldProps } from "kirby-types";

export interface MinimapBlock {
  id?: string;
  icon: string;
  text: string;
  isActive?: boolean;
}

export interface MinimapField {
  name?: string;
  label: string;
  required?: boolean;
  isActive?: boolean;
  blocks?: MinimapBlock[];
}

/**
 * The slice of a view tab's column the sidebar reads. kirby-types leaves a
 * column's props untyped, so the shape lives here.
 */
export interface PanelViewColumn {
  fields: Record<string, KirbyAnyFieldProps>;
}
