import { SceneId } from '@/runtime/scene/SceneId';

export interface MenuEntry {
  label: string;
  sceneId: SceneId;
}

export const MENU_ENTRIES: readonly MenuEntry[] = [
  {
    label: 'Ace of Shadows',
    sceneId: SceneId.AceOfShadows,
  },
  {
    label: 'Magic Words',
    sceneId: SceneId.MagicWords,
  },
  {
    label: 'Phoenix Flame',
    sceneId: SceneId.PhoenixFlame,
  },
] as const;
