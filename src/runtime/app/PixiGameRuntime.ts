import type { FullscreenController } from '@/runtime/fullscreen/FullscreenController';
import type { FpsProbe } from '@/runtime/perf/FpsProbe';
import type { SceneCoordinator } from '@/runtime/scene/SceneCoordinator';
import type { SceneId } from '@/runtime/scene/SceneId';
import type { ViewportService } from '@/runtime/viewport/ViewportService';
import type { HudOverlay } from '@/ui/components/HudOverlay';
import { type Application, Container, type Ticker } from 'pixi.js';

const MAX_FRAME_DT_MS = 100;

interface PixiGameRuntimeOptions {
  app: Application;
  hud: HudOverlay;
  fpsProbe: FpsProbe;
  viewportService: ViewportService;
  sceneCoordinator: SceneCoordinator;
  fullscreenController: FullscreenController;
}

export class PixiGameRuntime {
  private readonly app: Application;
  private readonly hud: HudOverlay;
  private readonly fpsProbe: FpsProbe;
  private readonly viewportService: ViewportService;
  private readonly sceneCoordinator: SceneCoordinator;
  private readonly fullscreenController: FullscreenController;

  private readonly viewportContainer = new Container();

  constructor(options: PixiGameRuntimeOptions) {
    this.app = options.app;
    this.hud = options.hud;
    this.fpsProbe = options.fpsProbe;
    this.viewportService = options.viewportService;
    this.sceneCoordinator = options.sceneCoordinator;
    this.fullscreenController = options.fullscreenController;

    this.viewportContainer.addChild(this.sceneCoordinator.sceneContainer);
  }

  async start(initialSceneId: SceneId): Promise<void> {
    this.app.stage.addChild(this.viewportContainer);
    this.app.stage.addChild(this.hud);

    this.app.renderer.on('resize', this.syncViewport);

    this.app.ticker.add(this.handleTick);
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.once('pointertap', this.handleFirstPointerTap);

    const viewport = this.syncViewport();
    await this.sceneCoordinator.start(initialSceneId, viewport);
  }

  async destroy(): Promise<void> {
    this.app.renderer.off('resize', this.syncViewport);
    this.app.ticker.remove(this.handleTick);

    await this.sceneCoordinator.destroy();

    this.hud.destroy();
    this.fullscreenController.dispose();
  }

  private readonly syncViewport = () => {
    const viewport = this.viewportService.resolve(
      this.app.screen.width,
      this.app.screen.height,
    );

    this.viewportContainer.position.set(viewport.offsetX, viewport.offsetY);
    this.viewportContainer.scale.set(viewport.scale);
    this.sceneCoordinator.resize(viewport);

    return viewport;
  };

  private readonly handleTick = (ticker: Ticker): void => {
    /**
     * Do not update FPS on huge time gaps
     * to avoid skewing the average with unrealistic values
     */
    if (ticker.elapsedMS <= MAX_FRAME_DT_MS * 2) {
      this.fpsProbe.tick(ticker.elapsedMS);
    }

    this.hud.updateFps();

    /**
     * When the browser tab is inactive, PixiJS pauses its ticker.
     * On resume, elapsedMS contains the full wall-clock gap.
     * Capping to 100ms (~10fps) prevents scenes from simulating huge time jumps
     */
    const dtMs = Math.min(ticker.elapsedMS, MAX_FRAME_DT_MS);
    this.sceneCoordinator.update(dtMs);
  };

  private readonly handleFirstPointerTap = async (): Promise<void> => {
    if (!this.fullscreenController.isFullscreen) {
      await this.fullscreenController.request().catch(() => {});
    }
  };
}
