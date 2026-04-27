import { MENU } from '@/features/menu/config/MenuConfig';
import { gsap } from 'gsap';
import { Container, Graphics, type Texture } from 'pixi.js';
import { TweenTracker } from '../application/TweenTracker';
import { MenuCardAnimator } from './MenuCardAnimator';
import { MenuImpactEffect } from './MenuImpactEffect';
import { type MenuLayoutResult } from './MenuSceneView';
import { MenuTitleAnimator } from './MenuTitleAnimator';

interface MenuEntranceChoreographerOptions {
  fadeOverlay: Graphics;
  titleLayer: Container;
  titleSquashLayer: Container;
  logoLayer: Container;
  subtitleLayer: Container;
  cards: readonly Container[];
  sparkLayer: Container;
  symbolTextures: readonly Texture[];
  onCardsReady: () => void;
}

export class MenuEntranceChoreographer {
  private readonly fadeOverlay: Graphics;

  private readonly cardAnimator: MenuCardAnimator;
  private readonly impactEffect: MenuImpactEffect;
  private readonly titleAnimator: MenuTitleAnimator;
  private readonly orchestratorTracker = new TweenTracker();

  private started = false;
  private layout: MenuLayoutResult | null = null;

  constructor(options: MenuEntranceChoreographerOptions) {
    this.fadeOverlay = options.fadeOverlay;

    const titleTracker = new TweenTracker();
    const cardTracker = new TweenTracker();

    this.titleAnimator = new MenuTitleAnimator({
      titleLayer: options.titleLayer,
      titleSquashLayer: options.titleSquashLayer,
      logoLayer: options.logoLayer,
      subtitleLayer: options.subtitleLayer,
      tracker: titleTracker,
      onImpact: () => this.impactEffect.fire(),
    });

    this.cardAnimator = new MenuCardAnimator({
      cards: options.cards,
      tracker: cardTracker,
      onCardsReady: options.onCardsReady,
    });

    this.impactEffect = new MenuImpactEffect(
      options.sparkLayer,
      options.symbolTextures,
    );
  }

  syncLayout(layout: MenuLayoutResult): void {
    this.layout = layout;

    if (!this.started || this.titleAnimator.isAnimating()) {
      return;
    }

    this.titleAnimator.syncLayout({ x: layout.titleX, y: layout.titleY });
    this.cardAnimator.syncLayout({ targets: layout.cardTargets });
  }

  play(): void {
    if (!this.layout) {
      return;
    }

    const layout = this.layout;
    this.stop();

    this.layout = layout;
    this.started = true;
    this.cardAnimator.resetReadyState();

    this.titleAnimator.prepare({
      x: layout.titleX,
      y: layout.titleY,
    });

    this.cardAnimator.prepare({ targets: layout.cardTargets });
    this.fadeOverlay.alpha = 1;

    this.orchestratorTracker.track(
      gsap.to(this.fadeOverlay, {
        alpha: 0,
        duration: MENU.animation.fadeIn.duration,
        ease: MENU.animation.fadeIn.ease,
        overwrite: true,
      }),
    );

    this.titleAnimator.play({
      x: layout.titleX,
      y: layout.titleY,
    });

    const config = MENU.animation.buttons;

    this.orchestratorTracker.delay(config.readyDelay, () => {
      this.cardAnimator.play({ targets: layout.cardTargets });
    });

    this.orchestratorTracker.delay(config.completeDelay, () => {
      this.cardAnimator.enableCards();
    });
  }

  stop(): void {
    this.titleAnimator.dispose();
    this.cardAnimator.dispose();
    this.impactEffect.clear();

    this.orchestratorTracker.dispose();

    this.layout = null;
    this.started = false;
  }

  dispose(): void {
    this.stop();
  }

  update(dtSec: number): void {
    this.impactEffect.update(dtSec);
  }
}
