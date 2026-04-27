import {
  type CardDefinition,
  RANKS,
  STANDARD_DECK_SIZE,
  SUITS,
} from './CardDefinition';

/**
 * Generates and caches the standard 52-card deck definition.
 */
export class DeckPatternCatalog {
  private readonly standardDeck: CardDefinition[];

  constructor() {
    this.standardDeck = [];

    for (let r = 0; r < RANKS.length; r++) {
      for (let s = 0; s < SUITS.length; s++) {
        this.standardDeck.push({ rank: RANKS[r], suit: SUITS[s] });
      }
    }
  }

  get standardDeckSize(): number {
    return STANDARD_DECK_SIZE;
  }

  getDefinitionAt(index: number): CardDefinition {
    return this.standardDeck[index];
  }
}
