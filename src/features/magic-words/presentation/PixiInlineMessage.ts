import {
  computeInlineLayout,
  type LayoutModel,
} from '@/features/magic-words/application/InlineTextLayout';
import type { InlineToken } from '@/features/magic-words/application/MagicWordsModels';
import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import {
  CanvasTextMetrics,
  Container,
  Sprite,
  Text,
  type TextStyle,
  Texture,
} from 'pixi.js';

export interface PixiInlineMessageOptions {
  tokens: readonly InlineToken[];
  emojiTextures: ReadonlyMap<string, Texture>;
  style: TextStyle;
  emojiSize: number;
  maxWidth: number;
}

type DisplayObjectNode = Text | Sprite;

export class PixiInlineMessage extends Container {
  private readonly style: TextStyle;
  private readonly emojiSize: number;

  private readonly measureCache = new Map<string, number>();

  private _contentWidth = 0;
  private _contentHeight = 0;

  private tokens: readonly InlineToken[];
  private emojiTextures: ReadonlyMap<string, Texture>;
  private maxWidth: number;

  private layout: LayoutModel = {
    segments: [],
    width: 0,
    height: MAGIC.text.messageLineHeight,
    totalUnits: 0,
  };

  private visibleUnits = Number.MAX_SAFE_INTEGER;
  private displayObjects: DisplayObjectNode[] = [];

  constructor(options: PixiInlineMessageOptions) {
    super();

    this.style = options.style;
    this.emojiSize = options.emojiSize;

    this.tokens = options.tokens;
    this.emojiTextures = options.emojiTextures;
    this.maxWidth = options.maxWidth;

    this.rebuild();
  }

  get contentWidth(): number {
    return this._contentWidth;
  }

  get contentHeight(): number {
    return this._contentHeight;
  }

  get totalUnits(): number {
    return this.layout.totalUnits;
  }

  setEmojiTextures(emojiTextures: ReadonlyMap<string, Texture>): boolean {
    this.emojiTextures = emojiTextures;
    return this.rebuild();
  }

  setMaxWidth(maxWidth: number): boolean {
    if (Math.abs(this.maxWidth - maxWidth) < 0.5) {
      return false;
    }

    this.maxWidth = maxWidth;
    return this.rebuild();
  }

  setVisibleUnits(units: number): void {
    const clamped = Math.max(0, Math.min(this.totalUnits, Math.floor(units)));
    if (clamped === this.visibleUnits) {
      return;
    }

    this.visibleUnits = clamped;
    this.applyVisibility();
  }

  private rebuild(): boolean {
    const nextLayout = computeInlineLayout(this.tokens, {
      isEmojiAvailable: (name) => this.emojiTextures.has(name),
      emojiSize: this.emojiSize,
      maxWidth: this.maxWidth,
      lineHeight: MAGIC.text.messageLineHeight,
      measure: (value) => this.measure(value),
    });

    const layoutChanged = !layoutEquals(this.layout, nextLayout);
    this.layout = nextLayout;

    this._contentWidth = this.layout.width;
    this._contentHeight = this.layout.height;
    this.visibleUnits = Math.min(this.visibleUnits, this.layout.totalUnits);

    if (layoutChanged) {
      this.createDisplayObjects();
    } else {
      this.updateEmojiTextures();
    }

    this.applyVisibility();
    return layoutChanged;
  }

  private createDisplayObjects(): void {
    for (const obj of this.displayObjects) {
      obj.destroy();
    }

    this.removeChildren();
    this.displayObjects = [];

    for (const segment of this.layout.segments) {
      if (segment.kind === 'text') {
        const node = new Text({ text: segment.value, style: this.style });
        node.position.set(segment.x, segment.y);

        this.addChild(node);
        this.displayObjects.push(node);
      } else {
        const tex = this.emojiTextures.get(segment.name);
        const sprite = new Sprite(tex ?? Texture.EMPTY);

        sprite.width = this.emojiSize;
        sprite.height = this.emojiSize;
        sprite.position.set(segment.x, segment.y);
        sprite.visible = !!tex;

        this.addChild(sprite);
        this.displayObjects.push(sprite);
      }
    }
  }

  private updateEmojiTextures(): void {
    for (let index = 0; index < this.layout.segments.length; index++) {
      const segment = this.layout.segments[index];
      if (segment.kind !== 'emoji') {
        continue;
      }

      const tex = this.emojiTextures.get(segment.name);
      const node = this.displayObjects[index];

      if (tex && node instanceof Sprite) {
        node.texture = tex;
      }
    }
  }

  private applyVisibility(): void {
    for (let i = 0; i < this.layout.segments.length; i++) {
      const segment = this.layout.segments[i];
      const obj = this.displayObjects[i];

      if (segment.kind === 'text') {
        const visible = Math.max(
          0,
          Math.min(segment.unitLength, this.visibleUnits - segment.unitStart),
        );

        obj.visible = visible > 0;
        if (obj.visible) {
          (obj as Text).text = segment.value.slice(0, visible);
        }
      } else {
        obj.visible = this.visibleUnits > segment.unitStart;
      }
    }
  }

  private measure(value: string): number {
    const cacheKey = `${this.style.fontFamily}:${this.style.fontSize}:${value}`;
    const cached = this.measureCache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const width = CanvasTextMetrics.measureText(value, this.style).width;
    this.measureCache.set(cacheKey, width);

    return width;
  }
}

function layoutSegmentEquals(
  a: LayoutModel['segments'][number],
  b: LayoutModel['segments'][number],
): boolean {
  if (
    a.kind !== b.kind ||
    a.x !== b.x ||
    a.y !== b.y ||
    a.unitStart !== b.unitStart
  ) {
    return false;
  }

  if (a.kind === 'text' && b.kind === 'text') {
    return a.value === b.value && a.unitLength === b.unitLength;
  }

  return a.kind === 'emoji' && b.kind === 'emoji' && a.name === b.name;
}

function layoutEquals(a: LayoutModel, b: LayoutModel): boolean {
  if (
    a.width !== b.width ||
    a.height !== b.height ||
    a.totalUnits !== b.totalUnits ||
    a.segments.length !== b.segments.length
  ) {
    return false;
  }

  for (let index = 0; index < a.segments.length; index++) {
    if (!layoutSegmentEquals(a.segments[index], b.segments[index])) {
      return false;
    }
  }

  return true;
}
