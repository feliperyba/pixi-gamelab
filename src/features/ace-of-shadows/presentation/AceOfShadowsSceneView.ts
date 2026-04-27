import type { Renderer, Texture } from 'pixi.js';
import { Container } from 'pixi.js';
import type {
  AceOfShadowsSession,
  ScheduledTransfer,
} from '../application/AceOfShadowsSession';
import { ALL_STACK_IDS, type StackId } from '../application/CardDefinition';
import type { StackLayoutEngine } from '../application/StackLayoutEngine';
import {
  CARD_STAGE,
  TRANSFER_SHADOW_POOL_SIZE,
} from '../configs/AceOfShadowsConfig';
import type { CardTextureAtlas } from '../infrastructure/CardTextureAtlas';
import { AceTableEnvironment } from './AceTableEnvironment';
import { CardSpritePool } from './CardSpritePool';
import { TransferAnimator } from './TransferAnimator';
import { createTransferShadowVisual } from './TransferShadowFactory';

/**
 * In theory, this scene logic could be simplified by using GSAP's built-in
 * timeline and tweens API to handle the timing and animation of transfers.
 * However, since we are already doing this technique with the Task 2 feature scope,
 * and we need to have more control over the animation flow, I wanted to show a different approach here.
 */
export class AceOfShadowsSceneView {
  readonly spritePool: CardSpritePool;
  readonly animator = new TransferAnimator();

  private readonly table: AceTableEnvironment;

  private readonly stackContainers: Container[] = [];
  private readonly transferShadows: Container[] = [];

  private readonly transferContainer = new Container();
  private readonly transferShadowContainer = new Container();

  private shadowCursor = 0;

  constructor(textureAtlas: CardTextureAtlas, renderer: Renderer) {
    this.table = new AceTableEnvironment(renderer);
    this.spritePool = new CardSpritePool(textureAtlas);
    this.transferShadowContainer.interactiveChildren = false;

    for (const _ of ALL_STACK_IDS) {
      const container = new Container();
      container.interactiveChildren = false;

      this.stackContainers.push(container);
    }

    this.transferContainer.interactiveChildren = false;

    for (let i = 0; i < TRANSFER_SHADOW_POOL_SIZE; i++) {
      const shadow = createTransferShadowVisual();
      shadow.visible = false;

      this.transferShadows.push(shadow);
    }
  }

  attachTo(parent: Container): void {
    parent.addChild(this.table);
    parent.addChild(this.transferShadowContainer);

    for (const shadow of this.transferShadows) {
      this.transferShadowContainer.addChild(shadow);
    }

    for (const container of this.stackContainers) {
      parent.addChild(container);
    }

    parent.addChild(this.transferContainer);
  }

  layoutTable(layout: StackLayoutEngine): void {
    this.table.layout(layout);
  }

  createAllSprites(backTexture: Texture): void {
    this.spritePool.createAll(backTexture);
  }

  layoutAll(layout: StackLayoutEngine, session: AceOfShadowsSession): void {
    for (const id of ALL_STACK_IDS) {
      this.layoutStack(id, layout, session);
    }
  }

  layoutDirtyStacks(
    mask: number,
    layout: StackLayoutEngine,
    session: AceOfShadowsSession,
  ): void {
    for (const id of ALL_STACK_IDS) {
      if ((mask & (1 << id)) !== 0) {
        this.layoutStack(id, layout, session);
      }
    }
  }

  beginTransfer(
    transfer: ScheduledTransfer,
    layout: StackLayoutEngine,
    elapsedMs: number,
  ): void {
    const sprite = this.spritePool.getSprite(transfer.cardId);
    const shadow = this.nextTransferShadow();

    this.spritePool.setTransferring(transfer.cardId);
    this.spritePool.applyCardFace(transfer.cardId, transfer.fromFaceUp);

    shadow.visible = true;
    shadow.alpha = 0;

    sprite.removeFromParent();
    this.transferContainer.addChild(sprite);

    this.animator.start(transfer, sprite, shadow, layout, elapsedMs);
  }

  destroy(): void {
    this.table.destroy();
    this.spritePool.destroyAll();
    this.animator.clear();

    for (const shadow of this.transferShadows) {
      shadow.destroy();
    }

    this.transferShadows.length = 0;

    for (const container of this.stackContainers) {
      container.destroy({ children: true });
    }

    this.stackContainers.length = 0;

    this.transferContainer.destroy({ children: true });
    this.transferShadowContainer.destroy({ children: true });
  }

  private layoutStack(
    stackId: StackId,
    layout: StackLayoutEngine,
    session: AceOfShadowsSession,
  ): void {
    const stack = session.getStack(stackId);
    const cards = stack.cardList;
    const offset = layout.pileOffset(cards.length);
    const stackContainer = this.stackContainers[stackId];

    stackContainer.position.set(layout.stackX(stackId), layout.centerY);

    for (let i = 0; i < cards.length; i++) {
      const cardId = cards[i];
      if (this.spritePool.isTransferring(cardId)) {
        continue;
      }

      const sprite = this.spritePool.getSprite(cardId);
      if (sprite.parent !== stackContainer) {
        stackContainer.addChild(sprite);
      }

      this.spritePool.applyCardFace(cardId, session.isCardFaceUp(cardId));

      sprite.x = 0;
      sprite.y = i * offset;
      sprite.scale.set(CARD_STAGE.scaleX, CARD_STAGE.scaleY);
    }
  }

  private nextTransferShadow(): Container {
    const shadow = this.transferShadows[this.shadowCursor];
    this.shadowCursor = (this.shadowCursor + 1) % this.transferShadows.length;

    return shadow;
  }
}
