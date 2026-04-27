import {
  loadMenuTextures,
  unloadMenuTextures,
} from '@/features/menu/infrastructure/MenuAssetBundle';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import type { Scene } from '@/runtime/scene/Scene';
import { SceneId } from '@/runtime/scene/SceneId';
import type { Viewport } from '@/runtime/viewport/ViewportService';
import { Container } from 'pixi.js';
import type { MenuEntry } from '../application/MenuEntries';
import { MenuEntranceChoreographer } from './MenuEntranceChoreographer';
import { MenuSceneView } from './MenuSceneView';

export class MenuScene extends Container implements Scene {
  readonly id = SceneId.Menu;

  private readonly atlas: AtlasTextures;
  private readonly entries: readonly MenuEntry[];
  private readonly navigateTo: (id: SceneId) => Promise<void>;

  private view: MenuSceneView | null = null;
  private choreographer: MenuEntranceChoreographer | null = null;

  private viewW = 0;
  private viewH = 0;
  private initialized = false;
  private entranceStarted = false;
  private menuInteractive = false;

  constructor(
    entries: readonly MenuEntry[],
    navigateTo: (id: SceneId) => Promise<void>,
    atlas: AtlasTextures,
  ) {
    super();

    this.atlas = atlas;
    this.entries = entries;
    this.navigateTo = navigateTo;
  }

  async enter() {
    const textures = await loadMenuTextures(this.atlas);

    this.view = new MenuSceneView(textures, this.entries, (sceneId) => {
      if (!this.menuInteractive) {
        return;
      }

      void this.navigateTo(sceneId);
    });

    this.view.attachTo(this);

    this.choreographer = new MenuEntranceChoreographer({
      ...this.view.refs,
      symbolTextures: [textures.symbol1, textures.symbol2],
      onCardsReady: () => {
        this.menuInteractive = true;
      },
    });

    this.initialized = true;
    this.entranceStarted = false;
    this.menuInteractive = false;

    this.applyLayout();
  }

  async exit() {
    this.initialized = false;
    this.entranceStarted = false;
    this.menuInteractive = false;

    this.choreographer?.dispose();
    this.choreographer = null;
    this.view?.destroy();
    this.view = null;

    await unloadMenuTextures();
  }

  update(dt: number) {
    if (!this.initialized) {
      return;
    }

    this.view?.updateDrift(dt);
    this.choreographer?.update(dt / 1000);
  }

  resize(viewport: Viewport) {
    this.viewW = viewport.width;
    this.viewH = viewport.height;

    if (this.initialized) {
      this.applyLayout();
    }
  }

  private applyLayout() {
    const view = this.view;
    const choreographer = this.choreographer;

    if (!view || !choreographer || this.viewW === 0 || this.viewH === 0) {
      return;
    }

    const result = view.layout(this.viewW, this.viewH);

    choreographer.syncLayout({
      titleX: result.titleX,
      titleY: result.titleY,
      cardTargets: result.cardTargets,
    });

    if (!this.entranceStarted) {
      this.entranceStarted = true;
      choreographer.play();
    }
  }
}
