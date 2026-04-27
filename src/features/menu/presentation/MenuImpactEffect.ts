import { MENU } from '@/features/menu/config/MenuConfig';
import { Emitter, type EmitterConfigV3 } from '@barvynkoa/particle-emitter';
import { gsap } from 'gsap';
import { type Container, Graphics, type Texture } from 'pixi.js';
type RingWaveConfig =
  (typeof MENU)['animation']['impact']['rings']['waves'][number];

const CORE_START_SCALE_MULT = 0.8;
const CORE_TARGET_SCALE_MULT = 0.7;
const GLOW_RING_STROKE_MULT = 2.5;
const GLOW_RING_ALPHA_MULT = 0.3;
const BRIGHT_RING_DURATION_MULT = 0.7;
const BURST_COLOR_RAMP = [
  { value: '#f06695', time: 0 },
  { value: '#ed427c', time: 0.4 },
  { value: '#e91e63', time: 0.75 },
  { value: '#d81557', time: 1 },
];
const BURST_ALPHA_RAMP = [
  { value: 0, time: 0 },
  { value: 1, time: 0.04 },
  { value: 1, time: 0.5 },
  { value: 0.95, time: 0.75 },
  { value: 0.25, time: 0.92 },
  { value: 0, time: 1 },
];

export class MenuImpactEffect {
  private readonly layer: Container;
  private readonly symbolTextures: readonly Texture[];

  private emitters: Emitter[] = [];
  private emitterGen = 0;

  constructor(layer: Container, symbolTextures: readonly Texture[]) {
    this.layer = layer;
    this.symbolTextures = symbolTextures;
  }

  fire(): void {
    this.clear();
    this.spawnImpactGlow();
    this.spawnRingWaves();
    this.spawnBurst();
  }

