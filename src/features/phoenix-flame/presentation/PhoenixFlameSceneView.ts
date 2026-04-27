import type { SharedUITextures } from '@/infrastructure/SharedUIBundle';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import { PixiCounterBadge } from '@/ui/components/PixiCounterBadge';
import { BRAND } from '@/ui/theme/BrandTokens';
import type { Renderer, Texture } from 'pixi.js';
import { Container, Graphics } from 'pixi.js';
import {
  computeFireAnchorPlacement,
  computePreviewRect,
} from '../application/SceneLayout';
import type { FlameConfig } from '../config/FlameConfig';
import { PANEL_INSETS, PANEL_WIDTH } from '../config/PanelLayout';
import {
  COUNTER_BADGE,
  MAX_VISIBLE_PARTICLES,
  PANEL_FALLBACK_MARGIN,
  SCENE_BG_COLOR,
} from '../config/SceneLayout';
import { TextureCatalog } from '../infrastructure/TextureCatalog';
import { FlameControlPanel } from './FlameControlPanel';
import { FlameEffect } from './FlameEffect';
import { PreviewFrame } from './PreviewFrame';

export class PhoenixFlameSceneView {
  private readonly renderer: Renderer;
  private readonly shared: SharedUITextures;

  private readonly background = new Graphics();
  private readonly fireAnchor = new Container();
  private readonly previewFrame = new PreviewFrame();

  private catalog: TextureCatalog | null = null;
  private flameEffect: FlameEffect | null = null;
  private controlPanel: FlameControlPanel | null = null;
  private counterBadge: PixiCounterBadge | null = null;

  constructor(shared: SharedUITextures, renderer: Renderer) {
    this.shared = shared;
    this.renderer = renderer;
  }

  attachTo(parent: Container): void {
    parent.addChild(this.background);
  }

  initCatalog(atlas: AtlasTextures): TextureCatalog {
    this.catalog = new TextureCatalog(this.renderer, atlas);
    return this.catalog;
  }

  initPreviewFrame(): void {
    this.previewFrame.init(this.renderer);
    this.previewFrame.stage.eventMode = 'none';
  }

  initFlameEffect(
    catalog: TextureCatalog,
    flameKeys: string[],
    smokeKeys: string[],
    emberKeys: string[],
    config: FlameConfig,
  ): void {
    this.fireAnchor.eventMode = 'none';
    this.fireAnchor.interactiveChildren = false;

    this.flameEffect = new FlameEffect();
    this.flameEffect.setup(
      catalog.resolveTextures(flameKeys),
      catalog.resolveTextures(smokeKeys),
      catalog.resolveTextures(emberKeys),
      config,
    );

    this.fireAnchor.addChild(this.flameEffect);
  }

  initCounterBadge(): void {
    this.counterBadge = this.buildCounterBadge();
  }

  initControlPanel(
    catalog: TextureCatalog,
    config: FlameConfig,
    flameKeys: string[],
    smokeKeys: string[],
    emberKeys: string[],
    onFlameTexturesChange: (keys: string[]) => void,
    onSmokeTexturesChange: (keys: string[]) => void,
    onEmberTexturesChange: (keys: string[]) => void,
    onResetDefaults: () => void,
  ): void {
    this.controlPanel = new FlameControlPanel({
      config,
      shared: this.shared,
      flameTextureOptions: catalog.flameOptions(),
      smokeTextureOptions: catalog.smokeOptions(),
      emberTextureOptions: catalog.emberOptions(),
      selectedFlameTextureKeys: [...flameKeys],
      selectedSmokeTextureKeys: [...smokeKeys],
      selectedEmberTextureKeys: [...emberKeys],
      onFlameTexturesChange,
      onSmokeTexturesChange,
      onEmberTexturesChange,
      onResetDefaults,
    });
  }

  mountAll(): void {
    const parent = this.background.parent;
    if (!parent) {
      return;
    }

    parent.addChild(this.previewFrame.stage);
    parent.addChild(this.fireAnchor);
    parent.addChild(this.counterBadge!);
    parent.addChild(this.controlPanel!);
  }

  layout(viewWidth: number, viewHeight: number): void {
    this.background.clear();
    this.background.rect(0, 0, viewWidth, viewHeight);
    this.background.fill(SCENE_BG_COLOR);

    this.controlPanel?.layout(viewWidth, viewHeight);

    const panelX =
      this.controlPanel?.x ?? viewWidth - PANEL_WIDTH - PANEL_FALLBACK_MARGIN;

    const panelY = this.controlPanel?.y ?? PANEL_FALLBACK_MARGIN;

    const panelH =
      this.controlPanel?.getPanelHeight() ??
      viewHeight - PANEL_FALLBACK_MARGIN * 2;

    const preview = computePreviewRect(panelX, panelY, panelH);
    this.previewFrame.draw(preview);

    const anchor = computeFireAnchorPlacement(preview);
    this.fireAnchor.position.set(anchor.x, anchor.y);
    this.fireAnchor.scale.set(anchor.scale);

    this.counterBadge?.position.set(
      preview.x + preview.width - COUNTER_BADGE.offsetX,
      preview.y + COUNTER_BADGE.offsetY,
    );
  }

  destroy(): void {
    this.controlPanel?.destroy();
    this.controlPanel = null;

    this.counterBadge?.destroy();
    this.counterBadge = null;

    this.flameEffect?.destroy();
    this.flameEffect = null;

    this.previewFrame.destroy();

    this.catalog?.destroy();
    this.catalog = null;

    this.fireAnchor.destroy({ children: true });
    this.background.destroy();
  }

  setFlameTextures(textures: Texture[]): void {
    this.flameEffect?.setFlameTextures(textures);
  }

  setSmokeTextures(textures: Texture[]): void {
    this.flameEffect?.setSmokeTextures(textures);
  }

  setEmberTextures(textures: Texture[]): void {
    this.flameEffect?.setEmberTextures(textures);
  }

  updateFlame(dtSec: number, config: FlameConfig): void {
    this.flameEffect?.update(dtSec, config);
  }

  updateParticleCount(): void {
    this.counterBadge?.updateValue(
      Math.min(
        MAX_VISIBLE_PARTICLES,
        this.flameEffect?.visibleParticleCount ?? 0,
      ),
    );
  }

  resetAllPickers(
    flameKeys: readonly string[],
    smokeKeys: readonly string[],
    emberKeys: readonly string[],
  ): void {
    this.controlPanel?.resetAllPickers(flameKeys, smokeKeys, emberKeys);
  }

  private buildCounterBadge(): PixiCounterBadge {
    const badge = new PixiCounterBadge(
      { label: 'PARTICLES', max: MAX_VISIBLE_PARTICLES },
      {
        panelTexture: this.shared.metalPanel,
        panelInsets: PANEL_INSETS,
        panelTint: COUNTER_BADGE.panelTint,
        labelStyle: {
          fontFamily: BRAND.fonts.body,
          fontSize: COUNTER_BADGE.fontSize,
          fill: COUNTER_BADGE.labelColor,
        },
        valueStyle: {
          fontFamily: BRAND.fonts.body,
          fontSize: COUNTER_BADGE.fontSize,
          fill: COUNTER_BADGE.valueColor,
          fontWeight: 'bold',
        },
      },
    );

    badge.applyLayout({
      width: COUNTER_BADGE.width,
      height: COUNTER_BADGE.height,
      paddingX: COUNTER_BADGE.paddingX,
    });

    return badge;
  }
}
