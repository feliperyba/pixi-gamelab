import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import type { RemoteTextureResolver } from '@/features/magic-words/infrastructure/RemoteTextureResolver';
import { Texture } from 'pixi.js';

export class RemoteTextureCache implements RemoteTextureResolver {
  private readonly cache = new Map<string, Promise<Texture | null>>();
  private readonly pendingControllers = new Set<AbortController>();

  // Scene exit disposes this cache aggressively, so callers must treat an instance as single-scene state and create a fresh one on re-entry.
  private disposed = false;

  async resolve(
    alias: string,
    rawUrl: string | undefined,
    fallback: Texture | null,
  ): Promise<Texture | null> {
    if (this.disposed || !rawUrl) {
      return fallback;
    }

    const cached = this.cache.get(alias);
    if (cached) {
      return (await cached) ?? fallback;
    }

    const url = this.normalizeUrl(rawUrl);
    if (!url) {
      return fallback;
    }

    const promise = this.fetchTexture(url);
    this.cache.set(alias, promise);

    return (await promise) ?? fallback;
  }

  private async fetchTexture(url: string): Promise<Texture | null> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      MAGIC.fetchTimeoutMs,
    );

    this.pendingControllers.add(controller);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      if (this.disposed) {
        bitmap.close();
        return null;
      }

      return Texture.from(bitmap);
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeoutId);
      this.pendingControllers.delete(controller);
    }
  }

  async dispose(): Promise<void> {
    this.disposed = true;

    for (const controller of this.pendingControllers) {
      controller.abort();
    }

    const textures = await Promise.all(this.cache.values());
    for (const texture of textures) {
      texture?.destroy(true);
    }

    this.cache.clear();
  }

  private normalizeUrl(rawUrl: string): string | null {
    try {
      const parsed = new URL(rawUrl, window.location.href);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      return parsed.toString();
    } catch {
      return null;
    }
  }
}
