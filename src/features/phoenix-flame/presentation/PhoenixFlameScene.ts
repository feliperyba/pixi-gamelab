import type { SharedUITextures } from '@/infrastructure/SharedUIBundle';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import type { Scene } from '@/runtime/scene/Scene';
import { SceneId } from '@/runtime/scene/SceneId';
import type { Viewport } from '@/runtime/viewport/ViewportService';
import { GAME_VIEWPORT } from '@/runtime/viewport/ViewportService';
import type { Renderer, Texture } from 'pixi.js';
import { Container } from 'pixi.js';
import type { FlameConfig } from '../config/FlameConfig';
import { createDefaultFlameConfig } from '../config/FlameConfig';
import { DT_CAP_SEC } from '../config/SceneLayout';
import type { TextureCatalog } from '../infrastructure/TextureCatalog';
import { PhoenixFlameSceneView } from './PhoenixFlameSceneView';

export class PhoenixFlameScene extends Container implements Scene {
  readonly id = SceneId.PhoenixFlame;

  private readonly atlas: AtlasTextures;
  private readonly shared: SharedUITextures;
  private readonly renderer: Renderer;

  private readonly config: FlameConfig = createDefaultFlameConfig();

  private view: PhoenixFlameSceneView | null = null;
  private catalog: TextureCatalog | null = null;
  private viewWidth = GAME_VIEWPORT.width;
  private viewHeight = GAME_VIEWPORT.height;

  private selectedFlameKeys: string[] = [];
  private selectedSmokeKeys: string[] = [];
  private selectedEmberKeys: string[] = [];

  constructor(
    shared: SharedUITextures,
    renderer: Renderer,
    atlas: AtlasTextures,
  ) {
    super();

    this.atlas = atlas;
    this.shared = shared;
    this.renderer = renderer;
  }

  async enter(): Promise<void> {
    this.view = new PhoenixFlameSceneView(this.shared, this.renderer);

    this.view.attachTo(this);

    const catalog = this.view.initCatalog(this.atlas);
    this.catalog = catalog;

    this.applyTextureDefaults(catalog);

    this.view.initPreviewFrame();
    this.view.initFlameEffect(
      catalog,
      this.selectedFlameKeys,
      this.selectedSmokeKeys,
      this.selectedEmberKeys,
      this.config,
    );

    this.view.initCounterBadge();

    this.view.initControlPanel(
      catalog,
      this.config,
      this.selectedFlameKeys,
      this.selectedSmokeKeys,
      this.selectedEmberKeys,
      (keys) =>
        this.applyTextureSelection(keys, 'selectedFlameKeys', (t) =>
          this.view?.setFlameTextures(t),
        ),
      (keys) =>
        this.applyTextureSelection(keys, 'selectedSmokeKeys', (t) =>
          this.view?.setSmokeTextures(t),
        ),
      (keys) =>
        this.applyTextureSelection(keys, 'selectedEmberKeys', (t) =>
          this.view?.setEmberTextures(t),
        ),
      () => this.resetConfig(),
    );

    this.view.mountAll();
    this.view.layout(this.viewWidth, this.viewHeight);
  }

  async exit(): Promise<void> {
    this.view?.destroy();
    this.view = null;
  }

  update(dt: number): void {
    const dtSec = Math.min(dt / 1000, DT_CAP_SEC);

    this.view?.updateFlame(dtSec, this.config);
    this.view?.updateParticleCount();
  }

  resize(viewport: Viewport): void {
    this.viewWidth = viewport.width;
    this.viewHeight = viewport.height;

    this.view?.layout(this.viewWidth, this.viewHeight);
  }

  private resetConfig(): void {
    Object.assign(this.config, createDefaultFlameConfig());

    if (!this.catalog) {
      return;
    }

    this.applyTextureDefaults(this.catalog);

    this.view?.resetAllPickers(
      this.selectedFlameKeys,
      this.selectedSmokeKeys,
      this.selectedEmberKeys,
    );
  }

  private applyTextureDefaults(catalog: TextureCatalog): void {
    this.selectedFlameKeys = catalog.defaultFlameKeys();
    this.selectedSmokeKeys = catalog.defaultSmokeKeys();
    this.selectedEmberKeys = catalog.defaultEmberKeys();

    this.view?.setFlameTextures(
      catalog.resolveTextures(this.selectedFlameKeys),
    );
    this.view?.setSmokeTextures(
      catalog.resolveTextures(this.selectedSmokeKeys),
    );
    this.view?.setEmberTextures(
      catalog.resolveTextures(this.selectedEmberKeys),
    );
  }

  private applyTextureSelection(
    keys: string[],
    slot: 'selectedFlameKeys' | 'selectedSmokeKeys' | 'selectedEmberKeys',
    applyToEffect: (textures: Texture[]) => void,
  ): void {
    this[slot] = [...keys];
    applyToEffect(this.catalog?.resolveTextures(keys) ?? []);
  }
}
