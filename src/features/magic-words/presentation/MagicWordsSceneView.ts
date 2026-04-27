import type { DialogueMessageModel } from '@/features/magic-words/application/MagicWordsModels';
import {
  computeMagicWordsSceneLayout,
  type MagicWordsSceneLayout,
} from '@/features/magic-words/application/MagicWordsSceneLayout';
import type { SharedUITextures } from '@/infrastructure/SharedUIBundle';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import type { Texture } from 'pixi.js';
import { Container } from 'pixi.js';
import { DialogueSequencer } from './DialogueSequencer';
import {
  loadMagicWordsPixiSkin,
  type MagicWordsPixiSkin,
  unloadMagicWordsPixiSkin,
} from './loadMagicWordsPixiSkin';
import { PixiMagicWordsShellView } from './PixiMagicWordsShellView';
import { PixiMagicWordsTranscriptView } from './PixiMagicWordsTranscriptView';

export class MagicWordsSceneView {
  private skin: MagicWordsPixiSkin | null = null;
  private shellView: PixiMagicWordsShellView | null = null;
  private transcriptView: PixiMagicWordsTranscriptView | null = null;
  private sceneLayout: MagicWordsSceneLayout | null = null;
  private emptyStateMessage: string | null = null;

  private readonly sequencer: DialogueSequencer;

  constructor() {
    this.sequencer = new DialogueSequencer(
      () => this.layoutContent(),
      (immediate) => this.transcriptView?.scrollToLatest(immediate),
    );
  }

  get fallbackAvatarTexture(): Texture | null {
    return this.skin?.fallbackAvatarTexture ?? null;
  }

  attachTo(parent: Container): void {
    if (this.shellView) {
      parent.addChild(this.shellView);
    }
  }

  async init(shared: SharedUITextures, atlas: AtlasTextures): Promise<void> {
    this.skin = await loadMagicWordsPixiSkin(shared, atlas);

    this.transcriptView = new PixiMagicWordsTranscriptView(this.skin, () =>
      this.sequencer.handleAdvance(),
    );

    this.shellView = new PixiMagicWordsShellView(
      this.skin,
      this.transcriptView,
    );
  }

  layout(viewWidth: number, viewHeight: number): void {
    if (!this.skin || !this.shellView || !this.transcriptView) {
      return;
    }

    const layout = computeMagicWordsSceneLayout(viewWidth, viewHeight);

    this.sceneLayout = layout;
    this.shellView.layoutChrome(layout, viewWidth, viewHeight);

    this.layoutContent(layout);
  }

  layoutContent(layout: MagicWordsSceneLayout | null = this.sceneLayout): void {
    if (!layout || !this.shellView || !this.transcriptView) {
      return;
    }

    this.transcriptView.layout(
      layout.shell,
      layout.feed,
      this.sequencer.revealedCount,
    );

    this.syncShellState(layout);
  }

  startCurtainIdle(): void {
    this.shellView?.setCurtainSubtitle(
      'Rebuilding the mobile conversation view',
    );
    this.shellView?.setCurtainStatus('Preparing transcript stream...');

    if (this.shellView) {
      this.sequencer.startCurtainIdle(this.shellView.curtain);
    }
  }

  async hideCurtain(): Promise<void> {
    if (this.shellView) {
      await this.sequencer.hideCurtain(this.shellView.curtain);
    }
  }

  renderMessages(messages: readonly DialogueMessageModel[]): void {
    this.emptyStateMessage = null;
    this.transcriptView?.renderMessages(messages);
  }

  showEmptyState(message: string): void {
    this.emptyStateMessage = message;
  }

  applyEmojiTextures(emojiTextures: ReadonlyMap<string, Texture>): void {
    this.transcriptView?.applyEmojiTextures(emojiTextures);
  }

  applyAvatarTextures(
    messages: readonly DialogueMessageModel[],
    avatarTextures: ReadonlyMap<string, Texture>,
    fallbackTexture: Texture,
  ): void {
    this.transcriptView?.applyAvatarTextures(
      messages,
      avatarTextures,
      fallbackTexture,
    );
  }

  playSequence(): void {
    this.sequencer.play(this.transcriptView?.rowViews ?? []);
  }

  dispose(): void {
    this.sequencer.dispose(this.shellView?.curtain ?? null);
    this.transcriptView?.dispose();

    this.sceneLayout = null;
    this.emptyStateMessage = null;

    if (this.shellView) {
      this.shellView.destroy({ children: true });
    }

    this.skin = null;
    this.shellView = null;
    this.transcriptView = null;
  }

  async unloadAssets(): Promise<void> {
    await unloadMagicWordsPixiSkin();
  }

  private syncShellState(
    layout: MagicWordsSceneLayout | null = this.sceneLayout,
  ): void {
    if (!this.shellView) {
      return;
    }

    this.shellView.updateStatus({
      emptyMessage: this.emptyStateMessage,
      hasRows: this.transcriptView?.hasRows ?? false,
      hasOverflow: this.transcriptView?.hasOverflow ?? false,
      isSequenceFinished: this.sequencer.isFinished,
    });

    if (layout) {
      this.shellView.layoutFooter(layout);
    }
  }
}
