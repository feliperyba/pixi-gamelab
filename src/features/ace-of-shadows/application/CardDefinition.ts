export type CardId = number;

export enum StackId {
  Left = 0,
  Center = 1,
  Right = 2,
}

export const ALL_STACK_IDS: readonly StackId[] = [
  StackId.Left,
  StackId.Center,
  StackId.Right,
];

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export const SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const RANKS: readonly Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

export interface CardDefinition {
  readonly suit: Suit;
  readonly rank: Rank;
}

export const TOTAL_CARDS = 144;
export const STANDARD_DECK_SIZE = 52;

export function createCardIds(): CardId[] {
  return Array.from({ length: TOTAL_CARDS }, (_, i) => i);
}
