import type { PixiNineSliceInsets } from '@/ui/contracts/PixiNineSliceInsets';
import { Container, NineSliceSprite, type Texture } from 'pixi.js';

interface PixiNineSlicePanelOptions {
  texture: Texture;
  insets: PixiNineSliceInsets;
  tint?: number;
}

/**
 * Container-based wrapper around NineSliceSprite.
 *
 * Extends Container (not NineSliceSprite) so children can be added to it
 * without triggering the PixiJS v8 deprecation:
 * "addChild: Only Containers will be allowed to add children in v8.0.0".
 */
export class PixiNineSlicePanel extends Container {
  private readonly _slice: NineSliceSprite;

  constructor(options: PixiNineSlicePanelOptions) {
    super();

    this._slice = new NineSliceSprite({
      texture: options.texture,
      leftWidth: options.insets.left,
      topHeight: options.insets.top,
      rightWidth: options.insets.right,
      bottomHeight: options.insets.bottom,
    });

    if (options.tint !== undefined) {
      this._slice.tint = options.tint;
    }

    this.addChild(this._slice);
  }

  override get width(): number {
    return this._slice.width;
  }

  override set width(value: number) {
    this._slice.width = value;
  }

  override get height(): number {
    return this._slice.height;
  }

  override set height(value: number) {
    this._slice.height = value;
  }

  get tint(): number {
    return this._slice.tint;
  }

  set tint(value: number) {
    this._slice.tint = value;
  }
}
