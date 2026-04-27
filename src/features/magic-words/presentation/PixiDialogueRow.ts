import type {
  DialogueMessageModel,
  DialogueSide,
} from '@/features/magic-words/application/MagicWordsModels';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { BRAND } from '@/ui/theme/BrandTokens';
import {
  Container,
  Graphics,
  Sprite,
  type TextStyle,
  type Texture,
} from 'pixi.js';
import { PixiDialogueBubble } from './PixiDialogueBubble';

const EMPTY_EMOJI_TEXTURES = new Map<string, Texture>();

export interface PixiDialogueSideSkin {
  bubbleTint: number;
  bubbleShadowColor: number;
  avatarFrameTint: number;
  speakerStyle: TextStyle;
}

interface PixiDialogueRowSkin {
  bubbleTexture: Texture;
  bubbleInsets: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  messageStyle: TextStyle;
  fallbackAvatarTexture: Texture;
  leftSide: PixiDialogueSideSkin;
  rightSide: PixiDialogueSideSkin;
}

export class PixiDialogueRow extends Container {
  private readonly side: DialogueSide;

  private readonly avatarGroup = new Container();
  private readonly avatarShadow = new Graphics();
  private readonly avatarRing = new Graphics();
  private readonly avatarFill = new Graphics();
  private readonly avatarSprite: Sprite;
  private readonly avatarMaskShape = new Graphics();
  private readonly avatarRingTint: number;

  private readonly bubbleGroup = new Container();
  private readonly bubble: PixiDialogueBubble;

  private _rowHeight = 0;
  private rowWidth = 0;

  constructor(model: DialogueMessageModel, skin: PixiDialogueRowSkin) {
    super();

    this.side = model.side;
    const sideSkin = this.side === 'left' ? skin.leftSide : skin.rightSide;
    this.avatarRingTint = sideSkin.avatarFrameTint;

    this.avatarGroup.addChild(this.avatarShadow);
    this.avatarGroup.addChild(this.avatarRing);
    this.avatarGroup.addChild(this.avatarFill);

    this.avatarSprite = new Sprite(skin.fallbackAvatarTexture);
    this.avatarSprite.anchor.set(0.5);

    this.avatarGroup.addChild(this.avatarSprite);
    this.avatarGroup.addChild(this.avatarMaskShape);

    this.avatarSprite.mask = this.avatarMaskShape;
    this.addChild(this.avatarGroup);

    this.bubble = new PixiDialogueBubble(
      {
        side: this.side,
        texture: skin.bubbleTexture,
        insets: skin.bubbleInsets,
        tint: sideSkin.bubbleTint,
        shadowColor: sideSkin.bubbleShadowColor,
        messageStyle: skin.messageStyle,
        speakerName: model.speakerName,
        speakerStyle: sideSkin.speakerStyle,
      },
      model.tokens,
      EMPTY_EMOJI_TEXTURES,
    );

    this.bubbleGroup.addChild(this.bubble);
    this.addChild(this.bubbleGroup);
  }

  get rowHeight(): number {
    return this._rowHeight;
  }

  get sideValue(): DialogueSide {
    return this.side;
  }

  get bubbleVisual(): Container {
    return this.bubbleGroup;
  }

  get avatarVisual(): Container {
    return this.avatarGroup;
  }

  get speakerVisual(): Container {
    return this.bubble.speakerVisual;
  }

  get totalRevealUnits(): number {
    return this.bubble.totalRevealUnits;
  }

  setRowWidth(width: number): void {
    if (Math.abs(this.rowWidth - width) < 0.5) {
      return;
    }

    this.rowWidth = width;
    this.layout();
  }

  setAvatarTexture(texture: Texture): void {
    if (this.avatarSprite.texture === texture) {
      return;
    }

    this.avatarSprite.texture = texture;
    this.layoutAvatar(MAGIC.avatar.size);
  }

  setEmojiTextures(emojiTextures: ReadonlyMap<string, Texture>): void {
    if (this.bubble.setEmojiTextures(emojiTextures)) {
      this.layout();
    }
  }

