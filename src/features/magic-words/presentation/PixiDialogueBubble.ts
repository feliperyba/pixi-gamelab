import type {
  DialogueSide,
  InlineToken,
} from '@/features/magic-words/application/MagicWordsModels';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { PixiNineSlicePanel } from '@/ui/components/PixiNineSlicePanel';
import type { PixiNineSliceInsets } from '@/ui/contracts/PixiNineSliceInsets';
import {
  Container,
  Graphics,
  Text,
  type TextStyle,
  type Texture,
} from 'pixi.js';
import { PixiInlineMessage } from './PixiInlineMessage';

export interface PixiDialogueBubbleSkin {
  side: DialogueSide;
  tint: number;
  insets: PixiNineSliceInsets;
  texture: Texture;
  shadowColor: number;
  messageStyle: TextStyle;
  speakerName: string;
  speakerStyle: TextStyle;
}

export class PixiDialogueBubble extends Container {
  private readonly shadow = new Graphics();
  private readonly shadowColor: number;

  private readonly speakerGroup = new Container();
  private readonly speakerLabel: Text;

  private readonly side: DialogueSide;
  private readonly panel: PixiNineSlicePanel;
  private readonly message: PixiInlineMessage;

  private readonly paddingX = MAGIC.bubble.paddingX;
  private readonly paddingY = MAGIC.bubble.paddingY;
  private readonly minWidth = MAGIC.bubble.minWidth;

  private _bubbleWidth = 0;
  private _bubbleHeight = 0;
  private maxWidth: number = MAGIC.bubble.maxWidth;

  constructor(
    skin: PixiDialogueBubbleSkin,
    tokens: readonly InlineToken[],
    emojiTextures: ReadonlyMap<string, Texture>,
  ) {
    super();

    this.side = skin.side;
    this.shadowColor = skin.shadowColor;
    this.addChild(this.shadow);

    this.panel = new PixiNineSlicePanel({
      texture: skin.texture,
      insets: skin.insets,
      tint: skin.tint,
    });
    this.addChild(this.panel);

    this.speakerLabel = new Text({
      text: skin.speakerName,
      style: skin.speakerStyle,
    });
    this.speakerLabel.anchor.set(this.side === 'right' ? 1 : 0, 0);
    this.speakerGroup.addChild(this.speakerLabel);
    this.addChild(this.speakerGroup);

    this.message = new PixiInlineMessage({
      tokens,
      emojiTextures,
      style: skin.messageStyle,
      emojiSize: MAGIC.text.emojiSize,
      maxWidth: this.maxWidth - this.paddingX * 2,
    });

    this.addChild(this.message);
    this.layout();
  }

  get bubbleWidth(): number {
    return this._bubbleWidth;
  }

  get bubbleHeight(): number {
    return this._bubbleHeight;
  }

  get totalRevealUnits(): number {
    return this.message.totalUnits;
  }

  get speakerVisual(): Container {
    return this.speakerGroup;
  }

  setEmojiTextures(emojiTextures: ReadonlyMap<string, Texture>): boolean {
    if (!this.message.setEmojiTextures(emojiTextures)) {
      return false;
    }

    return this.layout();
  }

  setMaxWidth(maxWidth: number): boolean {
    const nextMaxWidth = Math.max(this.minWidth, maxWidth);
    if (Math.abs(this.maxWidth - nextMaxWidth) < 0.5) {
      return false;
    }

    this.maxWidth = nextMaxWidth;
    this.message.setMaxWidth(this.maxWidth - this.paddingX * 2);

    return this.layout();
  }

  setVisibleUnits(units: number): void {
    this.message.setVisibleUnits(units);
  }

  revealAll(): void {
    this.message.setVisibleUnits(this.message.totalUnits);
  }

  private layout(): boolean {
    const previousWidth = this._bubbleWidth;
    const previousHeight = this._bubbleHeight;
    const speakerHeight = this.speakerLabel.height;

    const speakerGap =
      this.speakerLabel.text.length > 0 ? MAGIC.bubble.nameplateGap : 0;
    const messageY = this.paddingY + speakerHeight + speakerGap - 1;

    const width = Math.min(
      this.maxWidth,
      Math.max(
        this.minWidth,
        Math.max(this.message.contentWidth, this.speakerLabel.width) +
          this.paddingX * 2,
      ),
    );

    const height =
      this.message.contentHeight +
      this.paddingY * 2 +
      speakerHeight +
      speakerGap;

    const speakerX =
      this.side === 'right' ? width - this.paddingX : this.paddingX;

    this.speakerGroup.position.set(speakerX, this.paddingY - 1);
    this.message.position.set(this.paddingX, messageY);

    this.shadow
      .clear()
      .roundRect(
        MAGIC.bubble.shadowOffsetX,
        MAGIC.bubble.shadowOffsetY,
        Math.max(0, width - MAGIC.bubble.shadowShrink),
        Math.max(0, height - MAGIC.bubble.shadowShrink),
        MAGIC.bubble.shadowRadius,
      )
      .fill({ color: this.shadowColor, alpha: MAGIC.bubble.shadowAlpha });

    this.panel.width = width;
    this.panel.height = height;

    this._bubbleWidth = width;
    this._bubbleHeight = height;

    return previousWidth !== width || previousHeight !== height;
  }
}
