import { HUD } from '@/ui/components/HudConfig';
import type { HudPixiSkin } from '@/ui/contracts/HudPixiSkin';
import { BRAND } from '@/ui/theme/BrandTokens';
import type { Texture } from 'pixi.js';
import { TextStyle } from 'pixi.js';
import type { AtlasTextures } from './SpritesheetBundle';

export interface SharedUITextures {
  buttonSquare: Texture;
  buttonSquareDepth: Texture;
  metalPanel: Texture;
  metalPanelRed: Texture;
}

export function createSharedUITextures(atlas: AtlasTextures): SharedUITextures {
  return {
    buttonSquare: atlas['button_square'],
    buttonSquareDepth: atlas['button_square_depth'],
    metalPanel: atlas['metalPanel'],
    metalPanelRed: atlas['metalPanel_red'],
  };
}

const backBtnStyle = new TextStyle({
  fontFamily: BRAND.fonts.body,
  fontSize: HUD.backBtn.fontSize,
  fill: BRAND.palette.white,
  fontWeight: '600',
});

export function createHudPixiSkin(shared: SharedUITextures): HudPixiSkin {
  return {
    backButton: {
      faceTexture: shared.buttonSquare,
      depthTexture: shared.buttonSquareDepth,
      insets: HUD.insets,
      labelStyle: backBtnStyle,
      pressOffsetY: 2,
      depthOffsetY: 2,
      normalTint: BRAND.palette.primary,
      hoverTint: BRAND.palette.primaryHover,
    },
  };
}