  setVisibleUnits(units: number): void {
    this.bubble.setVisibleUnits(units);
  }

  revealAll(): void {
    this.bubble.revealAll();
  }

  prepareForReveal(): void {
    const ent = MAGIC.sequence.entrance;
    const bubbleOffset =
      this.side === 'left' ? ent.bubbleSlide : -ent.bubbleSlide;
    const avatarOffset =
      this.side === 'left' ? -ent.avatarSlide : ent.avatarSlide;

    this.alpha = 0;
    this.scale.set(ent.initialScale);

    this.avatarGroup.alpha = 0;
    this.avatarGroup.x += avatarOffset;
    this.avatarGroup.scale.set(ent.avatarInitialScale);

    this.speakerVisual.alpha = 0;
    this.speakerVisual.y += ent.speakerSlide;

    this.bubbleGroup.alpha = 0;
    this.bubbleGroup.x += bubbleOffset;
    this.bubble.setVisibleUnits(0);
  }

  finalizeRevealState(): void {
    this.alpha = 1;
    this.scale.set(1);

    this.avatarGroup.alpha = 1;
    this.avatarGroup.scale.set(1);

    this.speakerVisual.alpha = 1;
    this.bubbleGroup.alpha = 1;

    this.layout();
    this.bubble.revealAll();
  }

  private layout(): void {
    const avatarSize = MAGIC.avatar.size;
    const bubbleGap = MAGIC.avatar.gap;
    const bubbleMaxWidth = Math.max(
      MAGIC.bubble.minWidth,
      Math.min(MAGIC.bubble.maxWidth, this.rowWidth - avatarSize - bubbleGap),
    );
    const avatarY = MAGIC.avatar.topOffset;

    this.bubble.setMaxWidth(bubbleMaxWidth);

    const avatarGroupX =
      this.side === 'left' ? 0 : Math.max(0, this.rowWidth - avatarSize);
    const bubbleGroupX =
      this.side === 'left'
        ? avatarSize + bubbleGap
        : Math.max(0, avatarGroupX - bubbleGap - this.bubble.bubbleWidth);

    this.layoutAvatar(avatarSize);
    this.avatarGroup.position.set(avatarGroupX, avatarY);

    this.bubble.position.set(0, 0);
    this.bubbleGroup.position.set(bubbleGroupX, 0);

    this._rowHeight = Math.max(this.bubble.bubbleHeight, avatarY + avatarSize);
  }

  private layoutAvatar(avatarSize: number): void {
    const center = avatarSize * 0.5;

    const shadowRadius = avatarSize * 0.5 - MAGIC.avatar.shadowInset;
    const ringRadius = avatarSize * 0.5;
    const fillRadius = avatarSize * 0.5 - MAGIC.avatar.fillInset;
    const photoRadius = avatarSize * 0.5 - MAGIC.avatar.photoInset;

    const sourceWidth = Math.max(1, this.avatarSprite.texture.orig.width);
    const sourceHeight = Math.max(1, this.avatarSprite.texture.orig.height);

    const photoDiameter = photoRadius * 2;
    const coverScale = Math.max(
      photoDiameter / sourceWidth,
      photoDiameter / sourceHeight,
    );

    this.avatarShadow
      .clear()
      .circle(
        center + MAGIC.avatar.shadowOffsetX,
        center + MAGIC.avatar.shadowOffsetY,
        shadowRadius,
      )
      .fill({
        color: MAGIC.palette.bubbleShadow,
        alpha: MAGIC.avatar.shadowAlpha,
      });

    this.avatarRing
      .clear()
      .circle(center, center, ringRadius)
      .fill(this.avatarRingTint);

    this.avatarFill
      .clear()
      .circle(center, center, fillRadius)
      .fill(BRAND.palette.white);

    this.avatarMaskShape
      .clear()
      .circle(center, center, photoRadius)
      .fill(BRAND.palette.white);

    this.avatarSprite.scale.set(coverScale);
    this.avatarSprite.position.set(center, center);
  }
}
