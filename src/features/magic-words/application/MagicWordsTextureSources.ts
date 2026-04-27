import type { DialogueMessageModel, EmojiDefinition } from './MagicWordsModels';
import { normalizeMagicWordsKey } from './normalizeMagicWordsKey';

export function collectEmojiSources(
  emojis: readonly EmojiDefinition[],
): ReadonlyMap<string, string> {
  const emojiSources = new Map<string, string>();

  for (const emoji of emojis) {
    const emojiKey = normalizeMagicWordsKey(emoji.name);
    if (!emojiKey || emojiSources.has(emojiKey)) {
      continue;
    }

    emojiSources.set(emojiKey, emoji.url);
  }

  return emojiSources;
}

export function collectAvatarSources(
  messages: readonly DialogueMessageModel[],
): ReadonlyMap<string, string | undefined> {
  const avatarSources = new Map<string, string | undefined>();

  for (const message of messages) {
    if (!avatarSources.has(message.speakerKey)) {
      avatarSources.set(message.speakerKey, message.avatarUrl);
    }
  }

  return avatarSources;
}
