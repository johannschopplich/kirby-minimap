import type {
  KirbyAnyFieldProps,
  KirbyBlockValue,
  KirbyFieldProps,
} from "kirby-types";

export interface ResolvedBlock extends KirbyBlockValue {
  icon: string;
  text: string;
  isActive: boolean;
}

/** `blocks` is empty for every field type but `blocks`. */
export type ResolvedField = KirbyAnyFieldProps & {
  blocks: ResolvedBlock[];
  isActive: boolean;
};

/**
 * The slice of a view's tab props the sidebar reads. Kirby types
 * `panel.view.props` as a bag of `any`, so the shape lives here.
 */
export interface PanelViewTab {
  columns: PanelViewColumn[] | Record<string, PanelViewColumn>;
}

export interface PanelViewColumn {
  sections: Record<string, PanelViewSection>;
}

export interface PanelViewSection {
  type: string;
  fields?: Record<string, KirbyFieldProps>;
}
