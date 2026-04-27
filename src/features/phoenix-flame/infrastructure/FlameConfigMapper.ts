import { lerp, lerpColor, toHex } from '@/infrastructure/utils';
import type { EmitterConfigV3 } from '@barvynkoa/particle-emitter';
import type { Texture } from 'pixi.js';
import type { FlameConfig } from '../config/FlameConfig';

const FLAME_HEIGHT_SPEED_FACTOR = 0.5;

const FLAME = {
  frequency: [0.2, 0.015] as const,
  speedStart: [25, 380] as const,
  speedEndRatio: 0.2,
  speedMinMult: 0.65,
  lifetimeMin: [0.25, 0.6] as const,
  lifetimeMax: [0.6, 1.4] as const,
  alphaStart: [0.25, 1.0] as const,
  alphaMidRatio: 0.65,
  alphaMidTime: 0.5,
  torusRadius: [5, 30] as const,
  rotationSpeed: [0, 140] as const,
  rotation: { minStart: 252, maxStart: 288 },
  scaleStart: [0.25, 0.6] as const,
  scaleEnd: [0.65, 3] as const,
  scaleMinMult: 0.5,
  colors: {
    core: [0xffe066, 0xffffff] as const,
    mid: [0xff8800, 0xffed80] as const,
    tip: [0xdd4411, 0xff6b35] as const,
  },
  colorTimes: [0, 0.4, 1] as const,
} as const;

const SMOKE = {
  frequency: [0.4, 0.08] as const,
  opacityFactor: 0.75,
  scaleStart: [0.4, 0.7] as const,
  scaleEnd: [0.75, 7.4] as const,
  scaleMinMult: 0.6,
  spawnRadius: [5, 40] as const,
  lifetimeMin: [0.5, 1.2] as const,
  lifetimeMax: [1.0, 2.4] as const,
  spawnOffsetY: -8,
  speedStart: [40, 100] as const,
  speedEnd: [10, 40] as const,
  speedMinMult: 0.5,
  rotation: { minStart: 252, maxStart: 292, speed: 25 },
  color: 0x554042,
  alphaCurve: [
    { value: 0, time: 0 },
    { value: 1, time: 0.2 },
    { value: 0.5, time: 0.7 },
    { value: 0, time: 1 },
  ],
} as const;

const EMBER = {
  frequency: [0.5, 0.12] as const,
  lifetimeMin: [0.2, 0.6] as const,
  lifetimeMax: [0.5, 1.4] as const,
  spawnOffsetY: -10,
  scaleMin: [0.03, 0.15] as const,
  scaleMax: [0.25, 1.0] as const,
  speedStart: [100, 250] as const,
  speedEnd: [30, 80] as const,
  speedMinMult: 0.6,
  rotation: { minStart: 235, maxStart: 305, speed: 70 },
  spawnRadius: 15,
  colors: { start: 0xffffee, mid: 0xffaa44, end: 0xee3300 },
  colorTimes: [0, 0.5, 1] as const,
  alphaCurve: [
    { value: 1, time: 0 },
    { value: 0.8, time: 0.5 },
    { value: 0, time: 1 },
  ],
} as const;

export function buildFlameConfig(
  config: FlameConfig,
  textures: Texture[],
  maxParticles: number,
): EmitterConfigV3 | null {
  if (maxParticles <= 0 || textures.length === 0) {
    return null;
  }

  const frequency = lerp(...FLAME.frequency, config.intensity);
  const speed = lerp(
    ...FLAME.speedStart,
    config.flameSpeed + config.flameHeight * FLAME_HEIGHT_SPEED_FACTOR,
  );
  const alphaStart = lerp(...FLAME.alphaStart, config.coreStrength);
  const torusRadius = lerp(...FLAME.torusRadius, config.flameWidth);
  const rotSpeed = lerp(...FLAME.rotationSpeed, config.turbulence);
  const scaleStart = lerp(...FLAME.scaleStart, config.flameSize);
  const scaleEnd = lerp(...FLAME.scaleEnd, config.flameSize);

  return {
    lifetime: {
      min: lerp(...FLAME.lifetimeMin, config.flameLifetime),
      max: lerp(...FLAME.lifetimeMax, config.flameLifetime),
    },
    frequency,
    pos: { x: 0, y: 0 },
    maxParticles,
    behaviors: [
      textureBehavior(textures),
      alphaBehavior([
        { value: alphaStart, time: 0 },
        { value: alphaStart * FLAME.alphaMidRatio, time: FLAME.alphaMidTime },
        { value: 0, time: 1 },
      ]),
      scaleBehavior(scaleStart, scaleEnd, FLAME.scaleMinMult),
      colorBehavior(
        FLAME.colorTimes,
        lerpColor(...FLAME.colors.core, config.warmth),
        lerpColor(...FLAME.colors.mid, config.warmth),
        lerpColor(...FLAME.colors.tip, config.warmth),
      ),
      moveSpeedBehavior(speed, speed * FLAME.speedEndRatio, FLAME.speedMinMult),
      rotationBehavior(FLAME.rotation, rotSpeed),
      torusSpawnBehavior(torusRadius),
      NO_ROTATION,
      ADDITIVE_BLEND,
    ],
  };
}

