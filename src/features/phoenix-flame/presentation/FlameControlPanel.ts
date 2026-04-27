import type { SharedUITextures } from '@/infrastructure/SharedUIBundle';
import { PixiNineSlicePanel } from '@/ui/components/PixiNineSlicePanel';
import { PixiSlider } from '@/ui/components/PixiSlider';
import type { PixiTextButtonSkin } from '@/ui/components/PixiTextButton';
import { PixiTextButton } from '@/ui/components/PixiTextButton';
import { PixiTexturePicker } from '@/ui/components/PixiTexturePicker';
import type { PixiSliderSkin } from '@/ui/contracts/SliderViewModel';
import type { TextureOptionEntry } from '@/ui/contracts/TexturePickerViewModel';
import { Container, DestroyOptions, Graphics, Text } from 'pixi.js';
import {
  buildFlameControlPages,
  type ControlPage,
} from '../application/FlameControlPages';
import type { FlameConfig } from '../config/FlameConfig';
import {
  BODY_GAP,
  BODY_PADDING,
  HEADER_HEIGHT,
  NAV_BUTTON,
  PAGE_LABEL_POS,
  PAGE_NOTE_POS,
  PANEL_ALPHA,
  PANEL_FLOOR_HEIGHT,
  PANEL_INSETS,
  PANEL_LABELS,
  PANEL_MARGIN,
  PANEL_MIN_HEIGHT,
  PANEL_TINT,
  PANEL_WIDTH,
  PICKER_LAYOUT,
  PICKER_X,
  RESET_BUTTON,
  SECTION_GAP,
  SEPARATOR,
  SLIDER_BLOCK_HEIGHT,
  SLIDER_LAYOUT,
  TEXTURE_DOCK_BOTTOM_PADDING,
  TEXTURE_DOCK_TOP_PADDING,
  TEXTURE_PICKER_GAP,
  TEXTURE_PICKER_TOP,
  TEXTURE_TITLE_POS,
  TITLE_POS,
} from '../config/PanelLayout';
import {
  buildButtonSkin,
  buildPickerSkin,
  buildSliderSkin,
  NOTE_STYLE,
  PAGE_STYLE,
  SECTION_STYLE,
  TITLE_STYLE,
} from './FlameControlSkins';

function centeredButtonLayout(width: number, height: number) {
  return {
    width,
    height,
    labelAnchorX: 0.5,
    labelAnchorY: 0.5,
    labelX: width / 2,
    labelY: height / 2,
  };
}

export interface FlameControlPanelDeps {
  config: FlameConfig;
  shared: SharedUITextures;
  flameTextureOptions: TextureOptionEntry[];
  smokeTextureOptions: TextureOptionEntry[];
  emberTextureOptions: TextureOptionEntry[];
  selectedFlameTextureKeys: string[];
  selectedSmokeTextureKeys: string[];
  selectedEmberTextureKeys: string[];
  onFlameTexturesChange: (keys: string[]) => void;
  onSmokeTexturesChange: (keys: string[]) => void;
  onEmberTexturesChange: (keys: string[]) => void;
  onResetDefaults: () => void;
}

export class FlameControlPanel extends Container {
  private readonly deps: FlameControlPanelDeps;
  private readonly panel: PixiNineSlicePanel;

  private readonly bodyContent: Container;
  private readonly textureDock: Container;

  private readonly separator: Graphics;
  private readonly pageLabel: Text;
  private readonly pageNote: Text;

  private readonly pages: ControlPage[];
  private readonly sliderSkin: PixiSliderSkin;
  private readonly pickerEntries: {
    picker: PixiTexturePicker;
    optionCount: number;
  }[];

  private panelHeight = 0;
  private currentPage = 0;

