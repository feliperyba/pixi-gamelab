export type DialogueSide = 'left' | 'right';

export interface DialogueEntry {
  readonly name: string;
  readonly text: string;
}

export interface EmojiDefinition {
  readonly name: string;
  readonly url: string;
}

export interface AvatarDefinition {
  readonly name: string;
  readonly url: string;
  readonly position?: string;
}

export interface MagicWordsPayload {
  readonly dialogue: readonly DialogueEntry[];
  readonly emojis: readonly EmojiDefinition[];
  readonly avatars: readonly AvatarDefinition[];
}

export type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'emoji'; name: string }
  | { kind: 'omitted'; name: string };

export interface DialogueMessageModel {
  readonly speakerName: string;
  readonly speakerKey: string;
  readonly side: DialogueSide;
  readonly avatarUrl?: string;
  readonly tokens: readonly InlineToken[];
}

export interface DialogueFeedModel {
  readonly messages: readonly DialogueMessageModel[];
}
