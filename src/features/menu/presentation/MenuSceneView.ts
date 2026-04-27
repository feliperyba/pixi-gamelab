import { MENU } from '@/features/menu/config/MenuConfig';
import type { MenuSceneTextures } from '@/features/menu/infrastructure/MenuAssetBundle';
import { SceneId } from '@/runtime/scene/SceneId';
import { PixiTextButton } from '@/ui/components/PixiTextButton';
import type { TextButtonViewModel } from '@/ui/contracts/TextButtonViewModel';
import { BRAND } from '@/ui/theme/BrandTokens';
import { gsap } from 'gsap';
import {
  ColorMatrixFilter,
  Container,
  Graphics,
  Sprite,
  Text,
  TilingSprite,
} from 'pixi.js';
import type { MenuEntry } from '../application/MenuEntries';
import { createMenuButtonSkin, createSubtitleStyle } from './MenuSkinFactory';

export interface MenuViewRefs {
  fadeOverlay: Graphics;
  titleLayer: Container;
  titleSquashLayer: Container;
  logoLayer: Container;
  subtitleLayer: Container;
  sparkLayer: Container;
  cards: readonly Container[];
}

export interface MenuLayoutResult {
  titleX: number;
  titleY: number;
  cardTargets: readonly { x: number; y: number }[];
}

export class MenuSceneView {
  private readonly backgroundLayer = new Container();
  private readonly titleLayer = new Container();
  private readonly titleSquashLayer = new Container();
  private readonly logoLayer = new Container();
  private readonly subtitleLayer = new Container();
  private readonly buttonLayer = new Container();
  private readonly sparkLayer = new Container();

  private readonly bg = new Graphics();
  private readonly fadeOverlay = new Graphics();
  private readonly logoShadow: Sprite;
  private readonly logo: Sprite;
  private readonly subtitlePlate = new Graphics();
  private readonly titleText: Text;
  private readonly logoPattern: TilingSprite;
  private readonly menuButtons: PixiTextButton[];

  private patternFilter!: ColorMatrixFilter;
  private cachedRefs!: MenuViewRefs;

  constructor(
    textures: MenuSceneTextures,
    entries: readonly MenuEntry[],
    onButtonActivate: (sceneId: SceneId) => void,
  ) {
    this.fadeOverlay.eventMode = 'none';
    this.sparkLayer.eventMode = 'none';
    this.sparkLayer.interactiveChildren = false;

    this.logoPattern = this.createLogoPattern(textures);
    this.logoShadow = this.createLogoShadow(textures);
    this.logo = this.createLogo(textures);
    this.titleText = this.createTitleText();
    this.menuButtons = this.createButtons(textures, entries, onButtonActivate);

    this.backgroundLayer.addChild(this.bg);
    this.backgroundLayer.addChild(this.logoPattern);

    this.logoLayer.addChild(this.logoShadow);
    this.logoLayer.addChild(this.logo);

    this.subtitleLayer.addChild(this.subtitlePlate);
    this.subtitleLayer.addChild(this.titleText);

    this.titleSquashLayer.addChild(this.logoLayer);
    this.titleSquashLayer.addChild(this.subtitleLayer);

    this.titleLayer.addChild(this.sparkLayer);
    this.titleLayer.addChild(this.titleSquashLayer);

    this.cachedRefs = {
      fadeOverlay: this.fadeOverlay,
      titleLayer: this.titleLayer,
      titleSquashLayer: this.titleSquashLayer,
      logoLayer: this.logoLayer,
      subtitleLayer: this.subtitleLayer,
      sparkLayer: this.sparkLayer,
      cards: this.menuButtons,
    };
  }

  get refs(): MenuViewRefs {
    return this.cachedRefs;
  }

  attachTo(parent: Container): void {
    parent.addChild(this.backgroundLayer);
    parent.addChild(this.titleLayer);
    parent.addChild(this.buttonLayer);
    parent.addChild(this.fadeOverlay);
  }

  layout(w: number, h: number): MenuLayoutResult {
    this.drawBackground(w, h);
    this.drawFadeOverlay(w, h);

    const cx = w / 2;
    const titleY = h * MENU.animation.title.yPercent;
    const logoScale =
      (w * MENU.layout.logo.widthRatio) / this.logo.texture.width;

    this.logoShadow.scale.set(logoScale);
    this.logoShadow.position.set(
      MENU.layout.logo.shadowOffset,
      MENU.layout.logo.shadowOffset,
    );

    this.logo.scale.set(logoScale);
    this.logoLayer.position.set(0, 0);

    this.drawSubtitlePlate();

    this.subtitleLayer.position.set(0, MENU.layout.subtitleOffsetY);
    this.sparkLayer.position.set(0, MENU.layout.sparkLayerOffsetY);
    this.titleLayer.position.set(cx, titleY);

    const cardTargets = this.layoutButtons(w, h, cx);

    return { titleX: cx, titleY, cardTargets };
  }

