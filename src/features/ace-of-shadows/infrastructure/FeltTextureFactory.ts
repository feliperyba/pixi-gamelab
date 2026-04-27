import type { Renderer } from 'pixi.js';
import { Texture } from 'pixi.js';
import {
  FELT_BASE_STOPS,
  FIBER,
  FIBER_PRNG,
  LAMP,
  RIM,
  VIGNETTE,
  WARMTH,
} from '../configs/AceTableConfig';

/**
 * NOTE: This module uses the native Canvas 2D API instead of Pixi.js `Graphics` + `FillGradient` + `renderer.generateTexture()`.
 *
 * The Pixi.js v8 (8.17.1) `generateTexture()` method does not correctly render
 * `FillGradient` fills on off-screen `Graphics` objects that have never been through a render pass.
 * The gradient's internal texture is built lazily and is empty at the time `generateTexture()` captures it, resulting in a solid black output.
 */

export function buildAceTableFeltTexture(
  renderer: Renderer,
  width: number,
  height: number,
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  drawBaseLayer(ctx, width, height);
  drawRadialGradient(ctx, width, height, LAMP);
  drawRadialGradient(ctx, width, height, WARMTH);
  drawFiberLayer(ctx, width, height);
  drawVignetteLayer(ctx, width, height);
  drawRimLayer(ctx, width, height);

  const texture = Texture.from(canvas);
  texture.source.resolution = renderer.resolution;
  texture.source.update();

  canvas.remove();
  return texture;
}

function drawBaseLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  for (const { pos, color } of FELT_BASE_STOPS) {
    gradient.addColorStop(pos, color);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRadialGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cfg: {
    readonly centerRatioX: number;
    readonly centerRatioY: number;
    readonly innerRadius: number;
    readonly outerRadiusRatio: number;
    readonly stops: ReadonlyArray<{
      readonly pos: number;
      readonly r: number;
      readonly g: number;
      readonly b: number;
      readonly a: number;
    }>;
  },
): void {
  const cx = width * cfg.centerRatioX;
  const cy = height * cfg.centerRatioY;
  const outerR = width * cfg.outerRadiusRatio;

  const gradient = ctx.createRadialGradient(
    cx,
    cy,
    cfg.innerRadius,
    cx,
    cy,
    outerR,
  );

  for (const { pos, r, g, b, a } of cfg.stops) {
    gradient.addColorStop(pos, `rgba(${r},${g},${b},${a})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draws a layer of random "fibers" to add texture detail. The random generator is seeded
 * based on the canvas dimensions to ensure consistent output for the same size, while
 * still producing different patterns for different sizes.
 */
function drawFiberLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  let seed =
    FIBER_PRNG.seed ^
    (width * FIBER_PRNG.widthMultiplier + height * FIBER_PRNG.heightMultiplier);

  const random = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / FIBER_PRNG.normalizer;
  };

  ctx.lineCap = 'round';

  for (let i = 0; i < FIBER.count; i++) {
    const x = random() * width;
    const y = random() * height;
    const length = FIBER.lengthMin + random() * FIBER.lengthRange;
    const angle = FIBER.angleBase + random() * FIBER.angleRange;
    const alpha = FIBER.alphaBase + random() * FIBER.alphaRange;
    const isBright = random() > FIBER.brightThreshold;
    const lw =
      random() > FIBER.thickThreshold ? FIBER.thickWidth : FIBER.thinWidth;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    const finalAlpha = isBright ? alpha : alpha * FIBER.darkAlphaFactor;

    ctx.strokeStyle = isBright
      ? `rgba(154,222,188,${finalAlpha})`
      : `rgba(0,26,20,${finalAlpha})`;
    ctx.lineWidth = lw;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function drawVignetteLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const cx = width * VIGNETTE.centerRatioX;
  const cy = height * VIGNETTE.centerRatioY;

  const gradient = ctx.createRadialGradient(
    cx,
    cy,
    width * VIGNETTE.innerRadiusRatio,
    cx,
    cy,
    width * VIGNETTE.outerRadiusRatio,
  );

  for (const { pos, a } of VIGNETTE.stops) {
    gradient.addColorStop(pos, `rgba(0,0,0,${a})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRimLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const rimX = width * RIM.startRatio;
  const rimW = width * RIM.widthRatio;
  const rimY = height - RIM.bottomOffset;

  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  for (const { pos, r, g, b, a } of RIM.stops) {
    gradient.addColorStop(pos, `rgba(${r},${g},${b},${a})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(rimX, rimY, rimW, RIM.height);
}
