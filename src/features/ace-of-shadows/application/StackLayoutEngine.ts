import { STACK_LAYOUT } from '../configs/AceOfShadowsConfig';
import { ALL_STACK_IDS, type StackId } from './CardDefinition';

export interface StackLayoutViewport {
  readonly width: number;
  readonly height: number;
}

export class StackLayoutEngine {
  private _viewW: number;
  private _viewH: number;
  private _spacing: number;

  constructor(initial: StackLayoutViewport) {
    this._viewW = initial.width;
    this._viewH = initial.height;
    this._spacing = initial.width / (ALL_STACK_IDS.length + 1);
  }

  get viewW(): number {
    return this._viewW;
  }

  get viewH(): number {
    return this._viewH;
  }

  get spacing(): number {
    return this._spacing;
  }

  get centerY(): number {
    return this._viewH / 2;
  }

  updateViewport(viewport: StackLayoutViewport): void {
    this._viewW = viewport.width;
    this._viewH = viewport.height;
    this._spacing = viewport.width / (ALL_STACK_IDS.length + 1);
  }

  stackX(stackId: StackId): number {
    return this._spacing * (stackId + 1);
  }

  /**
   * Per-card vertical offset within a stack.
   * Shrinks as the stack grows so cards don't overflow the viewport.
   */
  pileOffset(stackSize: number): number {
    if (stackSize <= 1) {
      return 0;
    }

    return Math.min(
      STACK_LAYOUT.minPileOffset,
      STACK_LAYOUT.maxPileSpread / stackSize,
    );
  }

  /**
   * Y position of the n-th card in a stack given the per-card offset.
   */
  cardY(indexInStack: number, offset: number): number {
    return indexInStack * offset;
  }
}
