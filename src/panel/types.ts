import type {
  KirbyBlockValue,
  KirbyFieldProps,
  KirbyFieldsetProps,
} from "kirby-types";

/**
 * A field as the `__minimap__/model-fields` API endpoint returns it: Kirby's
 * own field props, with the fieldsets a blocks field carries.
 */
export interface MinimapModelField extends KirbyFieldProps {
  fieldsets?: Record<string, KirbyFieldsetProps>;
}

/** A block with what the sidebar resolves for its own entry. */
export interface MinimapBlock extends KirbyBlockValue {
  _icon: string;
  _text: string;
  _active: boolean;
}

export interface MinimapField extends MinimapModelField {
  blocks: MinimapBlock[];
  _active: boolean;
}

/**
 * The slice of a view's tab props the sidebar reads. Kirby types `panel.view.props`
 * as a bag of `any`, so the shape lives here.
 */
export interface MinimapViewTab {
  columns: MinimapViewColumn[] | Record<string, MinimapViewColumn>;
}

export interface MinimapViewColumn {
  sections: Record<string, MinimapViewSection>;
}

export interface MinimapViewSection {
  type: string;
  fields?: Record<string, KirbyFieldProps>;
}
