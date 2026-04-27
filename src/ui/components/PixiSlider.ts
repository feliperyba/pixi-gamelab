import type {
  PixiSliderLayout,
  PixiSliderSkin,
  SliderViewModel,
} from '@/ui/contracts/SliderViewModel';
import { Container, type FederatedPointerEvent, Graphics, Text } from 'pixi.js';
import { BRAND } from '../theme/BrandTokens';
import { PixiNineSlicePanel } from './PixiNineSlicePanel';

const HIT_ZONE_PAD = 6;
const HIT_ZONE_ALPHA = 0.001;

export class PixiSlider extends Container {
  private readonly model: SliderViewModel;

  private readonly fill: PixiNineSlicePanel;
  private readonly track: PixiNineSlicePanel;
  private readonly handle: PixiNineSlicePanel;

  private readonly hitZone: Graphics;
  private readonly labelText: Text;
  private readonly valueText: Text;

  private readonly reusePoint = { x: 0, y: 0 };

  private value: number;
  private trackWidth = 0;
  private trackY = 0;
  private handleW = 0;
  private handleH = 0;
  private dragging = false;

  constructor(model: SliderViewModel, skin: PixiSliderSkin) {
    super();

    this.model = model;
    this.value = model.initial;

    this.labelText = new Text({ text: model.label, style: skin.labelStyle });
    this.labelText.anchor.set(0, 0);
    this.addChild(this.labelText);

    this.valueText = new Text({
      text: this.formatValue(),
      style: skin.valueStyle,
    });
    this.valueText.anchor.set(1, 0);
    this.addChild(this.valueText);

    this.track = new PixiNineSlicePanel({
      texture: skin.trackTexture,
      insets: skin.trackInsets,
      tint: skin.trackTint,
    });
    this.track.eventMode = 'none';
    this.addChild(this.track);

    this.fill = new PixiNineSlicePanel({
      texture: skin.fillTexture,
      insets: skin.fillInsets,
      tint: skin.fillTint,
    });
    this.fill.eventMode = 'none';
    this.addChild(this.fill);

    this.handle = new PixiNineSlicePanel({
      texture: skin.handleTexture,
      insets: skin.handleInsets,
      tint: skin.handleTint,
    });
    this.handle.eventMode = 'none';
    this.addChild(this.handle);

    // Transparent hit zone that covers the full slider area for reliable drag
    this.hitZone = new Graphics();
    this.hitZone.eventMode = 'static';
    this.hitZone.cursor = 'pointer';
    this.addChild(this.hitZone);

    this.hitZone.on('pointerdown', this.onPointerDown);
  }

  applyLayout(layout: PixiSliderLayout): void {
    this.trackWidth = layout.width;
    this.trackY = layout.trackY;

    this.handleW = layout.handleWidth;
    this.handleH = layout.handleHeight;

    this.labelText.position.set(0, layout.labelY);
    this.valueText.position.set(layout.width, layout.labelY);

    this.track.width = layout.width;
    this.track.height = layout.trackHeight;
    this.track.position.set(0, layout.trackY);

    this.fill.width = layout.width;
    this.fill.height = layout.trackHeight;
    this.fill.position.set(0, layout.trackY);

    this.handle.width = layout.handleWidth;
    this.handle.height = layout.handleHeight;

    this.hitZone.clear();
    this.hitZone.rect(
      -HIT_ZONE_PAD,
      layout.trackY - HIT_ZONE_PAD,
      layout.width + HIT_ZONE_PAD * 2,
      layout.trackHeight + HIT_ZONE_PAD * 2,
    );
    this.hitZone.fill({ color: BRAND.palette.white, alpha: HIT_ZONE_ALPHA });

    this.syncVisuals();
  }

  getValue(): number {
    return this.value;
  }

  setValue(v: number): void {
    this.value = this.clampAndSnap(v);
    this.syncVisuals();
  }

  destroy(): void {
    this.releaseGlobalListeners();
    this.hitZone.off('pointerdown', this.onPointerDown);

    super.destroy({ children: true });
  }

  private syncVisuals(): void {
    const ratio = this.ratio();
    const fillWidth = Math.max(1, ratio * this.trackWidth);

    this.fill.width = fillWidth;

    const handleX = ratio * (this.trackWidth - this.handleW);
    this.handle.position.set(
      handleX,
      this.trackY + (this.track.height - this.handleH) / 2,
    );

    this.valueText.text = this.formatValue();
  }

  private ratio(): number {
    const range = this.model.max - this.model.min;
    if (range === 0) {
      return 0;
    }

    return (this.value - this.model.min) / range;
  }

  private clampAndSnap(v: number): number {
    const clamped = Math.max(this.model.min, Math.min(this.model.max, v));
    return Math.round(clamped / this.model.step) * this.model.step;
  }

  private formatValue(): string {
    if (this.model.formatValue) {
      return this.model.formatValue(this.value);
    }

    return this.value.toFixed(this.model.step < 1 ? 2 : 0);
  }

  private setFromPointerX(globalX: number): void {
    this.reusePoint.x = globalX;

    const local = this.track.toLocal(this.reusePoint);
    const ratio = Math.max(0, Math.min(1, local.x / this.trackWidth));
    const newVal = this.model.min + ratio * (this.model.max - this.model.min);

    this.value = this.clampAndSnap(newVal);
    this.syncVisuals();

    this.model.onChange(this.value);
  }

  private acquireGlobalListeners(): void {
    const root = this.findRoot();

    root.eventMode = 'static';
    root.on('pointermove', this.onPointerMove);
    root.on('pointerup', this.onPointerUp);
    root.on('pointerupoutside', this.onPointerUp);
  }

  private releaseGlobalListeners(): void {
    const root = this.findRoot();

    root.off('pointermove', this.onPointerMove);
    root.off('pointerup', this.onPointerUp);
    root.off('pointerupoutside', this.onPointerUp);
  }

  private findRoot(): Container {
    let node: Container | null = this.parent;
    if (!node) {
      return this;
    }

    while (node.parent) {
      node = node.parent;
    }

    return node;
  }

  private readonly onPointerDown = (e: FederatedPointerEvent) => {
    this.dragging = true;

    this.setFromPointerX(e.global.x);
    this.acquireGlobalListeners();
  };

  private readonly onPointerMove = (e: FederatedPointerEvent) => {
    if (!this.dragging) {
      return;
    }

    this.setFromPointerX(e.global.x);
  };

  private readonly onPointerUp = () => {
    this.dragging = false;
    this.releaseGlobalListeners();
  };
}
