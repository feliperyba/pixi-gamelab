import { ALL_STACK_IDS, type StackId } from './CardDefinition';
import type { StackAccessor } from './CardStack';
import type { TransferPlan } from './TransferPlan';

export interface NextTransferPolicyResult {
  readonly plan: TransferPlan;
  readonly source: StackId;
}

/**
 * Selects the next card transfer.
 * Source stack stays until empty, then rotates to the next non-empty stack.
 * Target is always (source + 1) % 3 so the card never returns to its origin.
 */
export class NextTransferPolicy {
  selectNext(
    stacks: StackAccessor,
    currentSource: StackId | null,
  ): NextTransferPolicyResult | null {
    const source = this.findSource(stacks, currentSource);
    if (source === null) {
      return null;
    }

    const cardId = stacks.getStack(source).top;
    if (cardId === undefined) {
      return null;
    }

    return {
      source,
      plan: {
        cardId,
        from: source,
        to: this.pickTarget(source),
      },
    };
  }

  private findSource(
    stacks: StackAccessor,
    currentSource: StackId | null,
  ): StackId | null {
    if (currentSource !== null && !stacks.getStack(currentSource).isEmpty()) {
      return currentSource;
    }

    for (const id of ALL_STACK_IDS) {
      if (!stacks.getStack(id).isEmpty()) {
        return id;
      }
    }

    return null;
  }

  private pickTarget(fromId: StackId): StackId {
    return ALL_STACK_IDS[(fromId + 1) % ALL_STACK_IDS.length];
  }
}
