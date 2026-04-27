import type { InlineToken } from './MagicWordsModels';
import { normalizeMagicWordsKey } from './normalizeMagicWordsKey';

export function tokenizeRichText(
  text: string,
  availableEmojiNames: ReadonlySet<string>,
): InlineToken[] {
  const tokens: InlineToken[] = [];

  /**
   * Accept any non-nested placeholder body so unsupported markers are still recognized and can be removed from the rendered text as omitted tokens.
   */
  const regex = /\{([^{}]+)\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        kind: 'text',
        value: text.slice(lastIndex, match.index),
      });
    }

    const emojiName = normalizeMagicWordsKey(match[1]);
    if (emojiName.length === 0) {
      /**
       * Preserve empty placeholders instead of dropping user text that does not map to a emoji key.
       */
      tokens.push({ kind: 'text', value: match[0] });
      lastIndex = match.index + match[0].length;

      continue;
    }

    tokens.push(
      /**
       * Unknown markers are kept as omitted tokens so layout can strip them without leaking raw placeholder strings such as {win} into the bubble.
       */
      availableEmojiNames.has(emojiName)
        ? { kind: 'emoji', name: emojiName }
        : { kind: 'omitted', name: emojiName },
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}
