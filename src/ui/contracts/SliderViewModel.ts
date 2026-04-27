import type { TextStyleOptions, Texture } from 'pixi.js';
import type { PixiNineSliceInsets } from './PixiNineSliceInsets';

export interface SliderViewModel {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly initial: number;
  readonly onChange: (value: number) => void;
  readonly formatValue?: (v: number) => string;
}

export interface PixiSliderSkin {
  trackTexture: Texture;
  trackInsets: PixiNineSliceInsets;
  trackTint?: number;
  fillTexture: Texture;
  fillInsets: PixiNineSliceInsets;
  fillTint?: number;
  handleTexture: Texture;
  handleInsets: PixiNineSliceInsets;
  handleTint?: number;
  labelStyle: TextStyleOptions;
  valueStyle: TextStyleOptions;
}

export interface PixiSliderLayout {
  width: number;
  trackHeight: number;
  handleWidth: number;
  handleHeight: number;
  labelY: number;
  trackY: number;
}
