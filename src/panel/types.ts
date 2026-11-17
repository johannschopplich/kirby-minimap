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
