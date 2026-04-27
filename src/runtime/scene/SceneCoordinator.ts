import { Container, type ContainerChild } from 'pixi.js';
import type { Viewport } from '../viewport/ViewportService';
import type { Scene } from './Scene';
import type { SceneId } from './SceneId';

export type SceneView = Scene & ContainerChild;

export interface SceneDefinition {
  createScene: (navigateTo: (id: SceneId) => Promise<void>) => SceneView;
  showBackButton: boolean;
}

interface SceneCoordinatorOptions {
  sceneRegistry: Record<SceneId, SceneDefinition>;
  onSceneChanged?: (sceneId: SceneId, definition: SceneDefinition) => void;
}

export class SceneCoordinator {
  readonly sceneContainer = new Container();

  private readonly sceneRegistry: Record<SceneId, SceneDefinition>;
  private readonly onSceneChanged?: (
    sceneId: SceneId,
    definition: SceneDefinition,
  ) => void;

  private activeScene: SceneView | null = null;
  private activeViewport: Viewport | null = null;

  constructor(options: SceneCoordinatorOptions) {
    this.sceneRegistry = options.sceneRegistry;
    this.onSceneChanged = options.onSceneChanged;
  }

  async start(initialSceneId: SceneId, viewport: Viewport): Promise<void> {
    this.activeViewport = viewport;
    await this.goTo(initialSceneId);
  }

  async goTo(sceneId: SceneId): Promise<void> {
    const definition = this.sceneRegistry[sceneId];
    if (!definition) {
      console.warn(`[SceneCoordinator] Unknown scene ID: "${sceneId}"`);
      return;
    }

    await this.teardownActive();

    const scene = definition.createScene(this.navigate);
    this.activeScene = scene;
    this.sceneContainer.addChild(scene);

    await scene.enter();

    if (this.activeViewport) {
      scene.resize(this.activeViewport);
    }

    this.onSceneChanged?.(sceneId, definition);
  }

  update(dtMs: number): void {
    this.activeScene?.update(dtMs);
  }

  resize(viewport: Viewport): void {
    this.activeViewport = viewport;
    this.activeScene?.resize(viewport);
  }

  async destroy(): Promise<void> {
    await this.teardownActive();
  }

  private async teardownActive(): Promise<void> {
    if (!this.activeScene) {
      return;
    }

    const scene = this.activeScene;
    this.activeScene = null;
    this.sceneContainer.removeChild(scene);

    try {
      await scene.exit();
    } catch (err) {
      console.error('[SceneCoordinator] Scene exit() failed:', err);
    } finally {
      scene.destroy({ children: true });
    }
  }

  private readonly navigate = async (sceneId: SceneId): Promise<void> => {
    await this.goTo(sceneId);
  };
}
