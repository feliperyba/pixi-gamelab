import { PixiTextButton } from '@/ui/components/PixiTextButton';
import type { FpsReadable } from '@/ui/contracts/FpsReadable';
import type { HudPixiSkin } from '@/ui/contracts/HudPixiSkin';
import type { TextButtonViewModel } from '@/ui/contracts/TextButtonViewModel';
import { BRAND } from '@/ui/theme/BrandTokens';
import { Container, Text, TextStyle } from 'pixi.js';
import { HUD } from './HudConfig';

const fpsStyle = new TextStyle({
  fontFamily: BRAND.fonts.body,
  fontSize: HUD.fps.fontSize,
  fill: BRAND.palette.white,
  dropShadow: {
    alpha: HUD.fps.shadowAlpha,
    blur: HUD.fps.shadowBlur,
    distance: HUD.fps.shadowDistance,
  },
});

export class HudOverlay extends Container {
  private readonly skin: HudPixiSkin;
  private readonly fpsSource: FpsReadable;

  private fpsLabel: Text;
  private lastRenderedFps = -1;

  private backBtn: PixiTextButton | null = null;

  constructor(fpsSource: FpsReadable, skin: HudPixiSkin) {
    super();

    this.skin = skin;
    this.fpsSource = fpsSource;

    this.fpsLabel = new Text({ text: '0 FPS', style: fpsStyle });
    this.fpsLabel.position.set(HUD.fps.x, HUD.fps.y);

    this.addChild(this.fpsLabel);
  }

  updateFps() {
    const current = this.fpsSource.fps;
    if (current !== this.lastRenderedFps) {
      this.lastRenderedFps = current;
      this.fpsLabel.text = `${current} FPS`;
    }
  }

  showBackButton(callback: () => void) {
    if (this.backBtn) {
      this.removeChild(this.backBtn);
      this.backBtn.destroy();
    }

    const model: TextButtonViewModel = {
      label: 'Back',
      onActivate: callback,
    };

    this.backBtn = new PixiTextButton(model, this.skin.backButton);
    this.backBtn.applyLayout({
      width: HUD.backBtn.width,
      height: HUD.backBtn.height,
      labelAnchorX: 0.5,
      labelAnchorY: 0.5,
      labelX: HUD.backBtn.width / 2,
      labelY: HUD.backBtn.height / 2,
    });
    this.backBtn.position.set(HUD.backBtn.x, HUD.backBtn.y);

    this.addChild(this.backBtn);
  }

  hideBackButton() {
    if (this.backBtn) {
      this.removeChild(this.backBtn);
      this.backBtn.destroy();
      this.backBtn = null;
    }
  }

  destroy() {
    this.hideBackButton();
    super.destroy({ children: true });
  }
}
