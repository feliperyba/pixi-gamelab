import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import type { Container, FederatedPointerEvent } from 'pixi.js';

export interface DialogueScrollInputHandlerOptions {
  feedViewport: Container;
  getOffset: () => number;
  setOffset: (nextOffset: number) => void;
  onAdvance: () => void;
}

export class DialogueScrollInputHandler {
  private readonly feedViewport: Container;
  private readonly getOffset: () => number;
  private readonly setOffset: (nextOffset: number) => void;
  private readonly onAdvance: () => void;

  private dragging = false;
  private tapEligible = false;
  private dragStartY = 0;
  private dragStartScroll = 0;

  constructor(options: DialogueScrollInputHandlerOptions) {
    this.feedViewport = options.feedViewport;
    this.feedViewport.cursor = 'grab';
    this.feedViewport.eventMode = 'static';

    this.getOffset = options.getOffset;
    this.setOffset = options.setOffset;
    this.onAdvance = options.onAdvance;

    this.feedViewport.on('pointerdown', this.handlePointerDown);
    this.feedViewport.on('pointerup', this.handlePointerUp);
    this.feedViewport.on('pointerupoutside', this.handlePointerUp);
    this.feedViewport.on('globalpointermove', this.handlePointerMove);
  }

  dispose(): void {
    this.dragging = false;
    this.tapEligible = false;
    this.feedViewport.cursor = 'grab';

    this.feedViewport.off('pointerdown', this.handlePointerDown);
    this.feedViewport.off('pointerup', this.handlePointerUp);
    this.feedViewport.off('pointerupoutside', this.handlePointerUp);
    this.feedViewport.off('globalpointermove', this.handlePointerMove);
  }

  private readonly handlePointerDown = (event: FederatedPointerEvent): void => {
    this.dragging = true;
    this.tapEligible = true;

    this.dragStartY = event.global.y;
    this.dragStartScroll = this.getOffset();
    this.feedViewport.cursor = 'grabbing';
  };

  private readonly handlePointerMove = (event: FederatedPointerEvent): void => {
    if (!this.dragging) {
      return;
    }

    const delta = event.global.y - this.dragStartY;
    if (Math.abs(delta) > MAGIC.input.dragThresholdPx) {
      this.tapEligible = false;
    }

    this.setOffset(this.dragStartScroll - delta);
  };

  private readonly handlePointerUp = (): void => {
    const shouldAdvance = this.tapEligible;

    this.dragging = false;
    this.tapEligible = false;
    this.feedViewport.cursor = 'grab';

    if (shouldAdvance) {
      this.onAdvance();
    }
  };
}
