import type { Suit } from '@/features/ace-of-shadows/application/CardDefinition';

export const CARD = {
  width: 140,
  height: 190,
  suitSymbols: {
    hearts: '\u2665',
    diamonds: '\u2666',
    clubs: '\u2663',
    spades: '\u2660',
  } satisfies Record<Suit, string>,
  suitColors: {
    hearts: '#cc3333',
    diamonds: '#cc3333',
    clubs: '#222222',
    spades: '#222222',
  } satisfies Record<Suit, string>,
  rankFontSize: 23,
  symbolFontSize: 15,
  rankX: 11,
  rankY: 9,
  symbolX: 12,
  symbolY: 34,
  centerSuitSize: 48,
  fallbackSymbolFontSize: 44,
} as const;