  updateDrift(dt: number): void {
    const drift = dt * MENU.layout.tileDriftSpeed;
    this.logoPattern.tilePosition.x += drift;
    this.logoPattern.tilePosition.y -= drift * MENU.layout.tileDriftYFactor;
  }

  destroy(): void {
    for (const button of this.menuButtons) {
      gsap.killTweensOf(button);
      gsap.killTweensOf(button.scale);
    }

    this.logoPattern.filters = null;
    this.patternFilter.destroy();

    const layers = [
      this.backgroundLayer,
      this.titleLayer,
      this.buttonLayer,
      this.fadeOverlay,
    ];

    for (const layer of layers) {
      layer.destroy({ children: true });
    }
  }

  private createLogoPattern(textures: MenuSceneTextures): TilingSprite {
    const pattern = TilingSprite.from(textures.logo, {
      width: 1,
      height: 1,
      tileScale: {
        x: MENU.layout.logoPattern.tileScale,
        y: MENU.layout.logoPattern.tileScale,
      },
    });

    pattern.alpha = MENU.layout.logoPattern.alpha;
    pattern.tileRotation = MENU.layout.logoPattern.tileRotation;

    this.patternFilter = new ColorMatrixFilter();
    this.patternFilter.greyscale(MENU.layout.logoPattern.greyscale, false);
    this.patternFilter.brightness(MENU.layout.logoPattern.brightness, true);
    pattern.filters = [this.patternFilter];

    return pattern;
  }

  private createLogoShadow(textures: MenuSceneTextures): Sprite {
    const shadow = new Sprite(textures.logo);
    shadow.anchor.set(0.5);
    shadow.tint = BRAND.palette.black;
    shadow.alpha = MENU.layout.logo.shadowAlpha;

    return shadow;
  }

  private createLogo(textures: MenuSceneTextures): Sprite {
    const logo = new Sprite(textures.logo);
    logo.anchor.set(0.5);

    return logo;
  }

  private createTitleText(): Text {
    const text = new Text({
      text: 'GAME LAB',
      style: createSubtitleStyle(),
    });
    text.anchor.set(0.5);

    return text;
  }

  private createButtons(
    textures: MenuSceneTextures,
    entries: readonly MenuEntry[],
    onActivate: (sceneId: SceneId) => void,
  ): PixiTextButton[] {
    const skin = createMenuButtonSkin(textures);

    return entries.map((entry) => {
      const model: TextButtonViewModel = {
        label: entry.label.toUpperCase(),
        onActivate: () => onActivate(entry.sceneId),
      };

      const button = new PixiTextButton(model, skin);
      button.eventMode = 'none';
      this.buttonLayer.addChild(button);

      return button;
    });
  }

  private drawBackground(w: number, h: number): void {
    this.bg.clear().rect(0, 0, w, h).fill(MENU.layout.bg.color);
    this.logoPattern.width = w;
    this.logoPattern.height = h;
  }

  private drawFadeOverlay(w: number, h: number): void {
    this.fadeOverlay.clear().rect(0, 0, w, h).fill(BRAND.palette.black);
  }

  private drawSubtitlePlate(): void {
    const plateW = Math.max(
      MENU.layout.subtitlePlate.minWidth,
      this.titleText.width + MENU.layout.subtitlePlate.paddingH,
    );
    const plateH = MENU.layout.subtitlePlate.height;

    this.subtitlePlate
      .clear()
      .roundRect(
        -plateW / 2,
        -plateH / 2,
        plateW,
        plateH,
        MENU.layout.subtitlePlate.radius,
      )
      .fill({
        color: BRAND.palette.white,
        alpha: MENU.layout.subtitlePlate.bgAlpha,
      });
  }

  private layoutButtons(
    w: number,
    h: number,
    cx: number,
  ): { x: number; y: number }[] {
    const buttonW = Math.min(
      MENU.layout.button.maxWidth,
      Math.max(MENU.layout.button.minWidth, w * MENU.layout.button.widthRatio),
    );

    const buttonH = MENU.layout.button.height;
    const buttonGap = MENU.layout.button.gap;
    const startY = h * MENU.layout.button.startYRatio;
    const targets: { x: number; y: number }[] = [];

    for (let i = 0; i < this.menuButtons.length; i++) {
      const button = this.menuButtons[i];
      const x = cx;
      const y = startY + i * (buttonH + buttonGap) + buttonH / 2;

      button.pivot.set(buttonW / 2, buttonH / 2);
      button.position.set(x, y);
      button.applyLayout({
        width: buttonW,
        height: buttonH,
        labelAnchorX: 0.5,
        labelAnchorY: 0.5,
        labelX: buttonW / 2,
        labelY: buttonH / 2,
      });

      targets.push({ x, y });
    }

    return targets;
  }
}
