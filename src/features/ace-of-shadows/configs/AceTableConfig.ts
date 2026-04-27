export const TABLE = {
  gold: 0xd99a32,
} as const;

export const TYPOGRAPHY = {
  posX: 72,
  posY: 66,
  detailOffsetX: 2,
  detailOffsetY: 58,
  alpha: 0.88,
  titleStyle: {
    fontSize: 48,
    fontWeight: '700' as const,
    fill: 0xf7efe0,
    letterSpacing: 12,
  },
  detailStyle: {
    fontSize: 22,
    letterSpacing: 4,
  },
} as const;

export const FELT_BASE_STOPS = [
  { pos: 0, color: '#04100d' },
  { pos: 0.28, color: '#0a312a' },
  { pos: 0.55, color: '#155b47' },
  { pos: 0.82, color: '#08261f' },
  { pos: 1, color: '#020706' },
] as const;

export const LAMP = {
  centerRatioX: 0.52,
  centerRatioY: 0.38,
  innerRadius: 40,
  outerRadiusRatio: 0.62,
  stops: [
    { pos: 0, r: 102, g: 190, b: 142, a: 0.34 },
    { pos: 0.32, r: 36, g: 122, b: 90, a: 0.24 },
    { pos: 1, r: 0, g: 0, b: 0, a: 0 },
  ],
} as const;

export const WARMTH = {
  centerRatioX: 0.5,
  centerRatioY: 0.56,
  innerRadius: 20,
  outerRadiusRatio: 0.48,
  stops: [
    { pos: 0, r: 245, g: 132, b: 45, a: 0.12 },
    { pos: 0.48, r: 245, g: 132, b: 45, a: 0.035 },
    { pos: 1, r: 0, g: 0, b: 0, a: 0 },
  ],
} as const;

export const FIBER = {
  count: 3800,
  lengthMin: 8,
  lengthRange: 46,
  angleBase: -0.08,
  angleRange: 0.26,
  alphaBase: 0.018,
  alphaRange: 0.044,
  brightThreshold: 0.44,
  brightColor: 0x9adebc,
  darkColor: 0x001a14,
  darkAlphaFactor: 1.4,
  thickThreshold: 0.86,
  thickWidth: 1.3,
  thinWidth: 0.8,
} as const;

export const FIBER_PRNG = {
  seed: 2463534242,
  widthMultiplier: 31,
  heightMultiplier: 17,
  normalizer: 4294967295,
} as const;

export const LABELS = {
  title: 'ACE OF SHADOWS',
  detail: '144 SPRITES TRANSFERS',
} as const;

export const VIGNETTE = {
  centerRatioX: 0.5,
  centerRatioY: 0.46,
  innerRadiusRatio: 0.18,
  outerRadiusRatio: 0.72,
  stops: [
    { pos: 0, a: 0 },
    { pos: 0.58, a: 0.06 },
    { pos: 0.84, a: 0.34 },
    { pos: 1, a: 0.72 },
  ],
} as const;

export const RIM = {
  bottomOffset: 74,
  height: 2,
  startRatio: 0.18,
  widthRatio: 0.64,
  stops: [
    { pos: 0, r: 245, g: 132, b: 45, a: 0 },
    { pos: 0.5, r: 245, g: 132, b: 45, a: 0.22 },
    { pos: 1, r: 245, g: 132, b: 45, a: 0 },
  ],
} as const;