  update(dtSec: number): void {
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      const e = this.emitters[i];

      if (e.emit || e.particleCount > 0) {
        e.update(dtSec);
      }
    }
  }

  clear(): void {
    for (const e of this.emitters) {
      e.destroy();
    }

    this.emitters = [];
    this.emitterGen++;

    const children = this.layer.removeChildren();
    for (const child of children) {
      gsap.killTweensOf(child);
      gsap.killTweensOf(child.scale);

      child.destroy();
    }
  }

  private spawnImpactGlow(): void {
    const cfg = MENU.animation.impact.glow;

    const outerGlow = new Graphics()
      .ellipse(0, 0, cfg.radiusX, cfg.radiusY)
      .fill({ color: cfg.color, alpha: cfg.alpha });

    outerGlow.scale.set(cfg.startScale);
    this.layer.addChild(outerGlow);

    gsap.to(outerGlow, {
      alpha: 0,
      duration: cfg.duration,
      ease: cfg.ease,
      onComplete: () => outerGlow.destroy(),
    });

    gsap.to(outerGlow.scale, {
      x: cfg.targetScale,
      y: cfg.targetScale,
      duration: cfg.duration,
      ease: cfg.ease,
    });

    const core = new Graphics()
      .ellipse(0, 0, cfg.coreRadiusX, cfg.coreRadiusY)
      .fill({ color: 0xffffff, alpha: cfg.coreAlpha });
    core.scale.set(cfg.startScale * CORE_START_SCALE_MULT);

    this.layer.addChild(core);

    gsap.to(core, {
      alpha: 0,
      duration: cfg.coreDuration,
      ease: 'power3.out',
      onComplete: () => core.destroy(),
    });

    gsap.to(core.scale, {
      x: cfg.targetScale * CORE_TARGET_SCALE_MULT,
      y: cfg.targetScale * CORE_TARGET_SCALE_MULT,
      duration: cfg.coreDuration,
      ease: 'power2.out',
    });
  }

  private spawnRingWaves(): void {
    const waves = MENU.animation.impact.rings.waves;

    for (let i = 0; i < waves.length; i++) {
      this.spawnRingWave(waves[i]);
    }
  }

  private spawnRingWave(cfg: RingWaveConfig): void {
    const glowRing = new Graphics()
      .ellipse(0, 0, cfg.radiusX, cfg.radiusY)
      .stroke({
        width: cfg.stroke * GLOW_RING_STROKE_MULT,
        color: cfg.color,
        alpha: cfg.alpha * GLOW_RING_ALPHA_MULT,
      });

    glowRing.scale.set(cfg.startScale);
    this.layer.addChild(glowRing);

    gsap.to(glowRing, {
      alpha: 0,
      duration: cfg.duration,
      ease: cfg.ease,
      delay: cfg.delay,
      onComplete: () => glowRing.destroy(),
    });

    gsap.to(glowRing.scale, {
      x: cfg.targetScale,
      y: cfg.targetScale,
      duration: cfg.duration,
      ease: cfg.ease,
      delay: cfg.delay,
    });

    const brightRing = new Graphics()
      .ellipse(0, 0, cfg.radiusX, cfg.radiusY)
      .stroke({
        width: cfg.stroke,
        color: cfg.color,
        alpha: cfg.alpha,
      });

    brightRing.scale.set(cfg.startScale);
    this.layer.addChild(brightRing);

    gsap.to(brightRing, {
      alpha: 0,
      duration: cfg.duration * BRIGHT_RING_DURATION_MULT,
      ease: cfg.ease,
      delay: cfg.delay,
      onComplete: () => brightRing.destroy(),
    });

    gsap.to(brightRing.scale, {
      x: cfg.targetScale,
      y: cfg.targetScale,
      duration: cfg.duration,
      ease: cfg.ease,
      delay: cfg.delay,
    });
  }

  private spawnBurst(): void {
    if (this.symbolTextures.length === 0) {
      return;
    }

    const cfg = MENU.animation.impact.burst;
    const gen = this.emitterGen;

    const config: EmitterConfigV3 = {
      lifetime: { min: cfg.lifetimeMin, max: cfg.lifetimeMax },
      frequency: cfg.frequency,
      particlesPerWave: cfg.particlesPerWave,
      emitterLifetime: cfg.emitterLifetime,
      maxParticles: cfg.maxParticles,
      pos: { x: 0, y: 0 },
      emit: true,
      autoUpdate: false,
      behaviors: [
        {
          type: 'textureRandom',
          config: { textures: this.symbolTextures },
        },
        {
          type: 'alpha',
          config: {
            alpha: {
              list: BURST_ALPHA_RAMP,
            },
          },
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { value: cfg.scaleStart, time: 0 },
                { value: cfg.scalePeak, time: cfg.scalePeakTime },
                { value: cfg.scaleHold, time: cfg.scaleHoldTime },
                { value: cfg.scaleEnd, time: 1 },
              ],
            },
            minMult: cfg.scaleMinMult,
          },
        },
        {
          type: 'color',
          config: {
            color: {
              list: BURST_COLOR_RAMP,
            },
          },
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                { value: cfg.speedStart, time: 0 },
                { value: cfg.speedMid, time: 0.3 },
                { value: cfg.speedEnd, time: 1 },
              ],
            },
            minMult: cfg.speedMinMult,
          },
        },
        {
          type: 'rotation',
          config: {
            minStart: cfg.rotationMin,
            maxStart: cfg.rotationMax,
            minSpeed: -cfg.rotationSpeed,
            maxSpeed: cfg.rotationSpeed,
            accel: 0,
          },
        },
        {
          type: 'spawnShape',
          config: {
            type: 'rect',
            data: {
              x: -cfg.spawnWidth / 2,
              y: -cfg.spawnHeight / 2,
              w: cfg.spawnWidth,
              h: cfg.spawnHeight,
            },
          },
        },
        { type: 'blendMode', config: { blendMode: 'add' } },
      ],
    };

    const emitter = new Emitter(this.layer, config);
    emitter.emit = true;
    this.emitters.push(emitter);

    emitter.playOnceAndDestroy(() => {
      if (this.emitterGen === gen) {
        const idx = this.emitters.indexOf(emitter);

        if (idx >= 0) {
          this.emitters.splice(idx, 1);
        }
      }
    });
  }
}
