import type { Scene } from '@/runtime/scene/Scene';
import { SceneId } from '@/runtime/scene/SceneId';
import {
  GAME_VIEWPORT,
  type Viewport,
} from '@/runtime/viewport/ViewportService';
import type { Renderer } from 'pixi.js';
import { Container } from 'pixi.js';
import type { AceOfShadowsSession } from '../application/AceOfShadowsSession';
import type { StackId } from '../application/CardDefinition';
import { StackLayoutEngine } from '../application/StackLayoutEngine';
import type { CardTextureAtlas } from '../infrastructure/CardTextureAtlas';
import { AceOfShadowsSceneView } from './AceOfShadowsSceneView';

export class AceOfShadowsScene extends Container implements Scene {
  readonly id = SceneId.AceOfShadows;

  private readonly renderer: Renderer;
  private readonly session: AceOfShadowsSession;
  private readonly textureService: CardTextureAtlas;

  private readonly layout = new StackLayoutEngine(GAME_VIEWPORT);

  private view: AceOfShadowsSceneView | null = null;
  private elapsedMs = 0;
  private initialized = false;

  constructor(
    textureService: CardTextureAtlas,
    session: AceOfShadowsSession,
    renderer: Renderer,
  ) {
    super();

    this.session = session;
    this.textureService = textureService;
    this.renderer = renderer;

    this.interactiveChildren = false;
  }

  async enter(): Promise<void> {
    this.view = new AceOfShadowsSceneView(this.textureService, this.renderer);
    this.view.attachTo(this);

    const { back } = this.textureService.generate();
    this.session.start();

    this.elapsedMs = 0;
    this.view.createAllSprites(back);
    this.view.layoutTable(this.layout);

    this.initialized = true;
    this.view.layoutAll(this.layout, this.session);
  }

  async exit(): Promise<void> {
    this.initialized = false;
    this.elapsedMs = 0;

    this.session.stop();
    this.textureService.dispose();

    this.view?.destroy();
    this.view = null;

    this.removeChildren();
  }

  update(dt: number): void {
    if (!this.initialized || !this.view) {
      return;
    }

    this.elapsedMs += dt;
    const canMove = (cardId: number) =>
      !this.view!.spritePool.isTransferring(cardId);

    let dirtyMask = 0;

    const transfer = this.session.update(dt, canMove);
    if (transfer) {
      this.view.beginTransfer(transfer, this.layout, this.elapsedMs);
      dirtyMask |= this.stackBitMask(transfer.from, transfer.to);
    }

    dirtyMask |= this.view.animator.tick(
      this.elapsedMs,
      this.layout,
      this.session,
      this.view.spritePool,
    );

    if (dirtyMask !== 0) {
      this.view.layoutDirtyStacks(dirtyMask, this.layout, this.session);
    }
  }

  resize(viewport: Viewport): void {
    this.layout.updateViewport(viewport);
    this.view?.layoutTable(this.layout);

    if (this.initialized) {
      this.view?.layoutAll(this.layout, this.session);
    }
  }

  private stackBitMask(a: StackId, b: StackId): number {
    return (1 << a) | (1 << b);
  }
}
