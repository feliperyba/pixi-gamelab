import type { Viewport } from '../viewport/ViewportService';
import type { SceneId } from './SceneId';

export interface Scene {
  readonly id: SceneId;
  enter(): Promise<void>;
  exit(): Promise<void>;
  update(dt: number): void;
  resize(viewport: Viewport): void;
}
