import type { Texture } from 'pixi.js';

export interface RemoteTextureResolver {
  resolve(
    alias: string,
    rawUrl: string | undefined,
    fallback: Texture | null,
  ): Promise<Texture | null>;

  dispose(): Promise<void>;
}
