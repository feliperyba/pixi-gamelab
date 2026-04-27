import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { PixiNineSlicePanel } from '@/ui/components/PixiNineSlicePanel';
import { Container, Graphics, Text } from 'pixi.js';
import type { CurtainSkin } from './loadMagicWordsPixiSkin';

export class PixiMagicWordsCurtain extends Container {
  private readonly glow = new Graphics();
  private readonly scrim = new Graphics();

  private readonly card: PixiNineSlicePanel;
  private readonly statusPlate: PixiNineSlicePanel;

  private readonly titleLabel: Text;
  private readonly statusLabel: Text;
  private readonly subtitleLabel: Text;

  constructor(skin: CurtainSkin) {
    super();

    this.card = new PixiNineSlicePanel({
      texture: skin.shellPanelTexture,
      insets: skin.shellInsets,
      tint: skin.palette.overlayCardTint,
    });

    this.statusPlate = new PixiNineSlicePanel({
      texture: skin.bubbleTexture,
      insets: skin.bubbleInsets,
      tint: skin.palette.overlayStatusTint,
    });

    this.titleLabel = new Text({
      text: 'Magic Words',
      style: skin.transitionTitleStyle,
    });

    this.subtitleLabel = new Text({
      text: '',
      style: skin.transitionSubtitleStyle,
    });

    this.statusLabel = new Text({
      text: '',
      style: skin.transitionStatusStyle,
    });

    this.titleLabel.anchor.set(0.5);
    this.subtitleLabel.anchor.set(0.5);
    this.statusLabel.anchor.set(0.5);

    this.addChild(this.scrim);
    this.addChild(this.glow);
    this.addChild(this.card);
    this.addChild(this.statusPlate);
    this.addChild(this.titleLabel);
    this.addChild(this.subtitleLabel);
    this.addChild(this.statusLabel);
  }

  setSubtitle(text: string): void {
    this.subtitleLabel.text = text;
  }

  setStatus(text: string): void {
    this.statusLabel.text = text;
  }

  layout(viewWidth: number, viewHeight: number): void {
    const cardWidth = Math.min(
      MAGIC.curtain.cardMaxWidth,
      Math.max(
        MAGIC.curtain.cardMinWidth,
        viewWidth * MAGIC.curtain.cardWidthRatio,
      ),
    );

    const cardHeight = MAGIC.curtain.cardHeight;
    const cardX = (viewWidth - cardWidth) * 0.5;

    const cardY =
      (viewHeight - cardHeight) * 0.5 - MAGIC.curtain.cardCenterOffsetY;

    const statusWidth = Math.min(
      MAGIC.curtain.statusMaxWidth,
      cardWidth - MAGIC.curtain.statusShrink,
    );

    const statusHeight = MAGIC.curtain.statusHeight;

    this.scrim.clear().rect(0, 0, viewWidth, viewHeight).fill({
      color: MAGIC.palette.overlayScrim,
      alpha: MAGIC.curtain.scrimAlpha,
    });

    this.glow
      .clear()
      .circle(
        viewWidth * 0.5,
        cardY + cardHeight * 0.4,
        cardWidth * MAGIC.curtain.glowScale,
      )
      .fill({ color: MAGIC.palette.shellGlow, alpha: MAGIC.curtain.glowAlpha });

    this.card.position.set(cardX, cardY);
    this.card.width = cardWidth;
    this.card.height = cardHeight;

    this.titleLabel.position.set(
      viewWidth * 0.5,
      cardY + MAGIC.curtain.titleOffsetY,
    );

    this.subtitleLabel.position.set(
      viewWidth * 0.5,
      cardY + MAGIC.curtain.subtitleOffsetY,
    );

    this.statusPlate.position.set(
      viewWidth * 0.5 - statusWidth * 0.5,
      cardY + cardHeight - MAGIC.curtain.statusPaddingBottom,
    );

    this.statusPlate.width = statusWidth;
    this.statusPlate.height = statusHeight;

    this.statusLabel.position.set(
      viewWidth * 0.5,
      this.statusPlate.y + statusHeight * 0.5,
    );
  }
}
