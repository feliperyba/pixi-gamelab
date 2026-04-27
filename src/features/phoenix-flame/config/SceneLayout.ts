export const MAX_VISIBLE_PARTICLES = 10;
export const DT_CAP_SEC = 1 / 24;
export const PANEL_FALLBACK_MARGIN = 8;

export const SCENE_MARGIN = 16;
export const PREVIEW_FRAME_PADDING = 18;
export const PREVIEW_TO_PANEL_GAP = 24;
export const FIRE_SPAWN_LINE_OFFSET_Y = 56;
export const MIN_PREVIEW_WIDTH = 420;
export const SCENE_BG_COLOR = 0x121315;

export const PREVIEW_OUTER = {
  color: 0x202227,
  alpha: 0.98,
  radius: 18,
} as const;

export const PREVIEW_INNER = {
  color: 0x30333a,
  alpha: 1,
  radius: 12,
} as const;

export const GRID = {
  step: 48,
  color: 0x9a9a9a,
  majorAlpha: 0.1,
  minorAlpha: 0.05,
  majorInterval: 4,
} as const;

export const FIRE_ANCHOR_SCALE = { min: 1.0, max: 2.0 } as const;
export const FIRE_ANCHOR_REF = { width: 500, height: 560 } as const;
export const FIRE_VERTICAL_FACTOR = 0.5;

export const COUNTER_BADGE = {
  panelTint: 0x222222,
  labelColor: 0xcccccc,
  valueColor: 0xe72264,
  fontSize: 13,
  width: 160,
  height: 32,
  paddingX: 10,
  offsetX: 176,
  offsetY: 10,
} as const;

export interface PreviewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FireAnchorPlacement {
  x: number;
  y: number;
  scale: number;
}