  constructor(deps: FlameControlPanelDeps) {
    super();

    this.deps = deps;
    this.sliderSkin = buildSliderSkin(deps.shared);
    const pickerSkin = buildPickerSkin(deps.shared);
    const buttonSkin = buildButtonSkin(deps.shared);

    this.panel = new PixiNineSlicePanel({
      texture: deps.shared.metalPanel,
      insets: PANEL_INSETS,
      tint: PANEL_TINT,
    });

    this.panel.alpha = PANEL_ALPHA;
    this.addChild(this.panel);

    const title = new Text({ text: PANEL_LABELS.title, style: TITLE_STYLE });
    title.position.set(TITLE_POS.x, TITLE_POS.y);
    this.addChild(title);

    this.buildToolbar(buttonSkin);
    this.buildPageNavigation(buttonSkin);

    this.pageLabel = new Text({ text: '', style: PAGE_STYLE });
    this.pageLabel.position.set(PAGE_LABEL_POS.x, PAGE_LABEL_POS.y);
    this.addChild(this.pageLabel);

    this.pageNote = new Text({ text: '', style: NOTE_STYLE });
    this.pageNote.position.set(PAGE_NOTE_POS.x, PAGE_NOTE_POS.y);
    this.addChild(this.pageNote);

    this.bodyContent = new Container();
    this.addChild(this.bodyContent);

    this.separator = new Graphics();
    this.addChild(this.separator);

    this.textureDock = new Container();
    this.addChild(this.textureDock);

    const textureTitle = new Text({
      text: PANEL_LABELS.textureMix,
      style: SECTION_STYLE,
    });

    textureTitle.position.set(TEXTURE_TITLE_POS.x, TEXTURE_TITLE_POS.y);
    this.textureDock.addChild(textureTitle);

    this.pickerEntries = [
      {
        label: 'Body Flame',
        options: deps.flameTextureOptions,
        initialKeys: deps.selectedFlameTextureKeys,
        onChange: deps.onFlameTexturesChange,
      },
      {
        label: 'Smoke',
        options: deps.smokeTextureOptions,
        initialKeys: deps.selectedSmokeTextureKeys,
        onChange: deps.onSmokeTexturesChange,
      },
      {
        label: 'Embers',
        options: deps.emberTextureOptions,
        initialKeys: deps.selectedEmberTextureKeys,
        onChange: deps.onEmberTexturesChange,
      },
    ].map((def) => {
      const picker = new PixiTexturePicker(def, pickerSkin);
      this.textureDock.addChild(picker);

      return { picker, optionCount: def.options.length };
    });

    this.pages = buildFlameControlPages(deps.config);
    this.renderCurrentPage();
  }

  layout(viewWidth: number, viewHeight: number): void {
    const dockContentHeight = this.measureTextureDockContentHeight();
    const dockSectionHeight = TEXTURE_DOCK_TOP_PADDING + dockContentHeight;

    const minHeight =
      HEADER_HEIGHT +
      this.measureBodyHeight() +
      SECTION_GAP +
      dockSectionHeight +
      PANEL_MARGIN;

    this.panelHeight = Math.min(
      Math.max(minHeight, PANEL_MIN_HEIGHT),
      Math.max(PANEL_FLOOR_HEIGHT, viewHeight - PANEL_MARGIN * 2),
    );

    this.panel.width = PANEL_WIDTH;
    this.panel.height = this.panelHeight;

    const dockY = this.panelHeight - dockSectionHeight;
    this.bodyContent.position.set(0, HEADER_HEIGHT);

    this.layoutTextureDock(dockY);
    this.drawSeparator(dockY);

    const panelY = Math.max(
      PANEL_MARGIN,
      Math.round((viewHeight - this.panelHeight) * 0.5),
    );

    this.position.set(viewWidth - PANEL_WIDTH - PANEL_MARGIN, panelY);
  }

  getPanelHeight(): number {
    return this.panelHeight;
  }

  resetAllPickers(
    flameKeys: readonly string[],
    smokeKeys: readonly string[],
    emberKeys: readonly string[],
  ): void {
    const defaults = [flameKeys, smokeKeys, emberKeys];

    for (let i = 0; i < this.pickerEntries.length; i++) {
      this.pickerEntries[i].picker.resetTo(defaults[i]);
    }
  }

  destroy(options?: DestroyOptions): void {
    this.clearBodyContent();
    super.destroy(options ?? { children: true });
  }

  private layoutTextureDock(dockY: number): void {
    this.textureDock.position.set(0, dockY + TEXTURE_DOCK_TOP_PADDING);
    let y = TEXTURE_PICKER_TOP;

    for (const { picker, optionCount } of this.pickerEntries) {
      picker.position.set(PICKER_X, y);
      picker.applyLayout(PICKER_LAYOUT);

      y += this.measureTexturePickerHeight(optionCount) + TEXTURE_PICKER_GAP;
    }
  }

