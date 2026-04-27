import { DialogueScrollModel } from '@/features/magic-words/application/DialogueScrollModel';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { gsap } from 'gsap';
import { Container, Graphics } from 'pixi.js';
import { DialogueScrollInputHandler } from './DialogueScrollInputHandler';

class VerticalBarGraphic extends Graphics {
  layout(
    x: number,
    y: number,
    width: number,
    height: number,
    tint: number,
    alpha: number,
  ): void {
    if (height <= 0 || width <= 0) {
      this.visible = false;
      return;
    }

    this.visible = true;
    this.alpha = alpha;
    this.position.set(x, y);

    const radius = Math.min(width * 0.5, height * 0.5);
    this.clear().roundRect(0, 0, width, height, radius).fill({ color: tint });
  }
}

export class DialogueScrollController {
  private readonly model = new DialogueScrollModel();
  private readonly feedContent: Container;
  private readonly inputHandler: DialogueScrollInputHandler;

  readonly track = new Container();
  readonly thumb = new Container();

  private readonly trackStrip = new VerticalBarGraphic();
  private readonly thumbStrip = new VerticalBarGraphic();

  private trackX = 0;
  private trackY = 0;
  private viewportHeight = 0;
  private activeScrollTween: gsap.core.Tween | null = null;

  constructor(
    feedContent: Container,
    feedViewport: Container,
    onAdvance: () => void,
  ) {
    this.feedContent = feedContent;

    this.track.addChild(this.trackStrip);
    this.thumb.addChild(this.thumbStrip);

    this.inputHandler = new DialogueScrollInputHandler({
      feedViewport,
      getOffset: () => this.offset,
      setOffset: (nextOffset) => this.applyScroll(nextOffset),
      onAdvance,
    });
  }

  get offset(): number {
    return this.model.currentOffset;
  }

  get hasOverflow(): boolean {
    return this.model.hasOverflow;
  }

  setContentHeight(height: number): void {
    this.model.setContentHeight(height);
  }

  applyScroll(nextOffset: number): void {
    this.feedContent.y = -this.model.setOffset(nextOffset);
    this.layoutScrollThumb(this.trackX, this.trackY, this.viewportHeight);
  }

  layout(trackX: number, trackY: number, viewportHeight: number): void {
    this.trackX = trackX;
    this.trackY = trackY;

    this.viewportHeight = viewportHeight;
    this.model.setViewportHeight(viewportHeight);

    const shouldShow = this.model.hasOverflow && viewportHeight > 0;
    this.track.visible = shouldShow;
    this.thumb.visible = shouldShow;

    if (shouldShow) {
      this.trackStrip.layout(
        trackX,
        trackY,
        MAGIC.scroll.trackWidth,
        viewportHeight,
        MAGIC.palette.scrollTrack,
        MAGIC.scroll.trackAlpha,
      );
    }

    this.layoutScrollThumb(trackX, trackY, viewportHeight);
  }

  scrollToLatest(immediate: boolean): void {
    const target = this.model.maxScroll;
    this.activeScrollTween?.kill();

    if (immediate || target <= 0) {
      this.applyScroll(target);
      return;
    }

    const state = { offset: this.model.currentOffset };

    this.activeScrollTween = gsap.to(state, {
      offset: target,
      duration: MAGIC.sequence.autoScroll,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => this.applyScroll(state.offset),
      onComplete: () => {
        this.activeScrollTween = null;
      },
    });
  }

  dispose(): void {
    this.model.setOffset(0);
    this.model.setContentHeight(0);
    this.model.setViewportHeight(0);

    this.viewportHeight = 0;
    this.activeScrollTween?.kill();
    this.activeScrollTween = null;

    this.inputHandler.dispose();
  }

  private layoutScrollThumb(
    trackX: number,
    trackY: number,
    viewportHeight: number,
  ): void {
    const thumbState = this.model.getThumbState(MAGIC.scroll.minThumbHeight);
    if (!thumbState.visible || viewportHeight <= 0) {
      this.thumb.visible = false;
      return;
    }

    this.thumb.visible = true;
    const thumbHeight = thumbState.height;
    const thumbTravel = viewportHeight - thumbHeight;
    const thumbY = trackY + thumbTravel * thumbState.progress;

    this.thumbStrip.layout(
      trackX,
      thumbY,
      MAGIC.scroll.trackWidth,
      thumbHeight,
      MAGIC.palette.scrollThumb,
      MAGIC.scroll.thumbAlpha,
    );
  }
}
