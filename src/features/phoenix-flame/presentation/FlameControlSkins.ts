import type { SharedUITextures } from '@/infrastructure/SharedUIBundle';
import type { PixiTextButtonSkin } from '@/ui/contracts/PixiTextButtonSkin';
import type { PixiSliderSkin } from '@/ui/contracts/SliderViewModel';
import type { PixiTexturePickerSkin } from '@/ui/contracts/TexturePickerViewModel';
import { BRAND } from '@/ui/theme/BrandTokens';
import type { TextStyleOptions } from 'pixi.js';
import { PANEL_INSETS, PANEL_WIDTH, SKIN } from '../config/PanelLayout';

// Text style options (plain data — PixiJS Text accepts these directly)
export const TITLE_STYLE: TextStyleOptions = {
  fontFamily: BRAND.fonts.heading,
  fontSize: SKIN.fontSize.title,
  fill: BRAND.palette.white,
  fontWeight: 'bold',
} as const;

export const PAGE_STYLE: TextStyleOptions = {
  fontFamily: BRAND.fonts.heading,
  fontSize: SKIN.fontSize.page,
  fill: SKIN.textLight,
  fontWeight: 'bold',
} as const;

export const NOTE_STYLE: TextStyleOptions = {
  fontFamily: BRAND.fonts.body,
  fontSize: SKIN.fontSize.note,
  fill: SKIN.textMuted,
  wordWrap: true,
  wordWrapWidth: PANEL_WIDTH - SKIN.noteWrapInset,
  lineHeight: SKIN.noteLineHeight,
} as const;

export const SECTION_STYLE: TextStyleOptions = {
  fontFamily: BRAND.fonts.heading,
  fontSize: SKIN.fontSize.section,
  fill: SKIN.textLight,
  fontWeight: 'bold',
} as const;

const LABEL_STYLE: TextStyleOptions = {
  fontFamily: BRAND.fonts.body,
  fontSize: SKIN.fontSize.label,
  fill: BRAND.palette.white,
} as const;

const VALUE_STYLE: TextStyleOptions = {
  fontFamily: BRAND.fonts.body,
  fontSize: SKIN.fontSize.label,
  fill: BRAND.palette.primary,
  fontWeight: 'bold',
} as const;

// Skin factories
export function buildSliderSkin(shared: SharedUITextures): PixiSliderSkin {
  return {
    trackTexture: shared.metalPanel,
    trackInsets: PANEL_INSETS,
    trackTint: SKIN.trackTint,
    fillTexture: shared.metalPanelRed,
    fillInsets: PANEL_INSETS,
    fillTint: BRAND.palette.primary,
    handleTexture: shared.buttonSquare,
    handleInsets: PANEL_INSETS,
    handleTint: BRAND.palette.white,
    labelStyle: LABEL_STYLE,
    valueStyle: VALUE_STYLE,
  };
}

export function buildPickerSkin(
  shared: SharedUITextures,
): PixiTexturePickerSkin {
  return {
    cellTexture: shared.metalPanel,
    cellInsets: PANEL_INSETS,
    normalTint: SKIN.cellNormalTint,
    selectedTint: BRAND.palette.primary,
    labelStyle: LABEL_STYLE,
  };
}

export function buildButtonSkin(shared: SharedUITextures): PixiTextButtonSkin {
  return {
    faceTexture: shared.buttonSquare,
    depthTexture: shared.buttonSquareDepth,
    insets: PANEL_INSETS,
    labelStyle: {
      fontFamily: BRAND.fonts.body,
      fontSize: SKIN.fontSize.button,
      fill: BRAND.palette.white,
      fontWeight: 'bold',
    },
    normalTint: BRAND.palette.primary,
    hoverTint: SKIN.hoverTint,
    pressOffsetY: SKIN.button.pressOffsetY,
    depthOffsetY: SKIN.button.depthOffsetY,
  };
}
