import type { CardId, StackId } from './CardDefinition';

export interface TransferPlan {
  readonly cardId: CardId;
  readonly from: StackId;
  readonly to: StackId;
}

/**
 * Result of executing a TransferPlan.
 * Carries the pre-computed stack indices and face-up states needed by the animation layer.
 */
export interface TransferResolution {
  readonly cardId: CardId;
  readonly from: StackId;
  readonly to: StackId;
  readonly fromCount: number;
  readonly targetIndex: number;
  readonly fromFaceUp: boolean;
  readonly targetFaceUp: boolean;
}
