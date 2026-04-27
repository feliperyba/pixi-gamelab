import type { Texture } from 'pixi.js';
import { Sprite } from 'pixi.js';
import { type CardId, TOTAL_CARDS } from '../application/CardDefinition';

export interface CardTextureProvider {
  getFaceTexture(cardId: number): Texture;
  getBackTexture(): Texture;
}

export class CardSpritePool {
  private readonly textureAtlas: CardTextureProvider;
  private readonly _sprites: Sprite[] = [];

  /**
   * Per-card boolean flags stored as flat byte arrays indexed by CardId.
   * Uses Uint8Array instead of a Map<number,boolean> or boolean[] because:
   *
   * - O(1) indexed access – a single MOV instruction on most runtimes, no hash computation or bucket walk.
   *
   * - Cache-friendly memory layout – all 144 bytes are contiguous,
   *   so a single 64-byte cache line holds ~64 flags, minimizing L1 misses
   *   when `transfer()` and `isCardFaceUp()` are called every frame.
   *
   * - Zero GC pressure – typed arrays are fixed-length, pre-allocated
   *   slabs that the GC never needs to trace or compact, unlike growing a
   *   regular `boolean[]` or creating wrapper objects in a `Map`.
   *
   * - `_transferFlags` tracks whether a card sprite is currently mid-flight
   *    between stacks (1 = transferring, 0 = resting in a stack container).
   *
   * - `_faceUpFlags` tracks the last face-up state written to each sprite,
   *    enabling dirty-checking in `applyCardFace` to skip redundant texture swaps.
   */
  private _transferFlags = new Uint8Array(0);
  private _faceUpFlags = new Uint8Array(0);

  constructor(textureAtlas: CardTextureProvider) {
    this.textureAtlas = textureAtlas;
  }

  getSprite(cardId: CardId): Sprite {
    return this._sprites[cardId];
  }

  isTransferring(cardId: CardId): boolean {
    return this._transferFlags[cardId] !== 0;
  }

  setTransferring(cardId: CardId): void {
    this._transferFlags[cardId] = 1;
  }

  clearTransferring(cardId: CardId): void {
    this._transferFlags[cardId] = 0;
  }

  createAll(backTexture: Texture): void {
    if (this._sprites.length > 0) {
      this.destroyAll();
    }

    this._transferFlags = new Uint8Array(TOTAL_CARDS);
    this._faceUpFlags = new Uint8Array(TOTAL_CARDS);

    for (let i = 0; i < TOTAL_CARDS; i++) {
      const sprite = new Sprite(backTexture);
      sprite.anchor.set(0.5);

      this._sprites.push(sprite);
    }
  }

  destroyAll(): void {
    for (const sprite of this._sprites) {
      sprite.destroy();
    }

    this._sprites.length = 0;
    this._transferFlags = new Uint8Array(0);
    this._faceUpFlags = new Uint8Array(0);
  }

  /**
   * Swaps the sprite texture between face and back.
   * Skips the texture swap when the face-up state has not changed (dirty tracking).
   */
  applyCardFace(cardId: CardId, faceUp: boolean): void {
    const isCurrentlyFaceUp = this._faceUpFlags[cardId] !== 0;
    if (isCurrentlyFaceUp === faceUp) {
      return;
    }

    this._faceUpFlags[cardId] = faceUp ? 1 : 0;
    this._sprites[cardId].texture = faceUp
      ? this.textureAtlas.getFaceTexture(cardId)
      : this.textureAtlas.getBackTexture();
  }
}
