import type {
  AvatarDefinition,
  DialogueEntry,
  EmojiDefinition,
  MagicWordsPayload,
} from '@/features/magic-words/application/MagicWordsModels';
import type { MagicWordsPayloadSource } from '@/features/magic-words/application/MagicWordsPayloadSource';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';

interface MagicWordsApiPayload {
  readonly dialogue: readonly unknown[];
  readonly emojies: readonly unknown[];
  readonly avatars: readonly unknown[];
}

export class MagicWordsDataSource implements MagicWordsPayloadSource {
  async load(): Promise<MagicWordsPayload | null> {
    try {
      const response = await fetch(MAGIC.payloadUrl, {
        signal: AbortSignal.timeout(MAGIC.fetchTimeoutMs),
      });

      if (!response.ok) {
        return null;
      }

      const raw = (await response.json()) as MagicWordsApiPayload;
      return {
        dialogue: this.parseDialogue(raw?.dialogue ?? []),
        emojis: this.parseEmojis(raw?.emojies ?? []),
        avatars: this.parseAvatars(raw?.avatars ?? []),
      };
    } catch {
      return null;
    }
  }

  private parseDialogue(input: readonly unknown[]): DialogueEntry[] {
    return this.parseArray(input, (record) => {
      const name = this.readString(record.name);
      const text = this.readString(record.text);
      return name && text ? { name, text } : null;
    });
  }

  private parseEmojis(input: readonly unknown[]): EmojiDefinition[] {
    return this.parseArray(input, (record) => {
      const name = this.readString(record.name);
      const url = this.readString(record.url);
      return name && url ? { name, url } : null;
    });
  }

  private parseAvatars(input: readonly unknown[]): AvatarDefinition[] {
    return this.parseArray(input, (record) => {
      const name = this.readString(record.name);
      const url = this.readString(record.url);

      if (!name || !url) {
        return null;
      }

      const position = this.readString(record.position);
      return { name, url, position: position ?? undefined };
    });
  }

  private parseArray<T>(
    input: readonly unknown[],
    parseItem: (record: Record<string, unknown>) => T | null,
  ): T[] {
    const entries: T[] = [];

    for (const item of input) {
      if (!this.isRecord(item)) {
        continue;
      }

      const parsed = parseItem(item);
      if (parsed) {
        entries.push(parsed);
      }
    }

    return entries;
  }

  private readString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
