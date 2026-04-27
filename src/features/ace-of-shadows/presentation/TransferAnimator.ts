import { easePower5InOut } from '@/infrastructure/utils';
import type { Container, Sprite } from 'pixi.js';
import type { ScheduledTransfer } from '../application/AceOfShadowsSession';
import type { StackAccessor } from '../application/CardStack';
import type { StackLayoutEngine } from '../application/StackLayoutEngine';
import {
  CARD_STAGE,
  IN_FLIGHT_SHADOW,
  TRANSFER_ANIMATION,
} from '../configs/AceOfShadowsConfig';
import { CARD } from '../configs/CardVisualConfig';
import type { CardSpritePool } from './CardSpritePool';

interface PendingTransfer {
  readonly transfer: ScheduledTransfer;
  readonly sprite: Sprite;
  readonly shadow: Container;
  readonly startTimeMs: number;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  flipped: boolean;
}

/**
 * Animates in-flight card transfers: arc trajectory, 3D-style flip, and completion.
 */
export class TransferAnimator {
  private readonly _active: PendingTransfer[] = [];

  /**
   * Begins animating a card transfer.
   * Caches start/end X positions so they don't need to be recomputed per frame.
   * End Y is recalculated each tick because the target stack can grow when another transfer completes to the same destination.
   */
  start(
    transfer: ScheduledTransfer,
    sprite: Sprite,
    shadow: Container,
    layout: StackLayoutEngine,
    now: number,
  ): void {
    const fromOffset = layout.pileOffset(transfer.fromCount);

    this._active.push({
      transfer,
      sprite,
      shadow,
      startTimeMs: now,
      flipped: false,
      startX: layout.stackX(transfer.from),
      startY: layout.centerY + layout.cardY(transfer.fromCount - 1, fromOffset),
      endX: layout.stackX(transfer.to),
    });
  }

  /**
   * Advances all active transfers to the given timestamp.
   * Returns a bitmask of stack IDs that need re-layout (bit index = StackId value).
   * Completed transfers are removed from the active list.
   */
  tick(
    now: number,
    layout: StackLayoutEngine,
    stacks: StackAccessor,
    spritePool: CardSpritePool,
  ): number {
    if (this._active.length === 0) {
      return 0;
    }

    let writeIdx = 0;
    let dirtyMask = 0;

    for (let i = 0; i < this._active.length; i++) {
      const t = this._active[i];
      const elapsed = now - t.startTimeMs;
      const progress = Math.min(elapsed / t.transfer.durationMs, 1);

      const eased = easePower5InOut(progress);
      const lift = Math.sin(progress * Math.PI);
      const toOffset = layout.pileOffset(stacks.getStack(t.transfer.to).count);
      const endY = layout.centerY + t.transfer.targetIndex * toOffset;
      const tableY = t.startY + (endY - t.startY) * eased;

      this.advanceSprite(t, eased, lift, tableY, progress);
      this.advanceShadow(t, eased, lift, tableY);
      this.detectFlip(t, progress, spritePool);

      if (progress >= 1) {
        this.finalizeTransfer(t, spritePool);
        dirtyMask |= 1 << t.transfer.to;
      } else {
        this._active[writeIdx++] = t;
      }
    }

    this._active.length = writeIdx;
    return dirtyMask;
  }

  clear(): void {
    this._active.length = 0;
  }

  private advanceSprite(
    t: PendingTransfer,
    eased: number,
    lift: number,
    tableY: number,
    progress: number,
  ): void {
    t.sprite.x = t.startX + (t.endX - t.startX) * eased;
    t.sprite.y = tableY - TRANSFER_ANIMATION.arcHeight * lift;
    t.sprite.scale.x = Math.max(
      TRANSFER_ANIMATION.minScaleX * CARD_STAGE.scaleX,
      Math.abs(Math.cos(progress * Math.PI)) * CARD_STAGE.scaleX,
    );
    t.sprite.scale.y = CARD_STAGE.scaleY;
  }

  private advanceShadow(
    t: PendingTransfer,
    eased: number,
    lift: number,
    tableY: number,
  ): void {
    const cardBottomY = tableY + (CARD.height * CARD_STAGE.scaleY) / 2;

    t.shadow.position.set(
      t.sprite.x + IN_FLIGHT_SHADOW.offsetX,
      cardBottomY + IN_FLIGHT_SHADOW.offsetY,
    );
    t.shadow.alpha =
      IN_FLIGHT_SHADOW.baseAlpha - lift * IN_FLIGHT_SHADOW.alphaLiftFactor;
    t.shadow.scale.set(
      IN_FLIGHT_SHADOW.baseScaleX + lift * IN_FLIGHT_SHADOW.scaleXLiftFactor,
      IN_FLIGHT_SHADOW.baseScaleY + lift * IN_FLIGHT_SHADOW.scaleYLiftFactor,
    );
  }

  private detectFlip(
    t: PendingTransfer,
    progress: number,
    spritePool: CardSpritePool,
  ): void {
    if (progress >= TRANSFER_ANIMATION.flipSwapProgress && !t.flipped) {
      t.flipped = true;
      spritePool.applyCardFace(t.transfer.cardId, t.transfer.targetFaceUp);
    }
  }

  private finalizeTransfer(
    t: PendingTransfer,
    spritePool: CardSpritePool,
  ): void {
    t.shadow.visible = false;
    t.shadow.alpha = 0;

    spritePool.clearTransferring(t.transfer.cardId);
  }
}
