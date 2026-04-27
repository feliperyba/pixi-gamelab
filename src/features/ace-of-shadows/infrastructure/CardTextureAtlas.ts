import {
  type Suit,
  SUITS,
} from '@/features/ace-of-shadows/application/CardDefinition';
import type { DeckPatternCatalog } from '@/features/ace-of-shadows/application/DeckPatternCatalog';
import { CARD } from '@/features/ace-of-shadows/configs/CardVisualConfig';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import { BRAND } from '@/ui/theme/BrandTokens';
import type {
  Renderer,
  TextStyleAlign,
  TextStyleFontWeight,
  Texture,
} from 'pixi.js';
import { Container, Sprite, Text, TextStyle } from 'pixi.js';

export class CardTextureAtlas {
  private readonly renderer: Renderer;
  private readonly deckPatternCatalog: DeckPatternCatalog;
  private readonly atlas: AtlasTextures;

  private faceTextures: Texture[] = [];
  private backTexture: Texture | null = null;

  private styleCache = new Map<string, TextStyle>();
  private suitTextures = new Map<Suit, Texture>();

  constructor(
    renderer: Renderer,
    deckPatternCatalog: DeckPatternCatalog,
    atlas: AtlasTextures,
  ) {
    this.atlas = atlas;
    this.renderer = renderer;
    this.deckPatternCatalog = deckPatternCatalog;
  }

  generate(): { faces: Texture[]; back: Texture } {
    if (this.faceTextures.length > 0) {
      return { faces: this.faceTextures, back: this.backTexture! };
    }

    const backTexture = this.atlas['cardBack_blue'];
    const frontTexture = this.atlas['cardFront'];

    this.backTexture = backTexture;

    for (const suit of SUITS) {
      this.suitTextures.set(suit, this.atlas[`suit_${suit}`]);
    }

    this.faceTextures = [];
    for (let i = 0; i < this.deckPatternCatalog.standardDeckSize; i++) {
      const def = this.deckPatternCatalog.getDefinitionAt(i);

      this.faceTextures.push(
        this.composeFace(def.rank, def.suit, frontTexture),
      );
    }

    return { faces: this.faceTextures, back: this.backTexture };
  }

  getFaceTexture(cardId: number): Texture {
    return this.faceTextures[cardId % this.faceTextures.length];
  }

  getBackTexture(): Texture {
    if (!this.backTexture) {
      throw new Error(
        'CardTextureAtlas: call loadAndGenerate() before accessing textures',
      );
    }

    return this.backTexture;
  }

  dispose(): void {
    for (const tex of this.faceTextures) {
      tex.destroy(true);
    }

    this.faceTextures = [];
    this.backTexture = null;

    for (const style of this.styleCache.values()) {
      style.destroy();
    }

    this.suitTextures.clear();
    this.styleCache.clear();
  }

  private getCachedStyle(
    color: string,
    fontSize: number,
    fontWeight?: TextStyleFontWeight,
    align?: TextStyleAlign,
  ): TextStyle {
    const key = `${color}:${fontSize}:${fontWeight ?? ''}:${align ?? ''}`;
    let style = this.styleCache.get(key);

    if (!style) {
      style = new TextStyle({
        fontFamily: BRAND.fonts.body,
        fontSize,
        fill: color,
        ...(fontWeight && { fontWeight }),
        ...(align && { align }),
      });

      this.styleCache.set(key, style);
    }

    return style;
  }

  private composeFace(
    rank: string,
    suit: Suit,
    frontTexture: Texture,
  ): Texture {
    const root = this.buildCardComposition(rank, suit, frontTexture);
    const texture = this.renderToTexture(root);
    root.destroy({ children: true });

    return texture;
  }

  private buildCardComposition(
    rank: string,
    suit: Suit,
    frontTexture: Texture,
  ): Container {
    const root = new Container();
    const color = CARD.suitColors[suit];

    root.addChild(new Sprite(frontTexture));
    this.addCornerLabels(root, rank, suit, color);
    this.addCenterSuit(root, suit);

    return root;
  }

  private addCornerLabel(
    root: Container,
    text: string,
    style: TextStyle,
    anchorX: number,
    anchorY: number,
    posX: number,
    posY: number,
  ): void {
    const label = new Text({ text, style });
    label.anchor.set(anchorX, anchorY);
    label.position.set(posX, posY);
    root.addChild(label);
  }

  private addCornerLabels(
    root: Container,
    rank: string,
    suit: Suit,
    color: string,
  ): void {
    const symbol = CARD.suitSymbols[suit];
    const rankStyle = this.getCachedStyle(color, CARD.rankFontSize, '900');
    const symStyle = this.getCachedStyle(color, CARD.symbolFontSize);

    this.addCornerLabel(root, rank, rankStyle, 0, 0, CARD.rankX, CARD.rankY);
    this.addCornerLabel(
      root,
      symbol,
      symStyle,
      0,
      0,
      CARD.symbolX,
      CARD.symbolY,
    );
    this.addCornerLabel(
      root,
      rank,
      rankStyle,
      1,
      1,
      CARD.width - CARD.rankX,
      CARD.height - CARD.rankY,
    );
    this.addCornerLabel(
      root,
      symbol,
      symStyle,
      1,
      1,
      CARD.width - CARD.symbolX,
      CARD.height - CARD.symbolY,
    );
  }

  private addCenterSuit(root: Container, suit: Suit): void {
    const suitTex = this.suitTextures.get(suit);
    const color = CARD.suitColors[suit];

    if (suitTex) {
      const centerSuit = new Sprite(suitTex);

      centerSuit.anchor.set(0.5);
      centerSuit.position.set(CARD.width / 2, CARD.height / 2);
      centerSuit.width = CARD.centerSuitSize;
      centerSuit.height = CARD.centerSuitSize;
      centerSuit.tint = color;

      root.addChild(centerSuit);
    } else {
      const symbol = CARD.suitSymbols[suit];

      const fallbackStyle = this.getCachedStyle(
        color,
        CARD.fallbackSymbolFontSize,
        undefined,
        'center',
      );

      const fallback = new Text({ text: symbol, style: fallbackStyle });
      fallback.anchor.set(0.5);
      fallback.position.set(CARD.width / 2, CARD.height / 2);

      root.addChild(fallback);
    }
  }

  private renderToTexture(container: Container): Texture {
    return this.renderer.generateTexture({
      target: container,
      resolution: this.renderer.resolution,
    });
  }
}
