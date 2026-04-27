import { ALL_STACK_IDS, type CardId, StackId } from './CardDefinition';
import { CardStack, type StackAccessor } from './CardStack';
import type { TransferPlan, TransferResolution } from './TransferPlan';

/**
 * Aggregate root that owns the three card stacks and the face-up state for every card.
 * All mutations (push/pop/transfer) go through this class so invariants stay consistent.
 */
export class AceBoard implements StackAccessor {
  private stacks: CardStack[] = [];

  /**
   * Face-up state packed into a flat byte array indexed by CardId.
   * Uses Uint8Array instead of a Map<number,boolean> or boolean[] for three reasons:
   *
   * - O(1) indexed access – a single MOV instruction on most runtimes,no hash computation or bucket walk.
   *
   * - Cache-friendly memory layout – all 144 bytes are contiguous,
   *    so a single 64-byte cache line holds ~64 flags, minimizing L1 misses
   *    when `transfer()` and `isCardFaceUp()` are called every frame.
   *
   * - Zero GC pressure – typed arrays are fixed-length, pre-allocated
   *    slabs that the GC never needs to trace or compact, unlike growing a
   *    regular `boolean[]` or creating wrapper objects in a `Map`.
   */
  private cardFaceUp = new Uint8Array(0);

  initialize(cards: readonly CardId[]): void {
    this.stacks = ALL_STACK_IDS.map((id) => new CardStack(id));
    this.cardFaceUp = new Uint8Array(cards.length);

    for (let i = cards.length - 1; i >= 0; i--) {
      this.stacks[StackId.Left].push(cards[i]);
    }
  }

  getStack(id: StackId): CardStack {
    return this.stacks[id];
  }

  isCardFaceUp(cardId: CardId): boolean {
    return this.cardFaceUp[cardId] !== 0;
  }

  /**
   * Executes a planned transfer: pops from source, pushes to target, and toggles face-up state.
   * Returns a TransferResolution with pre/post indices for animation, or null if the source was empty.
   * Throws if the top card of the source does not match the plan's cardId.
   */
  transfer(plan: TransferPlan): TransferResolution | null {
    const from = this.getStack(plan.from);
    const to = this.getStack(plan.to);

    const fromCount = from.count;
    const targetIndex = to.count;

    if (from.isEmpty()) {
      return null;
    }

    const card = from.top!;
    if (card !== plan.cardId) {
      throw new Error(
        `AceBoard invariant violated: expected card ${plan.cardId}, received ${card}`,
      );
    }

    from.pop();

    const fromFaceUp = this.isCardFaceUp(card);
    const targetFaceUp = !fromFaceUp;

    to.push(card);
    this.cardFaceUp[card] = targetFaceUp ? 1 : 0;

    return {
      cardId: card,
      from: plan.from,
      to: plan.to,
      fromCount,
      targetIndex,
      fromFaceUp,
      targetFaceUp,
    };
  }

  clear(): void {
    for (const stack of this.stacks) {
      stack.clear();
    }

    this.stacks = [];
    this.cardFaceUp = new Uint8Array(0);
  }
}
