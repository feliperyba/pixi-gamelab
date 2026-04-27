import type { Texture } from 'pixi.js';
import { Assets } from 'pixi.js';

export type AtlasTextures = Record<string, Texture>;

export async function loadGameAtlas(): Promise<AtlasTextures> {
  const sheet = (await Assets.load('texture.json')) as {
    textures: AtlasTextures;
  };

  return sheet.textures;
}
