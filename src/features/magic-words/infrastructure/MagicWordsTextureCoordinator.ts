import type {
  DialogueMessageModel,
  EmojiDefinition,
} from '@/features/magic-words/application/MagicWordsModels';
import {
  collectAvatarSources,
  collectEmojiSources,
} from '@/features/magic-words/application/MagicWordsTextureSources';
import type { Texture } from 'pixi.js';
import type { RemoteTextureResolver } from './RemoteTextureResolver';

export class MagicWordsTextureCoordinator {
  private readonly remoteTextures: RemoteTextureResolver;

  constructor(remoteTextures: RemoteTextureResolver) {
    this.remoteTextures = remoteTextures;
  }

  async resolveEmojiTextures(
    emojis: readonly EmojiDefinition[],
  ): Promise<ReadonlyMap<string, Texture>> {
    return this.resolveTextureMap(collectEmojiSources(emojis), 'emoji', null);
  }

  async resolveAvatarTextures(
    messages: readonly DialogueMessageModel[],
    fallbackTexture: Texture,
  ): Promise<ReadonlyMap<string, Texture>> {
    return this.resolveTextureMap(
      collectAvatarSources(messages),
      'avatar',
      fallbackTexture,
    );
  }

  async dispose(): Promise<void> {
    await this.remoteTextures.dispose();
  }

  private async resolveTextureMap(
    sources: ReadonlyMap<string, string | undefined>,
    aliasPrefix: string,
    fallbackTexture: Texture | null,
  ): Promise<ReadonlyMap<string, Texture>> {
    const resolved = new Map<string, Texture>();
    const jobs: Promise<void>[] = [];

    for (const [key, url] of sources) {
      jobs.push(
        this.remoteTextures
          .resolve(`${aliasPrefix}-${key}`, url, fallbackTexture)
          .then((texture) => {
            if (texture) {
              resolved.set(key, texture);
            }
          }),
      );
    }

    await Promise.all(jobs);
    return resolved;
  }
}
