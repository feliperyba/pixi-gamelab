import { MENU } from '@/features/menu/config/MenuConfig';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import { ensureAssetBundle } from '@/infrastructure/ensureAssetBundle';
import { Assets, type Texture } from 'pixi.js';

export interface MenuSceneTextures {
  logo: Texture;
  buttonFace: Texture;
  buttonDepth: Texture;
  symbol1: Texture;
  symbol2: Texture;
}

const MENU_SVG_BUNDLE_ID = ensureAssetBundle('scene-menu-svg', [
  {
    alias: 'menu-logo',
    src: 'brand/pixijs-logo.svg',
    data: {
      width: MENU.layout.logo.assetWidth,
      height: MENU.layout.logo.assetHeight,
      resolution: MENU.layout.logo.assetResolution,
    },
  },
]);

export async function loadMenuTextures(
  atlas: AtlasTextures,
): Promise<MenuSceneTextures> {
  const raw = (await Assets.loadBundle(MENU_SVG_BUNDLE_ID)) as Record<
    string,
    Texture
  >;

  return {
    logo: raw['menu-logo'],
    buttonFace: atlas['button_rectangle'],
    buttonDepth: atlas['button_rectangle_depth'],
    symbol1: atlas['symbol_01'],
    symbol2: atlas['symbol_02'],
  };
}

export async function unloadMenuTextures(): Promise<void> {
  await Assets.unloadBundle(MENU_SVG_BUNDLE_ID);
}