export function buildSmokeConfig(
  config: FlameConfig,
  textures: Texture[],
  maxParticles: number,
): EmitterConfigV3 | null {
  if (maxParticles <= 0 || textures.length === 0) {
    return null;
  }

  const frequency = lerp(...SMOKE.frequency, config.smokeAmount);
  const alphaMax = config.smokeOpacity * SMOKE.opacityFactor;
  const scaleStart = lerp(...SMOKE.scaleStart, config.smokeSize);
  const scaleEnd = lerp(...SMOKE.scaleEnd, config.smokeSize);
  const spawnRadius = lerp(...SMOKE.spawnRadius, config.smokeSpread);
  const speedStart = lerp(...SMOKE.speedStart, config.smokeSpeed);
  const speedEnd = lerp(...SMOKE.speedEnd, config.smokeSpeed);

  return {
    lifetime: {
      min: lerp(...SMOKE.lifetimeMin, config.smokeLifetime),
      max: lerp(...SMOKE.lifetimeMax, config.smokeLifetime),
    },
    frequency,
    pos: { x: 0, y: SMOKE.spawnOffsetY },
    maxParticles,
    behaviors: [
      textureBehavior(textures),
      alphaBehavior(
        SMOKE.alphaCurve.map((k) => ({
          value: k.value * alphaMax,
          time: k.time,
        })),
      ),
      scaleBehavior(scaleStart, scaleEnd, SMOKE.scaleMinMult),
      { type: 'colorStatic', config: { color: toHex(SMOKE.color) } },
      moveSpeedBehavior(speedStart, speedEnd, SMOKE.speedMinMult),
      rotationBehavior(SMOKE.rotation, SMOKE.rotation.speed),
      torusSpawnBehavior(spawnRadius),
      NO_ROTATION,
    ],
  };
}

export function buildEmberConfig(
  config: FlameConfig,
  textures: Texture[],
  maxParticles: number,
): EmitterConfigV3 | null {
  if (maxParticles <= 0 || textures.length === 0) {
    return null;
  }

  const frequency = lerp(...EMBER.frequency, config.emberAmount);
  const scaleMin = lerp(...EMBER.scaleMin, config.emberSize);
  const scaleMax = lerp(...EMBER.scaleMax, config.emberSize);
  const speedStart = lerp(...EMBER.speedStart, config.emberSpeed);
  const speedEnd = lerp(...EMBER.speedEnd, config.emberSpeed);

  return {
    lifetime: {
      min: lerp(...EMBER.lifetimeMin, config.emberLifetime),
      max: lerp(...EMBER.lifetimeMax, config.emberLifetime),
    },
    frequency,
    pos: { x: 0, y: EMBER.spawnOffsetY },
    maxParticles,
    behaviors: [
      textureBehavior(textures),
      alphaBehavior([...EMBER.alphaCurve]),
      { type: 'scaleStatic', config: { min: scaleMin, max: scaleMax } },
      colorBehavior(
        EMBER.colorTimes,
        EMBER.colors.start,
        EMBER.colors.mid,
        EMBER.colors.end,
      ),
      moveSpeedBehavior(speedStart, speedEnd, EMBER.speedMinMult),
      rotationBehavior(EMBER.rotation, EMBER.rotation.speed),
      torusSpawnBehavior(EMBER.spawnRadius),
      NO_ROTATION,
      ADDITIVE_BLEND,
    ],
  };
}

const NO_ROTATION = { type: 'noRotation' as const, config: { rotation: 0 } };
const ADDITIVE_BLEND = {
  type: 'blendMode' as const,
  config: { blendMode: 'add' },
};

function textureBehavior(textures: Texture[]) {
  return textures.length === 1
    ? { type: 'textureSingle' as const, config: { texture: textures[0] } }
    : { type: 'textureRandom' as const, config: { textures } };
}

function alphaBehavior(list: { value: number; time: number }[]) {
  return { type: 'alpha' as const, config: { alpha: { list } } };
}

function colorBehavior(
  times: readonly [number, number, number],
  c0: number,
  c1: number,
  c2: number,
) {
  return {
    type: 'color' as const,
    config: {
      color: {
        list: [
          { value: toHex(c0), time: times[0] },
          { value: toHex(c1), time: times[1] },
          { value: toHex(c2), time: times[2] },
        ],
      },
    },
  };
}

function scaleBehavior(start: number, end: number, minMult: number) {
  return {
    type: 'scale' as const,
    config: {
      scale: {
        list: [
          { value: start, time: 0 },
          { value: end, time: 1 },
        ],
      },
      minMult,
    },
  };
}

function moveSpeedBehavior(start: number, end: number, minMult: number) {
  return {
    type: 'moveSpeed' as const,
    config: {
      speed: {
        list: [
          { value: start, time: 0 },
          { value: end, time: 1 },
        ],
      },
      minMult,
    },
  };
}

function rotationBehavior(
  range: { minStart: number; maxStart: number },
  speed: number,
) {
  return {
    type: 'rotation' as const,
    config: {
      minStart: range.minStart,
      maxStart: range.maxStart,
      minSpeed: -speed,
      maxSpeed: speed,
      accel: 0,
    },
  };
}

function torusSpawnBehavior(radius: number, innerRadius = 0) {
  return {
    type: 'spawnShape' as const,
    config: {
      type: 'torus',
      data: { x: 0, y: 0, radius, innerRadius, affectRotation: false },
    },
  };
}

export function configChanged(a: FlameConfig, b: FlameConfig): boolean {
  const keys = Object.keys(a) as readonly (keyof FlameConfig)[];

  for (let i = 0; i < keys.length; i++) {
    if (a[keys[i]] !== b[keys[i]]) {
      return true;
    }
  }

  return false;
}
