export const STACK_LAYOUT = {
  maxPileSpread: 32,
  minPileOffset: 2,
} as const;

export const TRANSFER_ANIMATION = {
  arcHeight: 256,
  minScaleX: 0.1,
  flipSwapProgress: 0.5,
} as const;

export const IN_FLIGHT_SHADOW = {
  offsetX: 4,
  offsetY: -8,
  baseAlpha: 0.62,
  alphaLiftFactor: 0.38,
  baseScaleX: 0.95,
  scaleXLiftFactor: 0.14,
  baseScaleY: 0.78,
  scaleYLiftFactor: 0.16,
} as const;

export const TRANSFER_SHADOW_POOL_SIZE = 4;

export const TRANSFER_SHADOW = {
  height: 48,
  centerYOffset: 8,
  layers: [
    {
      widthScale: 1.12,
      heightScale: 1.3,
      radius: 19,
      alpha: 0.035,
      yOffset: 2,
    },
    {
      widthScale: 1.04,
      heightScale: 1.08,
      radius: 17,
      alpha: 0.055,
      yOffset: 1,
    },
    {
      widthScale: 0.96,
      heightScale: 0.86,
      radius: 15,
      alpha: 0.08,
      yOffset: 1,
    },
    {
      widthScale: 0.86,
      heightScale: 0.62,
      radius: 12,
      alpha: 0.13,
      yOffset: 1,
    },
    {
      widthScale: 0.7,
      heightScale: 0.34,
      radius: 8,
      alpha: 0.16,
      yOffset: 2,
    },
  ],
} as const;

export const CARD_STAGE = {
  scaleX: 1.24,
  scaleY: 1.24,
} as const;

export const MOVE_INTERVAL_MS = 1000;
export const TRANSFER_DURATION_MS = 2000;
