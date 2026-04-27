import {
  type AvatarDefinition,
  type DialogueFeedModel,
  type DialogueMessageModel,
  type DialogueSide,
  type MagicWordsPayload,
} from './MagicWordsModels';
import { normalizeMagicWordsKey } from './normalizeMagicWordsKey';
import { tokenizeRichText } from './RichTextTokenizer';

export function buildDialogueFeed(
  payload: MagicWordsPayload,
): DialogueFeedModel {
  const emojiNames = new Set(
    payload.emojis
      .map((emoji) => normalizeMagicWordsKey(emoji.name))
      .filter((name) => name.length > 0),
  );

  const avatarsByName = new Map<string, AvatarDefinition>();
  const messages: DialogueMessageModel[] = [];

  for (const avatar of payload.avatars) {
    avatarsByName.set(normalizeMagicWordsKey(avatar.name), avatar);
  }

  for (const entry of payload.dialogue) {
    const speakerKey = normalizeMagicWordsKey(entry.name);
    const avatar = avatarsByName.get(speakerKey);

    messages.push({
      speakerName: entry.name,
      speakerKey,
      side: resolveSide(avatar?.position),
      avatarUrl: avatar?.url,
      tokens: tokenizeRichText(entry.text, emojiNames),
    });
  }

  return { messages };
}

function resolveSide(position: string | undefined): DialogueSide {
  return normalizeMagicWordsKey(position ?? '') === 'right' ? 'right' : 'left';
}
