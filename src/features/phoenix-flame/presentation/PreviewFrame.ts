import type { Renderer, Texture } from 'pixi.js';
import { Graphics, TilingSprite } from 'pixi.js';
import {
  GRID,
  PREVIEW_FRAME_PADDING,
  PREVIEW_INNER,
  PREVIEW_OUTER,
  type PreviewRect,
} from '../config/SceneLayout';

const TILE_SIZE = GRID.step * GRID.majorInterval;

function drawGridTile(): Graphics {
  const g = new Graphics();

  for (let i = 0; i <= GRID.majorInterval; i++) {
    const major = i === 0 || i === GRID.majorInterval;
    const alpha = major ? GRID.majorAlpha : GRID.minorAlpha;
    const pos = i * GRID.step;

    g.rect(pos, 0, 1, TILE_SIZE).fill({ color: GRID.color, alpha });
    g.rect(0, pos, TILE_SIZE, 1).fill({ color: GRID.color, alpha });
  }

  return g;
}

export class PreviewFrame {
  readonly stage = new Graphics();

  private readonly tiling = new TilingSprite();
  private gridTexture: Texture | null = null;

  init(renderer: Renderer): void {
    const tile = drawGridTile();
    this.gridTexture = renderer.generateTexture({
      target: tile,
      resolution: renderer.resolution,
    });

    tile.destroy();

    this.tiling.texture = this.gridTexture;
    this.tiling.eventMode = 'none';

    this.stage.addChildAt(this.tiling, 0);
  }

  draw(r: PreviewRect): void {
    const innerX = r.x + PREVIEW_FRAME_PADDING;
    const innerY = r.y + PREVIEW_FRAME_PADDING;
    const innerW = r.width - PREVIEW_FRAME_PADDING * 2;
    const innerH = r.height - PREVIEW_FRAME_PADDING * 2;

    this.stage.clear();

    this.stage
      .roundRect(r.x, r.y, r.width, r.height, PREVIEW_OUTER.radius)
      .fill({ color: PREVIEW_OUTER.color, alpha: PREVIEW_OUTER.alpha });

    this.stage
      .roundRect(innerX, innerY, innerW, innerH, PREVIEW_INNER.radius)
      .fill({ color: PREVIEW_INNER.color, alpha: PREVIEW_INNER.alpha });

    this.tiling.position.set(innerX, innerY);
    this.tiling.width = innerW;
    this.tiling.height = innerH;
  }

  destroy(): void {
    this.gridTexture?.destroy(true);
    this.gridTexture = null;

    this.stage.destroy({ children: true });
  }
}
