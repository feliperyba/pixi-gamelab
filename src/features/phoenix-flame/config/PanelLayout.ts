import type { PixiNineSliceInsets } from '@/ui/contracts/PixiNineSliceInsets';
import type { PixiSliderLayout } from '@/ui/contracts/SliderViewModel';
import type { PixiTexturePickerLayout } from '@/ui/contracts/TexturePickerViewModel';

export const PANEL_INSETS: PixiNineSliceInsets = {
  left: 6,
  top: 6,
  right: 6,
  bottom: 6,
};

export const PANEL_WIDTH = 600;
export const PANEL_MARGIN = 8;
export const HEADER_HEIGHT = 100;
export const BODY_PADDING = 20;
export const BODY_GAP = 6;
export const SLIDER_BLOCK_HEIGHT = 38;
export const SECTION_GAP = 10;
export const TEXTURE_DOCK_TOP_PADDING = 14;
export const TEXTURE_PICKER_TOP = 34;
export const TEXTURE_PICKER_GAP = 22;
export const TEXTURE_DOCK_BOTTOM_PADDING = 16;

export const PANEL_TINT = 0x181818;
export const PANEL_ALPHA = 0.95;
export const PANEL_MIN_HEIGHT = 720;
export const PANEL_FLOOR_HEIGHT = 520;

export const TITLE_POS = { x: 18, y: 10 } as const;
export const PAGE_LABEL_POS = { x: 72, y: 40 } as const;
export const PAGE_NOTE_POS = { x: 24, y: 72 } as const;
export const TEXTURE_TITLE_POS = { x: 16, y: 0 } as const;
export const PICKER_X = 24;

export const SEPARATOR = {
  insetX: 16,
  height: 1,
  color: 0xffffff,
  alpha: 0.1,
} as const;

const RESET_BUTTON_WIDTH = 96;
const RESET_BUTTON_HEIGHT = 28;

export const RESET_BUTTON = {
  x: PANEL_WIDTH - PANEL_MARGIN - RESET_BUTTON_WIDTH,
  y: 10,
  width: RESET_BUTTON_WIDTH,
  height: RESET_BUTTON_HEIGHT,
};

const NAV_BUTTON_PREV_X = 24;
const NAV_BUTTON_WIDTH = 38;
const NAV_BUTTON_HEIGHT = 28;

export const NAV_BUTTON = {
  prevX: NAV_BUTTON_PREV_X,
  nextX: PANEL_WIDTH - NAV_BUTTON_PREV_X - NAV_BUTTON_WIDTH,
  y: 40,
  width: NAV_BUTTON_WIDTH,
  height: NAV_BUTTON_HEIGHT,
};

export const SLIDER_LAYOUT: PixiSliderLayout = {
  width: PANEL_WIDTH - BODY_PADDING * 2,
  trackHeight: 12,
  handleWidth: 20,
  handleHeight: 22,
  labelY: 0,
  trackY: 20,
};

export const PICKER_LAYOUT: PixiTexturePickerLayout = {
  cellSize: 64,
  cellGap: 8,
  previewPadding: 6,
  labelY: 0,
  gridY: 24,
  maxColumns: 5,
};

// Skin colors & sizes
export const SKIN = {
  textLight: 0xe8e8e8,
  textMuted: 0xc8c8c8,
  trackTint: 0x3a3a3a,
  cellNormalTint: 0x5a5a5a,
  hoverTint: 0xed427c,
  noteWrapInset: 56,
  noteLineHeight: 20,
  fontSize: {
    title: 22,
    page: 18,
    note: 14,
    section: 16,
    label: 16,
    button: 13,
  },
  button: {
    pressOffsetY: 1,
    depthOffsetY: 2,
  },
};

export const PANEL_LABELS = {
  title: 'Fire Lab',
  textureMix: 'Texture Mix',
  defaults: 'DEFAULTS',
  prevPage: '<',
  nextPage: '>',
} as const;
