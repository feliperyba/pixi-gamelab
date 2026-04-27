import type { DialogueMessageModel } from '@/features/magic-words/application/MagicWordsModels';
import type {
  FeedViewportMetrics,
  ShellMetrics,
} from '@/features/magic-words/application/MagicWordsSceneLayout';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { BRAND } from '@/ui/theme/BrandTokens';
import { Container, Graphics, Rectangle, type Texture } from 'pixi.js';
import { DialogueScrollController } from './DialogueScrollController';
import type { MagicWordsPixiSkin } from './loadMagicWordsPixiSkin';
import { PixiDialogueRow } from './PixiDialogueRow';

export class PixiMagicWordsTranscriptView extends Container {
  private readonly skin: MagicWordsPixiSkin;
  private readonly scroller: DialogueScrollController;

  private readonly feedContent = new Container();
  private readonly feedViewport = new Container();
  private readonly feedMask = new Graphics();
  private readonly feedBackdrop = new Graphics();

  private rows: PixiDialogueRow[] = [];
  private maskedViewportWidth = 0;
  private maskedViewportHeight = 0;

  constructor(skin: MagicWordsPixiSkin, onAdvance: () => void) {
    super();

    this.skin = skin;

    this.feedViewport.mask = this.feedMask;
    this.feedViewport.addChild(this.feedContent);
    this.feedViewport.addChild(this.feedMask);

    this.feedBackdrop.alpha = MAGIC.feed.backdropAlpha;
    this.addChild(this.feedBackdrop);
    this.addChild(this.feedViewport);

    this.scroller = new DialogueScrollController(
      this.feedContent,
      this.feedViewport,
      onAdvance,
    );

    this.addChild(this.scroller.track);
    this.addChild(this.scroller.thumb);
  }

  get rowViews(): readonly PixiDialogueRow[] {
    return this.rows;
  }

  get hasRows(): boolean {
    return this.rows.length > 0;
  }

  get hasOverflow(): boolean {
    return this.scroller.hasOverflow;
  }

  scrollToLatest(immediate: boolean): void {
    this.scroller.scrollToLatest(immediate);
  }

  renderMessages(messages: readonly DialogueMessageModel[]): void {
    this.clearMessages();

    for (const message of messages) {
      const row = new PixiDialogueRow(message, this.skin);
      row.visible = false;

      this.rows.push(row);
      this.feedContent.addChild(row);
    }
  }

  applyEmojiTextures(emojiTextures: ReadonlyMap<string, Texture>): void {
    for (const row of this.rows) {
      row.setEmojiTextures(emojiTextures);
    }
  }

  applyAvatarTextures(
    messages: readonly DialogueMessageModel[],
    avatarTextures: ReadonlyMap<string, Texture>,
    fallbackTexture: Texture,
  ): void {
    for (let index = 0; index < this.rows.length; index++) {
      const message = messages[index];
      if (!message) {
        continue;
      }

      const texture = avatarTextures.get(message.speakerKey) ?? fallbackTexture;
      this.rows[index].setAvatarTexture(texture);
    }
  }

  layout(
    shell: ShellMetrics,
    feed: FeedViewportMetrics,
    revealedCount: number,
  ): void {
    this.feedBackdrop
      .clear()
      .roundRect(0, 0, shell.vpW, shell.vpH, MAGIC.feed.maskRadius)
      .fill(MAGIC.palette.feedWellTint)
      .roundRect(
        feed.scrollLaneX,
        feed.scrollLaneY,
        feed.scrollLaneWidth,
        feed.scrollLaneHeight,
        MAGIC.feed.scrollLaneRadius,
      )
      .fill({
        color: MAGIC.palette.scrollTrack,
        alpha: MAGIC.feed.scrollLaneAlpha,
      });

    this.feedBackdrop.position.set(shell.vpX, shell.vpY);
    this.feedViewport.position.set(shell.vpX, shell.vpY);
    this.feedViewport.hitArea = new Rectangle(0, 0, shell.vpW, shell.vpH);

    this.updateFeedMask(shell.vpW, shell.vpH);
    let y = feed.transcriptInsetY;

    for (let index = 0; index < this.rows.length; index++) {
      const row = this.rows[index];

      row.setRowWidth(feed.transcriptWidth);
      row.position.set(feed.transcriptInsetX, y);
      row.visible = index < revealedCount;

      if (index < revealedCount) {
        y += row.rowHeight + MAGIC.shell.rowGap;
      }
    }

    const contentHeight = Math.max(
      feed.transcriptInsetY * 2,
      y - MAGIC.shell.rowGap + feed.transcriptInsetY,
    );

    this.scroller.setContentHeight(contentHeight);
    this.scroller.applyScroll(this.scroller.offset);

    this.scroller.layout(
      feed.scrollTrackX,
      feed.scrollTrackY,
      feed.scrollTrackHeight,
    );
  }

  dispose(): void {
    this.clearMessages();

    this.scroller.dispose();
    this.feedBackdrop.clear();
    this.feedMask.clear();

    this.maskedViewportWidth = 0;
    this.maskedViewportHeight = 0;
  }

  private clearMessages(): void {
    const contentChildren = this.feedContent.removeChildren();
    for (const child of contentChildren) {
      child.destroy({ children: true });
    }

    this.rows = [];
    this.scroller.setContentHeight(0);
    this.scroller.applyScroll(0);
  }

  private updateFeedMask(width: number, height: number): void {
    if (
      this.maskedViewportWidth === width &&
      this.maskedViewportHeight === height
    ) {
      return;
    }

    this.maskedViewportWidth = width;
    this.maskedViewportHeight = height;

    this.feedMask
      .clear()
      .roundRect(0, 0, width, height, MAGIC.feed.maskRadius)
      .fill(BRAND.palette.white);
  }
}
