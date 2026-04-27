import type { TextStyleOptions, Texture } from 'pixi.js';
import type { PixiNineSliceInsets } from './PixiNineSliceInsets';

export interface CounterBadgeSkin {
  panelTint?: number;
  labelStyle: TextStyleOptions;
  valueStyle: TextStyleOptions;
  panelInsets: PixiNineSliceInsets;
  panelTexture: Texture;
}

export interface CounterBadgeLayout {
  width: number;
  height: number;
  paddingX: number;
}
