import type { PixiTextButtonSkin } from '@/ui/contracts/PixiTextButtonSkin';
import type {
  TextButtonLayout,
  TextButtonViewModel,
} from '@/ui/contracts/TextButtonViewModel';
import { Container, Text } from 'pixi.js';
import { BRAND } from '../theme/BrandTokens';
import { PixiNineSlicePanel } from './PixiNineSlicePanel';

export type { PixiTextButtonSkin } from '@/ui/contracts/PixiTextButtonSkin';

export class PixiTextButton extends Container {
  readonly content = new Container();

  private readonly model: TextButtonViewModel;
  private readonly labelText: Text;
  private readonly face: PixiNineSlicePanel;
  private readonly depth: PixiNineSlicePanel | null;
  private readonly pressOffsetY: number;
  private readonly normalTint: number;
  private readonly hoverTint: number;

  constructor(model: TextButtonViewModel, skin: PixiTextButtonSkin) {
    super();

    this.model = model;
    this.pressOffsetY = skin.pressOffsetY ?? 0;
    this.normalTint = skin.normalTint ?? BRAND.palette.white;
    this.hoverTint = skin.hoverTint ?? this.normalTint;

    this.depth = skin.depthTexture
      ? new PixiNineSlicePanel({
          texture: skin.depthTexture,
          insets: skin.insets,
        })
      : null;

    this.face = new PixiNineSlicePanel({
      texture: skin.faceTexture,
      insets: skin.insets,
      tint: this.normalTint,
    });

    if (this.depth) {
      this.depth.y = skin.depthOffsetY ?? 0;
      this.addChild(this.depth);
    }

    this.addChild(this.face);
    this.addChild(this.content);

    this.labelText = new Text({
      text: model.label,
      style: skin.labelStyle,
    });
    this.content.addChild(this.labelText);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', this.handlePointerOver);
    this.on('pointerout', this.handlePointerOut);
    this.on('pointerupoutside', this.handlePointerOut);
    this.on('pointerdown', this.handlePointerDown);
    this.on('pointerup', this.handlePointerUp);
    this.on('pointertap', this.handlePointerTap);
  }

  applyLayout(layout: TextButtonLayout): void {
    this.face.width = layout.width;
    this.face.height = layout.height;

    if (this.depth) {
      this.depth.width = layout.width;
      this.depth.height = layout.height;
    }

    this.labelText.anchor.set(layout.labelAnchorX, layout.labelAnchorY);
    this.labelText.position.set(layout.labelX, layout.labelY);
  }

  destroy(): void {
    this.off('pointerover', this.handlePointerOver);
    this.off('pointerout', this.handlePointerOut);
    this.off('pointerupoutside', this.handlePointerOut);
    this.off('pointerdown', this.handlePointerDown);
    this.off('pointerup', this.handlePointerUp);
    this.off('pointertap', this.handlePointerTap);

    super.destroy({ children: true });
  }

  private readonly handlePointerOver = () => {
    this.face.tint = this.hoverTint;
  };

  private readonly handlePointerOut = () => {
    this.face.tint = this.normalTint;
    this.face.y = 0;
  };

  private readonly handlePointerDown = () => {
    this.face.y = this.pressOffsetY;
  };

  private readonly handlePointerUp = () => {
    this.face.y = 0;
  };

  private readonly handlePointerTap = () => {
    this.model.onActivate();
  };
}
