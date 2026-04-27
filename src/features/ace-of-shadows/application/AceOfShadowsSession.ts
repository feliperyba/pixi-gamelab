import {
  MOVE_INTERVAL_MS,
  TRANSFER_DURATION_MS,
} from '../configs/AceOfShadowsConfig';
import type { AceBoard } from './AceBoard';
import { createCardIds, type CardId, type StackId } from './CardDefinition';
import type { CardStack } from './CardStack';
import type { NextTransferPolicy } from './NextTransferPolicy';
import type { TransferResolution } from './TransferPlan';

export interface ScheduledTransfer extends TransferResolution {
  readonly durationMs: number;
}

/**
 * Orchestrates the card transfer game loop:
 * ticks time, triggers moves via the policy, and applies them to the board.
 */
export class AceOfShadowsSession {
  private readonly board: AceBoard;
  private readonly movePolicy: NextTransferPolicy;

  private elapsedSinceMoveMs = 0;
  private currentSource: StackId | null = null;

  private _totalMoves = 0;

  constructor(board: AceBoard, movePolicy: NextTransferPolicy) {
    this.board = board;
    this.movePolicy = movePolicy;
  }

  get totalMoves(): number {
    return this._totalMoves;
  }

  getStack(id: StackId): CardStack {
    return this.board.getStack(id);
  }

  isCardFaceUp(cardId: CardId): boolean {
    return this.board.isCardFaceUp(cardId);
  }

  start(): void {
    this.board.initialize(createCardIds());

    this._totalMoves = 0;
    this.elapsedSinceMoveMs = 0;
    this.currentSource = null;
  }

  stop(): void {
    this.elapsedSinceMoveMs = 0;
    this.currentSource = null;
    this._totalMoves = 0;

    this.board.clear();
  }

  /**
   * Advances game time by dtMs and attempts a transfer if the move interval has elapsed.
   *
   * Accepts an optional `canMove` that gates the domain commit.
   * When a card is still mid-animation in the presentation layer the caller
   * passes `(cardId) => false` so the session does not mutate the board for that card.
   * The timer is then capped at MOVE_INTERVAL_MS so the transfer fires immediately on the first frame the card becomes available
   */
  update(
    dtMs: number,
    canMove: (cardId: CardId) => boolean = () => true,
  ): ScheduledTransfer | null {
    this.elapsedSinceMoveMs += dtMs;

    if (this.elapsedSinceMoveMs < MOVE_INTERVAL_MS) {
      return null;
    }

    const next = this.movePolicy.selectNext(this.board, this.currentSource);
    if (!next) {
      return null;
    }

    if (!canMove(next.plan.cardId)) {
      this.elapsedSinceMoveMs = MOVE_INTERVAL_MS;
      return null;
    }

    const resolution = this.board.transfer(next.plan);
    if (!resolution) {
      return null;
    }

    this.elapsedSinceMoveMs -= MOVE_INTERVAL_MS;
    this.currentSource = next.source;
    this._totalMoves += 1;

    return { ...resolution, durationMs: TRANSFER_DURATION_MS };
  }
}
