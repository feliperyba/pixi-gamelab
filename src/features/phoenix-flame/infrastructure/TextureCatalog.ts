import { extractRGB } from '@/infrastructure/utils';
import type { TextureOptionEntry } from '@/ui/contracts/TexturePickerViewModel';
import type { Renderer, Texture } from 'pixi.js';
import { FillGradient, Graphics } from 'pixi.js';

// Texture catalog config
const PROCEDURAL = {
  flameSize: 64,
  flameColor: 0xffeedd,
  smokeSize: 64,
  smokeColor: 0x888888,
  emberSize: 24,
  emberColor: 0xffc267,
} as const;

interface SoftCircleStop {
  readonly position: number;
  readonly alpha: number;
}

const SOFT_CIRCLE_STOPS: readonly SoftCircleStop[] = [
  { position: 0, alpha: 1 },
  { position: 0.35, alpha: 0.7 },
  { position: 0.7, alpha: 0.25 },
  { position: 1, alpha: 0 },
];

const FLAME_TEXTURE_COUNT = 6;
const SMOKE_TEXTURE_COUNT = 8;
const SYMBOL_TEXTURE_COUNT = 2;
const DEFAULT_FLAME_KEYS = ['flame_05', 'flame_06'] as const;
const DEFAULT_SMOKE_KEYS = [
  'smoke_01',
  'smoke_02',
  'smoke_03',
  'smoke_05',
] as const;
const DEFAULT_EMBER_KEYS = ['procedural_ember'] as const;

/**
 * Manages VFX and procedural textures for the Phoenix Flame scene.
 * Generates soft-circle procedurals at construction, provides
 * key-based queries/defaults, and resolves key lists → Texture arrays.
 */
export class TextureCatalog {
  private readonly renderer: Renderer;
  private readonly allTextures: Map<string, Texture>;

  private readonly proceduralFlame: Texture;
  private readonly proceduralSmoke: Texture;
  private readonly proceduralEmber: Texture;

  constructor(renderer: Renderer, vfx: Record<string, Texture>) {
    this.renderer = renderer;

    this.proceduralFlame = this.generateSoftCircle(
      PROCEDURAL.flameSize,
      PROCEDURAL.flameColor,
    );

    this.proceduralSmoke = this.generateSoftCircle(
      PROCEDURAL.smokeSize,
      PROCEDURAL.smokeColor,
    );

    this.proceduralEmber = this.generateSoftCircle(
      PROCEDURAL.emberSize,
      PROCEDURAL.emberColor,
    );

    this.allTextures = new Map<string, Texture>(Object.entries(vfx));
    this.allTextures.set('procedural_flame', this.proceduralFlame);
    this.allTextures.set('procedural_smoke', this.proceduralSmoke);
    this.allTextures.set('procedural_ember', this.proceduralEmber);
  }

  defaultFlameKeys(): string[] {
    const available = DEFAULT_FLAME_KEYS.filter((k) => this.allTextures.has(k));
    if (available.length > 0) {
      return available;
    }

    return this.buildAliasKeys(
      'procedural_flame',
      'flame',
      FLAME_TEXTURE_COUNT,
    ).slice(0, 1);
  }

  defaultSmokeKeys(): string[] {
    const available = DEFAULT_SMOKE_KEYS.filter((k) => this.allTextures.has(k));

    return available.length > 0
      ? available
      : this.buildAliasKeys(
          'procedural_smoke',
          'smoke',
          SMOKE_TEXTURE_COUNT,
        ).slice(0, 1);
  }

  defaultEmberKeys(): string[] {
    const available = DEFAULT_EMBER_KEYS.filter((k) => this.allTextures.has(k));
    return available.length > 0 ? available : ['procedural_ember'];
  }

  flameOptions(): TextureOptionEntry[] {
    return this.buildOptions('procedural_flame', 'flame', FLAME_TEXTURE_COUNT);
  }

  smokeOptions(): TextureOptionEntry[] {
    return this.buildOptions('procedural_smoke', 'smoke', SMOKE_TEXTURE_COUNT);
  }

  emberOptions(): TextureOptionEntry[] {
    return this.buildOptions(
      'procedural_ember',
      'symbol',
      SYMBOL_TEXTURE_COUNT,
    );
  }

  resolveTextures(keys: string[]): Texture[] {
    const result: Texture[] = [];

    for (const key of keys) {
      const tex = this.allTextures.get(key);

      if (tex) {
        result.push(tex);
      }
    }

    return result;
  }

  destroy(): void {
    this.proceduralFlame.destroy(true);
    this.proceduralSmoke.destroy(true);
    this.proceduralEmber.destroy(true);
    this.allTextures.clear();
  }

  private generateSoftCircle(size: number, tint: number): Texture {
    const { r, g, b } = extractRGB(tint);

    const gradient = new FillGradient({
      type: 'radial',
      center: { x: 0.5, y: 0.5 },
      innerRadius: 0,
      outerCenter: { x: 0.5, y: 0.5 },
      outerRadius: 0.5,
      textureSpace: 'local',
    });

    for (const stop of SOFT_CIRCLE_STOPS) {
      gradient.addColorStop(
        stop.position,
        `rgba(${r},${g},${b},${stop.alpha})`,
      );
    }

    const half = size / 2;
    const graphics = new Graphics();
    graphics.circle(half, half, half).fill(gradient);

    const tex = this.renderer.generateTexture({
      target: graphics,
      resolution: this.renderer.resolution,
    });

    graphics.destroy();
    gradient.destroy();

    return tex;
  }

  private buildOptions(
    proceduralKey: string,
    prefix: string,
    count: number,
  ): TextureOptionEntry[] {
    const options: TextureOptionEntry[] = [];
    const proc = this.allTextures.get(proceduralKey);

    if (proc) {
      options.push({ key: proceduralKey, thumbnail: proc });
    }

    for (const alias of this.buildAliases(prefix, count)) {
      const tex = this.allTextures.get(alias);

      if (tex) {
        options.push({ key: alias, thumbnail: tex });
      }
    }

    return options;
  }

  private buildAliasKeys(
    proceduralKey: string,
    prefix: string,
    count: number,
  ): string[] {
    const keys = [proceduralKey];

    for (const alias of this.buildAliases(prefix, count)) {
      if (this.allTextures.has(alias)) {
        keys.push(alias);
      }
    }

    return keys;
  }

  private buildAliases(prefix: string, count: number): string[] {
    const result: string[] = [];

    for (let i = 1; i <= count; i++) {
      result.push(`${prefix}_${String(i).padStart(2, '0')}`);
    }

    return result;
  }
}
