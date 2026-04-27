import type { FireAnchorPlacement, PreviewRect } from '../config/SceneLayout';
import {
  FIRE_ANCHOR_REF,
  FIRE_ANCHOR_SCALE,
  FIRE_SPAWN_LINE_OFFSET_Y,
  FIRE_VERTICAL_FACTOR,
  MIN_PREVIEW_WIDTH,
  PREVIEW_FRAME_PADDING,
  PREVIEW_TO_PANEL_GAP,
  SCENE_MARGIN,
} from '../config/SceneLayout';

export function computePreviewRect(
  panelX: number,
  panelY: number,
  panelHeight: number,
): PreviewRect {
  const leftColumnWidth = Math.max(
    MIN_PREVIEW_WIDTH,
    panelX - SCENE_MARGIN * 2,
  );
  const width = Math.max(
    MIN_PREVIEW_WIDTH,
    leftColumnWidth - PREVIEW_TO_PANEL_GAP,
  );
  const x =
    SCENE_MARGIN + Math.max(0, Math.round((leftColumnWidth - width) * 0.5));

  return { x, y: panelY, width, height: panelHeight };
}

export function computeFireAnchorPlacement(
  r: PreviewRect,
): FireAnchorPlacement {
  const innerW = r.width - PREVIEW_FRAME_PADDING * 2;
  const innerH = r.height - PREVIEW_FRAME_PADDING * 2;
  const innerX = r.x + PREVIEW_FRAME_PADDING;
  const innerY = r.y + PREVIEW_FRAME_PADDING;

  const x = innerX + innerW * 0.5;
  const y = innerY + innerH * FIRE_VERTICAL_FACTOR + FIRE_SPAWN_LINE_OFFSET_Y;

  const fit = Math.min(
    innerW / FIRE_ANCHOR_REF.width,
    innerH / FIRE_ANCHOR_REF.height,
  );
  const scale = Math.min(
    FIRE_ANCHOR_SCALE.max,
    Math.max(FIRE_ANCHOR_SCALE.min, fit),
  );

  return { x, y, scale };
}
