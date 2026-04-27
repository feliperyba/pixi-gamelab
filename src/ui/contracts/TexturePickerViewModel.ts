import type { TextStyleOptions, Texture } from 'pixi.js';
import type { PixiNineSliceInsets } from './PixiNineSliceInsets';

export interface TextureOptionEntry {
  readonly key: string;
  readonly thumbnail: Texture;
}

export interface TexturePickerViewModel {
  readonly label: string;
  readonly options: readonly TextureOptionEntry[];
  readonly initialKeys: readonly string[];
  readonly onChange: (keys: string[]) => void;
}

export interface PixiTexturePickerSkin {
  cellTexture: Texture;
  cellInsets: PixiNineSliceInsets;
  normalTint: number;
  selectedTint: number;
  labelStyle: TextStyleOptions;
}

export interface PixiTexturePickerLayout {
  cellSize: number;
  cellGap: number;
  previewPadding: number;
  labelY: number;
  gridY: number;
  maxColumns: number;
}
