import { Emitter, type EmitterConfigV3 } from '@barvynkoa/particle-emitter';
import type { DestroyOptions, Texture } from 'pixi.js';
import { Container } from 'pixi.js';
import {
  allocateBudget,
  type EmitterAvailability,
} from '../application/BudgetAllocator';
import type { FlameConfig } from '../config/FlameConfig';
import {
  buildEmberConfig,
  buildFlameConfig,
  buildSmokeConfig,
  configChanged,
} from '../infrastructure/FlameConfigMapper';

export class FlameEffect extends Container {
  private readonly flameContainer = new Container();
  private readonly smokeContainer = new Container();
  private readonly emberContainer = new Container();

  private flameEmitter: Emitter | null = null;
  private smokeEmitter: Emitter | null = null;
  private emberEmitter: Emitter | null = null;

  private flameTextures: Texture[] = [];
  private smokeTextures: Texture[] = [];
  private emberTextures: Texture[] = [];

  private prevConfig: FlameConfig | null = null;
  private texturesDirty = true;

  private get availability(): EmitterAvailability {
    return {
      flameTextures: this.flameTextures.length > 0,
      emberTextures: this.emberTextures.length > 0,
      smokeTextures: this.smokeTextures.length > 0,
    };
  }

  constructor() {
    super();

    this.interactiveChildren = false;

    this.addChild(this.smokeContainer);
    this.addChild(this.flameContainer);
    this.addChild(this.emberContainer);
  }

  setup(
    flameTextures: Texture[],
    smokeTextures: Texture[],
    emberTextures: Texture[],
    config: FlameConfig,
  ): void {
    this.flameTextures = flameTextures;
    this.smokeTextures = smokeTextures;
    this.emberTextures = emberTextures;

    this.rebuildAll(config);
  }

  /**
   * Per-frame update. Any config or texture change triggers a full rebuild of all three
   * emitters because the budget is a shared pool: adding/removing one emitter type
   * redistributes slots across all others. Rebuilding only the dirty emitter would leave
   * the others with stale maxParticles, causing the total to exceed the 10-sprite budget.
   */
  update(dtSec: number, config: FlameConfig): void {
    const needsRebuild =
      !this.prevConfig ||
      configChanged(this.prevConfig, config) ||
      this.texturesDirty;

    if (needsRebuild) {
      this.rebuildAll(config);
    }

    this.tickEmitters(dtSec);
  }

  get visibleParticleCount(): number {
    return (
      (this.flameEmitter?.particleCount ?? 0) +
      (this.smokeEmitter?.particleCount ?? 0) +
      (this.emberEmitter?.particleCount ?? 0)
    );
  }

  setFlameTextures(textures: Texture[]): void {
    this.flameTextures = textures;
    this.texturesDirty = true;
  }

  setSmokeTextures(textures: Texture[]): void {
    this.smokeTextures = textures;
    this.texturesDirty = true;
  }

  setEmberTextures(textures: Texture[]): void {
    this.emberTextures = textures;
    this.texturesDirty = true;
  }

  destroy(_options?: DestroyOptions): void {
    this.destroyEmitter(this.flameEmitter);
    this.destroyEmitter(this.smokeEmitter);
    this.destroyEmitter(this.emberEmitter);

    this.flameEmitter = null;
    this.smokeEmitter = null;
    this.emberEmitter = null;

    super.destroy({ children: true });
  }

  private rebuildAll(config: FlameConfig): void {
    this.prevConfig = { ...config };
    this.texturesDirty = false;

    const budget = allocateBudget(config, this.availability);

    this.flameEmitter = this.applyConfig(
      this.flameEmitter,
      this.flameContainer,
      buildFlameConfig(config, this.flameTextures, budget.flame),
    );

    this.smokeEmitter = this.applyConfig(
      this.smokeEmitter,
      this.smokeContainer,
      buildSmokeConfig(config, this.smokeTextures, budget.smoke),
    );

    this.emberEmitter = this.applyConfig(
      this.emberEmitter,
      this.emberContainer,
      buildEmberConfig(config, this.emberTextures, budget.ember),
    );
  }

  private tickEmitters(dtSec: number): void {
    this.tickOneEmitter(this.flameEmitter, dtSec);
    this.tickOneEmitter(this.smokeEmitter, dtSec);
    this.tickOneEmitter(this.emberEmitter, dtSec);
  }

  private tickOneEmitter(e: Emitter | null, dtSec: number): void {
    if (e && (e.emit || e.particleCount > 0)) {
      e.update(dtSec);
    }
  }

  private applyConfig(
    emitter: Emitter | null,
    parent: Container,
    config: EmitterConfigV3 | null,
  ): Emitter | null {
    this.destroyEmitter(emitter);

    for (let i = parent.children.length - 1; i >= 0; i--) {
      parent.removeChildAt(i).destroy();
    }

    if (!config) {
      return null;
    }

    const next = new Emitter(parent, config);
    next.autoUpdate = false;
    next.emit = true;

    return next;
  }

  private destroyEmitter(emitter: Emitter | null): void {
    if (!emitter) {
      return;
    }

    emitter.emit = false;
    emitter.destroy();
  }
}
