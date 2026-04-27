import type {
  MagicWordsSceneLayout,
  ShellMetrics,
} from '@/features/magic-words/application/MagicWordsSceneLayout';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { PixiNineSlicePanel } from '@/ui/components/PixiNineSlicePanel';
import { Container, Graphics, Text } from 'pixi.js';
import type { MagicWordsPixiSkin } from './loadMagicWordsPixiSkin';
import { PixiMagicWordsCurtain } from './PixiMagicWordsCurtain';
import type { PixiMagicWordsTranscriptView } from './PixiMagicWordsTranscriptView';

interface MagicWordsShellStatus {
  emptyMessage: string | null;
  hasRows: boolean;
  hasOverflow: boolean;
  isSequenceFinished: boolean;
}

export class PixiMagicWordsShellView extends Container {
  private readonly shell = new Container();
  private readonly background = new Graphics();
  private readonly shellShadow = new Graphics();

  private readonly scrollHint: Text;
  private readonly emptyStateLabel: Text;

  readonly curtain: PixiMagicWordsCurtain;
  private readonly shellPanel: PixiNineSlicePanel;
  private readonly screenFrame: PixiNineSlicePanel;

  constructor(
    skin: MagicWordsPixiSkin,
    transcriptView: PixiMagicWordsTranscriptView,
  ) {
    super();

    this.scrollHint = new Text({
      text: 'Tap to skip. Drag to scroll.',
      style: skin.hintStyle,
    });

    this.emptyStateLabel = new Text({ text: '', style: skin.emptyStateStyle });
    this.emptyStateLabel.visible = false;

    this.shellPanel = new PixiNineSlicePanel({
      texture: skin.glassPanelTexture,
      insets: MAGIC.ui.glassPanelInsets,
      tint: skin.palette.shellTint,
    });

    this.screenFrame = new PixiNineSlicePanel({
      texture: skin.screenFrameTexture,
      insets: skin.screenFrameInsets,
      tint: MAGIC.palette.screenFrameTint,
    });

    this.curtain = new PixiMagicWordsCurtain(skin);

    this.addChild(this.background);
    this.addChild(this.shellShadow);
    this.addChild(this.shell);
    this.addChild(this.scrollHint);

    this.shell.addChild(this.shellPanel);
    this.shell.addChild(this.screenFrame);
    this.shell.addChild(transcriptView);
    this.shell.addChild(this.emptyStateLabel);
    this.shell.addChild(this.curtain);
  }

  setCurtainSubtitle(text: string): void {
    this.curtain.setSubtitle(text);
  }

  setCurtainStatus(text: string): void {
    this.curtain.setStatus(text);
  }

  updateStatus(status: MagicWordsShellStatus): void {
    if (status.emptyMessage) {
      this.emptyStateLabel.visible = true;
      this.emptyStateLabel.text = status.emptyMessage;
      this.scrollHint.text = 'Transcript unavailable';
      this.scrollHint.visible = true;

      return;
    }

    this.emptyStateLabel.visible = false;

    if (!status.isSequenceFinished && status.hasRows) {
      this.scrollHint.text = 'Tap to skip. Drag to scroll.';
      this.scrollHint.visible = true;

      return;
    }

    this.scrollHint.text = status.hasOverflow
      ? 'Recovered. Drag to review.'
      : '';

    this.scrollHint.visible = this.scrollHint.text.length > 0;
  }

  layoutChrome(
    layout: MagicWordsSceneLayout,
    viewWidth: number,
    viewHeight: number,
  ): void {
    this.drawBackground(viewWidth, viewHeight);
    this.layoutShellChrome(layout.shell);
    this.layoutFeedFrame(layout);

    this.curtain.layout(viewWidth, viewHeight);
  }

  layoutFooter(layout: MagicWordsSceneLayout): void {
    this.scrollHint.position.set(
      layout.shell.shellX + (layout.shell.shellW - this.scrollHint.width) * 0.5,
      layout.hintY,
    );

    this.emptyStateLabel.position.set(
      layout.shell.vpX + (layout.shell.vpW - this.emptyStateLabel.width) * 0.5,
      layout.shell.vpY +
        layout.feed.transcriptInsetY +
        MAGIC.shell.emptyStateOffsetY,
    );
  }

  private drawBackground(viewWidth: number, viewHeight: number): void {
    this.background.clear();
    this.background.rect(0, 0, viewWidth, viewHeight).fill({
      color: MAGIC.palette.backgroundBase,
    });
  }

  private layoutShellChrome(m: ShellMetrics): void {
    const shadow = MAGIC.shell.shadow;

    this.shellShadow
      .clear()
      .roundRect(
        m.shellX + shadow.offsetX,
        m.shellY + shadow.offsetY,
        m.shellW - shadow.shrinkW,
        m.shellH - shadow.shrinkH,
        shadow.outerRadius,
      )
      .fill({
        color: MAGIC.palette.shellShadow,
        alpha: shadow.outerAlpha,
      })
      .roundRect(
        m.shellX + shadow.offsetX + shadow.innerOffsetX,
        m.shellY + shadow.offsetY + shadow.innerOffsetY,
        m.shellW - shadow.shrinkW - shadow.innerShrinkW,
        m.shellH - shadow.shrinkH - shadow.innerShrinkH,
        shadow.innerRadius,
      )
      .fill({
        color: MAGIC.palette.shellShadow,
        alpha: MAGIC.feed.shellShadowAlpha,
      });

    this.shellPanel.position.set(m.shellX, m.shellY);
    this.shellPanel.width = m.shellW;
    this.shellPanel.height = m.shellH;
  }

  private layoutFeedFrame(layout: MagicWordsSceneLayout): void {
    this.screenFrame.position.set(
      layout.shell.vpX - layout.feed.frameInset,
      layout.shell.vpY - layout.feed.frameInset,
    );

    this.screenFrame.width = layout.shell.vpW + layout.feed.frameInset * 2;
    this.screenFrame.height = layout.shell.vpH + layout.feed.frameInset * 2;
  }
}
