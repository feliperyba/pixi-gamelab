import type { FlameConfig } from '../config/FlameConfig';
import { MAX_VISIBLE_PARTICLES } from '../config/SceneLayout';

const THRESHOLD = { smoke: 0.1, ember: 0.1 } as const;

const PRIORITY_WEIGHT = {
  flame: 3,
  ember: 2,
  smoke: 1,
} as const;

/**
 * Per-emitter particle cap returned by the budget allocator.
 * The three values always sum to exactly `maxParticles` (capped at MAX_VISIBLE_PARTICLES).
 * Zero means the emitter should not spawn anything.
 */
export interface ParticleBudget {
  flame: number;
  smoke: number;
  ember: number;
}

/**
 * Signals whether each emitter type has at least one texture available.
 * An emitter with no textures cannot participate in the budget split,
 * so its slots are redistributed to the remaining active emitters.
 */
export interface EmitterAvailability {
  flameTextures: boolean;
  emberTextures: boolean;
  smokeTextures: boolean;
}

/**
 * Distributes the total sprite budget across active emitters.
 *
 * Rules:
 *  1. Total slots = min(maxParticles, MAX_VISIBLE_PARTICLES). We always try to fill every slot.
 *  2. An emitter is "active" only when it has textures AND its intensity/amount slider is
 *     above its threshold. Inactive emitters get zero slots.
 *  3. Active emitters share the full budget proportionally to their priority weight:
 *       flame = PRIORITY_WEIGHT.flame (highest),
 *       ember = PRIORITY_WEIGHT.ember * emberAmount,
 *       smoke = PRIORITY_WEIGHT.smoke * smokeAmount.
 *     This means flame always gets the largest share, ember second, smoke last.
 *  4. When only one emitter is active it receives the entire budget (e.g. flame-only = 10).
 *  5. Inactive emitters free their slots, which are absorbed proportionally by the
 *     remaining active ones — the budget always sums to `total`.
 *
 * Allocation algorithm:
 *  a) Compute each active emitter's raw share = total * weight / sumWeights, floor it.
 *  b) Each active emitter is guaranteed at least 1 slot.
 *  c) If the floored total exceeds the budget, trim from lowest-priority first (smoke -> ember).
 *  d) Any leftover slots (from rounding down) are distributed starting from highest priority.
 */
export function allocateBudget(
  config: FlameConfig,
  avail: EmitterAvailability,
): ParticleBudget {
  const total = Math.min(config.maxParticles, MAX_VISIBLE_PARTICLES);
  if (total === 0) {
    return { flame: 0, smoke: 0, ember: 0 };
  }

  const active: { key: 'flame' | 'ember' | 'smoke'; weight: number }[] = [];

  const flameActive = avail.flameTextures && config.intensity > 0;
  const emberActive =
    avail.emberTextures && config.emberAmount > THRESHOLD.ember;
  const smokeActive =
    avail.smokeTextures && config.smokeAmount > THRESHOLD.smoke;

  if (flameActive) {
    active.push({ key: 'flame', weight: PRIORITY_WEIGHT.flame });
  }

  if (emberActive) {
    active.push({
      key: 'ember',
      weight: PRIORITY_WEIGHT.ember * config.emberAmount,
    });
  }

  if (smokeActive) {
    active.push({
      key: 'smoke',
      weight: PRIORITY_WEIGHT.smoke * config.smokeAmount,
    });
  }

  if (active.length === 0) {
    return { flame: 0, smoke: 0, ember: 0 };
  }

  if (active.length > total) {
    const fallback: ParticleBudget = { flame: 0, smoke: 0, ember: 0 };
    for (let i = 0; i < total; i++) {
      fallback[active[i].key] = 1;
    }

    return fallback;
  }

  const sumW = active.reduce((s, e) => s + e.weight, 0);
  const floored = active.map((e) =>
    Math.max(1, Math.floor((total * e.weight) / sumW)),
  );

  let safetyCounter = 0;
  let sumFloored = floored.reduce((s, v) => s + v, 0);

  // Trim overshoot from lowest priority (last in array) first
  while (sumFloored > total) {
    for (let i = active.length - 1; i >= 0; i--) {
      if (floored[i] > 1 && sumFloored > total) {
        floored[i]--;
        sumFloored--;
      }
    }

    if (++safetyCounter > total) {
      break;
    }
  }

  // Distribute leftover slots from highest priority (first in array) first
  let remainder = total - sumFloored;
  for (let i = 0; i < active.length && remainder > 0; i++) {
    floored[i]++;
    remainder--;
  }

  const result: ParticleBudget = { flame: 0, smoke: 0, ember: 0 };
  for (let i = 0; i < active.length; i++) {
    result[active[i].key] = floored[i];
  }

  return result;
}
