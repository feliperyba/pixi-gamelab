import type { CardId, StackId } from './CardDefinition';

export interface StackAccessor {
  getStack(id: StackId): CardStack;
}

export class CardStack {
  readonly id: StackId;
  private cards: CardId[] = [];

  constructor(id: StackId) {
    this.id = id;
  }

  get top(): CardId | undefined {
    return this.cards.length > 0
      ? this.cards[this.cards.length - 1]
      : undefined;
  }

  get count(): number {
    return this.cards.length;
  }

  get cardList(): readonly CardId[] {
    return this.cards;
  }

  push(card: CardId): void {
    this.cards.push(card);
  }

  pop(): CardId | undefined {
    return this.cards.pop();
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  clear(): void {
    this.cards.length = 0;
  }
}
