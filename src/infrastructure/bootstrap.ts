import { AceBoard } from '@/features/ace-of-shadows/application/AceBoard';
import { AceOfShadowsSession } from '@/features/ace-of-shadows/application/AceOfShadowsSession';
import { DeckPatternCatalog } from '@/features/ace-of-shadows/application/DeckPatternCatalog';
import { NextTransferPolicy } from '@/features/ace-of-shadows/application/NextTransferPolicy';
import { CardTextureAtlas } from '@/features/ace-of-shadows/infrastructure/CardTextureAtlas';
import { AceOfShadowsScene } from '@/features/ace-of-shadows/presentation/AceOfShadowsScene';
import { MagicWordsDataSource } from '@/features/magic-words/infrastructure/MagicWordsDataSource';
import { RemoteTextureCache } from '@/features/magic-words/infrastructure/RemoteTextureCache';
import { MagicWordsScene } from '@/features/magic-words/presentation/MagicWordsScene';
import { MENU_ENTRIES } from '@/features/menu/application/MenuEntries';
import { MenuScene } from '@/features/menu/presentation/MenuScene';
import { PhoenixFlameScene } from '@/features/phoenix-flame/presentation/PhoenixFlameScene';
import {
  createHudPixiSkin,
  createSharedUITextures,
  type SharedUITextures,
} from '@/infrastructure/SharedUIBundle';
import {
  loadGameAtlas,
  type AtlasTextures,
} from '@/infrastructure/SpritesheetBundle';
import { PixiGameRuntime } from '@/runtime/app/PixiGameRuntime';
import { FullscreenController } from '@/runtime/fullscreen/FullscreenController';
import { FpsProbe } from '@/runtime/perf/FpsProbe';
import {
  SceneCoordinator,
  type SceneDefinition,
} from '@/runtime/scene/SceneCoordinator';
import { SceneId } from '@/runtime/scene/SceneId';
import {
  GAME_VIEWPORT,
  ViewportService,
} from '@/runtime/viewport/ViewportService';
import { HudOverlay } from '@/ui/components/HudOverlay';
import { BRAND } from '@/ui/theme/BrandTokens';
import { Application } from 'pixi.js';

/**
 * The main entry point for the app.
 * Bootstraps the entire application, initializing all dependencies and starting the first scene.
 */
const FONTS = [
  { family: 'Poppins', weight: '400' },
  { family: 'Poppins', weight: '700' },
  { family: 'Roboto', weight: '400' },
  { family: 'Roboto', weight: '500' },
  { family: 'Roboto', weight: '700' },
] as const;

const FONT_LOAD_SIZE = 32;

/**
 * Preload fonts to avoid rendering glitches when they are first used in the UI.
 * This ensures that text elements are rendered with the correct font from the start.
 */
async function preloadFonts(): Promise<void> {
  await Promise.all(
    FONTS.map((f) =>
      document.fonts.load(`${f.weight} ${FONT_LOAD_SIZE}px "${f.family}"`),
    ),
  );
}

async function createPixiApp(
  viewportService: ViewportService,
): Promise<Application> {
  const app = new Application();
  /**
   * Renderer resolution should follow the real panel DPR for crisp visuals
   * but we want to cap it to avoid excessive GPU memory usage on high-DPI displays.
   */
  const renderResolution = viewportService.resolveRenderResolution(
    window.devicePixelRatio || 1,
  );

  await app.init({
    resizeTo: window,
    background: BRAND.palette.black,
    antialias: true,
    resolution: renderResolution,
    autoDensity: true,
    roundPixels: true,
  });

  document.body.appendChild(app.canvas);

  return app;
}

function buildSceneRegistry(
  app: Application,
  magicWordsDataSource: MagicWordsDataSource,
  cardTextureAtlas: CardTextureAtlas,
  shared: SharedUITextures,
  atlas: AtlasTextures,
): Record<SceneId, SceneDefinition> {
  return {
    [SceneId.Menu]: {
      showBackButton: false,
      createScene: (navigateTo) =>
        new MenuScene(MENU_ENTRIES, navigateTo, atlas),
    },
    [SceneId.AceOfShadows]: {
      showBackButton: true,
      createScene: () =>
        new AceOfShadowsScene(
          cardTextureAtlas,
          new AceOfShadowsSession(new AceBoard(), new NextTransferPolicy()),
          app.renderer,
        ),
    },
    [SceneId.MagicWords]: {
      showBackButton: true,
      createScene: () =>
        new MagicWordsScene(
          magicWordsDataSource,
          new RemoteTextureCache(),
          shared,
          atlas,
        ),
    },
    [SceneId.PhoenixFlame]: {
      showBackButton: true,
      createScene: () => new PhoenixFlameScene(shared, app.renderer, atlas),
    },
  };
}

export async function bootstrap() {
  await preloadFonts();
  const atlas = await loadGameAtlas();

  const viewportService = new ViewportService(GAME_VIEWPORT);
  const app = await createPixiApp(viewportService);

  const fpsProbe = new FpsProbe();
  const fullscreenController = new FullscreenController();
  const magicWordsDataSource = new MagicWordsDataSource();

  fpsProbe.reset();
  fullscreenController.init();

  const deckPatternCatalog = new DeckPatternCatalog();
  const cardTextureAtlas = new CardTextureAtlas(
    app.renderer,
    deckPatternCatalog,
    atlas,
  );

  const shared = createSharedUITextures(atlas);
  const hudSkin = createHudPixiSkin(shared);
  const hud = new HudOverlay(fpsProbe, hudSkin);

  const sceneRegistry = buildSceneRegistry(
    app,
    magicWordsDataSource,
    cardTextureAtlas,
    shared,
    atlas,
  );

  const sceneCoordinator = new SceneCoordinator({
    sceneRegistry,
    onSceneChanged: (sceneId, definition) => {
      if (definition.showBackButton) {
        hud.showBackButton(() => {
          hud.hideBackButton();

          sceneCoordinator.goTo(SceneId.Menu).catch((err) => {
            console.error('[Bootstrap] Navigation to Menu failed:', err);
          });
        });

        return;
      }

      hud.hideBackButton();
    },
  });

  const runtime = new PixiGameRuntime({
    app,
    sceneCoordinator,
    hud,
    fullscreenController,
    fpsProbe,
    viewportService,
  });

  await runtime.start(SceneId.Menu);
}
