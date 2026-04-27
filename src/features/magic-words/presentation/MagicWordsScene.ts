import { buildDialogueFeed } from '@/features/magic-words/application/MagicWordsDialogueBuilder';
import type {
  DialogueMessageModel,
  EmojiDefinition,
  MagicWordsPayload,
} from '@/features/magic-words/application/MagicWordsModels';
import type { MagicWordsPayloadSource } from '@/features/magic-words/application/MagicWordsPayloadSource';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import type { SharedUITextures } from '@/infrastructure/SharedUIBundle';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import type { Scene } from '@/runtime/scene/Scene';
import { SceneId } from '@/runtime/scene/SceneId';
import type { Viewport } from '@/runtime/viewport/ViewportService';
import { GAME_VIEWPORT } from '@/runtime/viewport/ViewportService';
import { Container } from 'pixi.js';
import { MagicWordsTextureCoordinator } from '../infrastructure/MagicWordsTextureCoordinator';
import type { RemoteTextureResolver } from '../infrastructure/RemoteTextureResolver';
import { MagicWordsSceneView } from './MagicWordsSceneView';

export class MagicWordsScene extends Container implements Scene {
  readonly id = SceneId.MagicWords;

  private readonly atlas: AtlasTextures;
  private readonly shared: SharedUITextures;
  private readonly textures: MagicWordsTextureCoordinator;
  private readonly dataSource: MagicWordsPayloadSource;

  private view: MagicWordsSceneView | null = null;

  private initialized = false;
  private viewWidth = GAME_VIEWPORT.width;
  private viewHeight = GAME_VIEWPORT.height;

  constructor(
    dataSource: MagicWordsPayloadSource,
    remoteTextures: RemoteTextureResolver,
    shared: SharedUITextures,
    atlas: AtlasTextures,
  ) {
    super();

    this.atlas = atlas;
    this.shared = shared;
    this.dataSource = dataSource;

    this.textures = new MagicWordsTextureCoordinator(remoteTextures);
  }

  async enter(): Promise<void> {
    this.view = new MagicWordsSceneView();

    await this.view.init(this.shared, this.atlas);
    this.view.attachTo(this);

    this.initialized = true;
    this.view.layout(this.viewWidth, this.viewHeight);

    this.view.startCurtainIdle();
    const payload = await this.loadPayloadWithMinimumHold();

    if (!payload || payload.dialogue.length === 0) {
      await this.presentEmptyState();
      return;
    }

    await this.presentDialogue(payload);
  }

  async exit(): Promise<void> {
    this.initialized = false;

    this.view?.dispose();
    await this.view?.unloadAssets();
    this.view = null;

    this.removeChildren();
    await this.textures.dispose();
  }

  update(): void {}

  resize(viewport: Viewport): void {
    this.viewWidth = viewport.width;
    this.viewHeight = viewport.height;

    if (!this.initialized) {
      return;
    }

    this.view?.layout(this.viewWidth, this.viewHeight);
  }

  private async loadPayloadWithMinimumHold(): Promise<MagicWordsPayload | null> {
    const [payload] = await Promise.all([
      this.dataSource.load(),
      this.wait(MAGIC.transition.minHoldMs),
    ]);

    return payload;
  }

  private async presentEmptyState(): Promise<void> {
    this.view?.showEmptyState(
      'No dialogue could be loaded from the local showcase payload.',
    );

    this.view?.layoutContent();
    await this.view?.hideCurtain();
  }

  private async presentDialogue(payload: MagicWordsPayload): Promise<void> {
    const dialogueFeed = buildDialogueFeed(payload);
    this.view?.renderMessages(dialogueFeed.messages);

    await this.resolveRemoteTextures(dialogueFeed.messages, payload.emojis);
    if (!this.initialized) {
      return;
    }

    this.view?.layoutContent();
    await this.view?.hideCurtain();
    this.view?.playSequence();
  }

  private async resolveRemoteTextures(
    messages: readonly DialogueMessageModel[],
    emojis: readonly EmojiDefinition[],
  ): Promise<void> {
    const fallbackTexture = this.view?.fallbackAvatarTexture;
    if (!fallbackTexture) {
      return;
    }

    const [emojiCache, avatarCache] = await Promise.all([
      this.textures.resolveEmojiTextures(emojis),
      this.textures.resolveAvatarTextures(messages, fallbackTexture),
    ]);

    if (!this.initialized) {
      return;
    }

    this.view?.applyEmojiTextures(emojiCache);
    this.view?.applyAvatarTextures(messages, avatarCache, fallbackTexture);
  }

  private wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, durationMs);
    });
  }
}
