const COLLAPSED_WHITESPACE = /\s+/g;

export function normalizeMagicWordsKey(value: string): string {
  return value.trim().replace(COLLAPSED_WHITESPACE, ' ').toLowerCase();
}