  private drawSeparator(y: number): void {
    this.separator
      .clear()
      .rect(
        SEPARATOR.insetX,
        y,
        PANEL_WIDTH - SEPARATOR.insetX * 2,
        SEPARATOR.height,
      )
      .fill({ color: SEPARATOR.color, alpha: SEPARATOR.alpha });
  }

  private buildToolbar(buttonSkin: PixiTextButtonSkin): void {
    const reset = new PixiTextButton(
      {
        label: PANEL_LABELS.defaults,
        onActivate: () => {
          this.deps.onResetDefaults();
          this.renderCurrentPage();
        },
      },
      buttonSkin,
    );

    reset.position.set(RESET_BUTTON.x, RESET_BUTTON.y);
    reset.applyLayout(
      centeredButtonLayout(RESET_BUTTON.width, RESET_BUTTON.height),
    );

    this.addChild(reset);
  }

  private buildPageNavigation(buttonSkin: PixiTextButtonSkin): void {
    const navLayout = centeredButtonLayout(NAV_BUTTON.width, NAV_BUTTON.height);
    const navArray = [
      [PANEL_LABELS.prevPage, NAV_BUTTON.prevX, -1],
      [PANEL_LABELS.nextPage, NAV_BUTTON.nextX, 1],
    ] as const;

    for (const [label, x, delta] of navArray) {
      const btn = new PixiTextButton(
        { label, onActivate: () => this.setPage(this.currentPage + delta) },
        buttonSkin,
      );

      btn.position.set(x, NAV_BUTTON.y);
      btn.applyLayout(navLayout);

      this.addChild(btn);
    }
  }

  private renderCurrentPage(): void {
    const page = this.pages[this.currentPage];
    this.pageLabel.text = `${this.currentPage + 1}/${this.pages.length}  ${page.label}`;
    this.pageNote.text = page.note;

    this.clearBodyContent();

    let y = BODY_PADDING;
    for (const control of page.controls) {
      const slider = new PixiSlider(
        {
          label: control.label,
          min: control.min,
          max: control.max,
          step: control.step,
          initial: control.readValue(),
          onChange: control.onChange,
          formatValue: control.formatValue,
        },
        this.sliderSkin,
      );

      slider.position.set(BODY_PADDING, y);
      slider.applyLayout(SLIDER_LAYOUT);
      this.bodyContent.addChild(slider);

      y += SLIDER_BLOCK_HEIGHT + BODY_GAP;
    }
  }

  private measureBodyHeight(): number {
    const controls = this.pages[this.currentPage]?.controls.length ?? 0;
    if (controls === 0) {
      return BODY_PADDING;
    }

    return (
      BODY_PADDING +
      controls * SLIDER_BLOCK_HEIGHT +
      Math.max(0, controls - 1) * BODY_GAP
    );
  }

  private measureTexturePickerHeight(optionCount: number): number {
    const rows = Math.max(1, Math.ceil(optionCount / PICKER_LAYOUT.maxColumns));

    return (
      PICKER_LAYOUT.gridY +
      rows * PICKER_LAYOUT.cellSize +
      Math.max(0, rows - 1) * PICKER_LAYOUT.cellGap
    );
  }

  private measureTextureDockContentHeight(): number {
    let height = TEXTURE_PICKER_TOP - TEXTURE_PICKER_GAP;

    for (const { optionCount } of this.pickerEntries) {
      height +=
        this.measureTexturePickerHeight(optionCount) + TEXTURE_PICKER_GAP;
    }

    return height + TEXTURE_DOCK_BOTTOM_PADDING;
  }

  private setPage(index: number): void {
    const wrapped = (index + this.pages.length) % this.pages.length;
    this.currentPage = wrapped;

    this.renderCurrentPage();
  }

  private clearBodyContent(): void {
    for (let i = this.bodyContent.children.length - 1; i >= 0; i--) {
      const child = this.bodyContent.removeChildAt(i);
      child.destroy({ children: true });
    }
  }
}
