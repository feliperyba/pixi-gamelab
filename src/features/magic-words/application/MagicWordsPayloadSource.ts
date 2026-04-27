import type { MagicWordsPayload } from './MagicWordsModels';

export interface MagicWordsPayloadSource {
  load(): Promise<MagicWordsPayload | null>;
}
