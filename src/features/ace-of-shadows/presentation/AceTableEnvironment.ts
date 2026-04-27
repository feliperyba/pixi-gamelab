import { BRAND } from '@/ui/theme/BrandTokens';
import type { Renderer } from 'pixi.js';
import { Container, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import type { StackLayoutEngine } from '../application/StackLayoutEngine';
import { LABELS, TABLE, TYPOGRAPHY } from '../configs/AceTableConfig';
import { buildAceTableFeltTexture } from '../infrastructure/FeltTextureFactory';

export class AceTableEnvironment extends Container {
  private readonly renderer: Renderer;

  private readonly felt = new Sprite();
  private readonly typography = new Container();

  private readonly title = new Text({
    text: LABELS.title,
    style: new TextStyle({
      fontFamily: BRAND.fonts.heading,
      fontSize: TYPOGRAPHY.titleStyle.fontSize,
      fontWeight: TYPOGRAPHY.titleStyle.fontWeight,
      fill: TYPOGRAPHY.titleStyle.fill,
      letterSpacing: TYPOGRAPHY.titleStyle.letterSpacing,
    }),
  });

  private readonly detail = new Text({
    text: LABELS.detail,
    style: new TextStyle({
      fontFamily: BRAND.fonts.body,
      fontSize: TYPOGRAPHY.detailStyle.fontSize,
      fill: TABLE.gold,
      letterSpacing: TYPOGRAPHY.detailStyle.letterSpacing,
    }),
  });

  private feltW = 0;
  private feltH = 0;
  private feltTexture: Texture | null = null;

  constructor(renderer: Renderer) {
    super();

    this.renderer = renderer;
    this.interactiveChildren = false;
    this.typography.addChild(this.title, this.detail);
    this.addChild(this.felt, this.typography);
  }

  layout(layout: StackLayoutEngine): void {
    const w = layout.viewW;
    const h = layout.viewH;

    if (this.feltW !== w || this.feltH !== h || !this.feltTexture) {
      this.feltTexture?.destroy(true);
      this.feltTexture = buildAceTableFeltTexture(this.renderer, w, h);

      this.feltW = w;
      this.feltH = h;
      this.felt.texture = this.feltTexture;
    }

    this.detail.position.set(
      TYPOGRAPHY.detailOffsetX,
      TYPOGRAPHY.detailOffsetY,
    );

    this.typography.position.set(TYPOGRAPHY.posX, TYPOGRAPHY.posY);
    this.typography.alpha = TYPOGRAPHY.alpha;
  }

  destroy(): void {
    this.feltTexture?.destroy(true);
    this.feltTexture = null;

    super.destroy({ children: true });
  }
}
