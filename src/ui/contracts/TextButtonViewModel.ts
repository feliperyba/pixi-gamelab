export interface TextButtonViewModel {
  label: string;
  onActivate: () => void;
}

export interface TextButtonLayout {
  width: number;
  height: number;
  labelAnchorX: number;
  labelAnchorY: number;
  labelX: number;
  labelY: number;
}
