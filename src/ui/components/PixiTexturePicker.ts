import type {
  PixiTexturePickerLayout,
  PixiTexturePickerSkin,
  TexturePickerViewModel,
} from '@/ui/contracts/TexturePickerViewModel';
import { Container, Sprite, Text } from 'pixi.js';
import { PixiNineSlicePanel } from './PixiNineSlicePanel';

export class PixiTexturePicker extends Container {
  private readonly skin: PixiTexturePickerSkin;
  private readonly model: TexturePickerViewModel;

  private readonly labelText: Text;
  private readonly selectedKeys: Set<string>;

  private readonly cellMap = new Map<string, PixiNineSlicePanel>();

  private gridBuilt = false;

  constructor(model: TexturePickerViewModel, skin: PixiTexturePickerSkin) {
    super();

    this.model = model;
    this.skin = skin;
    this.selectedKeys = new Set(model.initialKeys);

    this.labelText = new Text({ text: model.label, style: skin.labelStyle });
    this.labelText.anchor.set(0, 0);
    this.addChild(this.labelText);
  }

  applyLayout(layout: PixiTexturePickerLayout): void {
    this.labelText.position.set(0, layout.labelY);

    if (!this.gridBuilt) {
      this.buildGrid(layout);
      this.gridBuilt = true;
    }
  }

  resetTo(keys: readonly string[]): void {
    this.selectedKeys.clear();

    for (const k of keys) {
      this.selectedKeys.add(k);
    }

    for (const [key, panel] of this.cellMap) {
      panel.tint = this.selectedKeys.has(key)
        ? this.skin.selectedTint
        : this.skin.normalTint;
    }

    this.model.onChange([...this.selectedKeys]);
  }

  getSelectedKeys(): string[] {
    return [...this.selectedKeys];
  }

  private buildGrid(layout: PixiTexturePickerLayout): void {
    const { cellSize, cellGap, previewPadding, gridY, maxColumns } = layout;

    for (let i = 0; i < this.model.options.length; i++) {
      const opt = this.model.options[i];
      const col = i % maxColumns;
      const row = Math.floor(i / maxColumns);

      const panel = new PixiNineSlicePanel({
        texture: this.skin.cellTexture,
        insets: this.skin.cellInsets,
        tint: this.selectedKeys.has(opt.key)
          ? this.skin.selectedTint
          : this.skin.normalTint,
      });

      panel.width = cellSize;
      panel.height = cellSize;
      panel.position.set(
        col * (cellSize + cellGap),
        gridY + row * (cellSize + cellGap),
      );

      const preview = new Sprite(opt.thumbnail);
      const maxPreview = cellSize - previewPadding * 2;
      const texScale = Math.min(
        maxPreview / (preview.texture.width || 1),
        maxPreview / (preview.texture.height || 1),
        1,
      );

      preview.scale.set(texScale);
      preview.anchor.set(0.5);
      preview.position.set(cellSize / 2, cellSize / 2);
      panel.addChild(preview);

      panel.eventMode = 'static';
      panel.cursor = 'pointer';
      panel.on('pointertap', () => this.toggleOption(opt.key));

      this.addChild(panel);
      this.cellMap.set(opt.key, panel);
    }
  }

  private toggleOption(key: string): void {
    if (this.selectedKeys.has(key)) {
      this.selectedKeys.delete(key);
    } else {
      this.selectedKeys.add(key);
    }

    const cell = this.cellMap.get(key);
    if (cell) {
      cell.tint = this.selectedKeys.has(key)
        ? this.skin.selectedTint
        : this.skin.normalTint;
    }

    this.model.onChange([...this.selectedKeys]);
  }

  destroy(): void {
    this.cellMap.clear();

    super.destroy({ children: true });
  }
}
