import type { TextStyleOptions, Texture } from 'pixi.js';
import type { PixiNineSliceInsets } from './PixiNineSliceInsets';

export interface PixiTextButtonSkin {
  faceTexture: Texture;
  depthTexture?: Texture;
  insets: PixiNineSliceInsets;
  labelStyle: TextStyleOptions;
  pressOffsetY?: number;
  depthOffsetY?: number;
  normalTint?: number;
  hoverTint?: number;
}
