import type {
  CounterBadgeLayout,
  CounterBadgeSkin,
} from '@/ui/contracts/CounterBadgeSkin';
import type { CounterBadgeViewModel } from '@/ui/contracts/CounterBadgeViewModel';
import { Container, Text } from 'pixi.js';
import { PixiNineSlicePanel } from './PixiNineSlicePanel';

export class PixiCounterBadge extends Container {
  private readonly max: number;
  private readonly panel: PixiNineSlicePanel;
  private readonly labelText: Text;
  private readonly valueText: Text;

  private lastRenderedValue = -1;

  constructor(model: CounterBadgeViewModel, skin: CounterBadgeSkin) {
    super();

    this.max = model.max;

    this.panel = new PixiNineSlicePanel({
      texture: skin.panelTexture,
      insets: skin.panelInsets,
      tint: skin.panelTint,
    });
    this.addChild(this.panel);

    this.labelText = new Text({ text: model.label, style: skin.labelStyle });
    this.labelText.anchor.set(0, 0.5);
    this.addChild(this.labelText);

    this.valueText = new Text({
      text: `0 / ${this.max}`,
      style: skin.valueStyle,
    });
    this.valueText.anchor.set(1, 0.5);
    this.addChild(this.valueText);
  }

  applyLayout(layout: CounterBadgeLayout): void {
    this.panel.width = layout.width;
    this.panel.height = layout.height;

    const cy = layout.height / 2;
    this.labelText.position.set(layout.paddingX, cy);
    this.valueText.position.set(layout.width - layout.paddingX, cy);
  }

  updateValue(current: number): void {
    if (current === this.lastRenderedValue) {
      return;
    }

    this.lastRenderedValue = current;
    this.valueText.text = `${current} / ${this.max}`;
  }
}
