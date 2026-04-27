import { MENU } from '@/features/menu/config/MenuConfig';
import type { PixiNineSliceInsets } from '@/ui/contracts/PixiNineSliceInsets';
import type { PixiTextButtonSkin } from '@/ui/contracts/PixiTextButtonSkin';
import { BRAND } from '@/ui/theme/BrandTokens';
import { TextStyle } from 'pixi.js';
import type { MenuSceneTextures } from '../infrastructure/MenuAssetBundle';

const BUTTON_INSETS: PixiNineSliceInsets = {
  left: MENU.nineSlice.buttonDepth.left,
  top: MENU.nineSlice.buttonDepth.top,
  right: MENU.nineSlice.buttonDepth.right,
  bottom: MENU.nineSlice.buttonDepth.bottom,
};

export function createSubtitleStyle(): TextStyle {
  return new TextStyle({
    fontFamily: BRAND.fonts.heading,
    fontSize: MENU.styles.subtitle.fontSize,
    fontWeight: MENU.styles.subtitle.fontWeight,
    fill: BRAND.palette.secondaryHover,
  });
}

function createButtonLabelStyle(): TextStyle {
  return new TextStyle({
    fontFamily: BRAND.fonts.heading,
    fontSize: MENU.styles.buttonLabel.fontSize,
    fontWeight: MENU.styles.buttonLabel.fontWeight,
    fill: BRAND.palette.white,
  });
}

export function createMenuButtonSkin(
  textures: MenuSceneTextures,
): PixiTextButtonSkin {
  return {
    faceTexture: textures.buttonFace,
    depthTexture: textures.buttonDepth,
    insets: BUTTON_INSETS,
    labelStyle: createButtonLabelStyle(),
    normalTint: BRAND.palette.primary,
    hoverTint: BRAND.palette.primaryHover,
    pressOffsetY: MENU.button.pressY,
    depthOffsetY: MENU.layout.buttonDepthOffsetY,
  };
}
