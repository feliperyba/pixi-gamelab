import { MENU } from '@/features/menu/config/MenuConfig';
import { gsap } from 'gsap';
import type { Container } from 'pixi.js';
import type { TweenTracker } from '../application/TweenTracker';

export interface TitleLayout {
  x: number;
  y: number;
}

export interface MenuTitleAnimatorDeps {
  titleLayer: Container;
  titleSquashLayer: Container;
  logoLayer: Container;
  subtitleLayer: Container;
  tracker: TweenTracker;
  onImpact: () => void;
}

export class MenuTitleAnimator {
  private readonly titleLayer: Container;
  private readonly titleSquashLayer: Container;
  private readonly logoLayer: Container;
  private readonly subtitleLayer: Container;

  private readonly tracker: TweenTracker;
  private readonly onImpact: () => void;

  private subtitleBaseY = 0;

  constructor(deps: MenuTitleAnimatorDeps) {
    this.titleLayer = deps.titleLayer;
    this.titleSquashLayer = deps.titleSquashLayer;

    this.logoLayer = deps.logoLayer;
    this.subtitleLayer = deps.subtitleLayer;

    this.tracker = deps.tracker;
    this.onImpact = deps.onImpact;
  }

  prepare(layout: TitleLayout): void {
    const title = MENU.animation.title;

    this.titleLayer.alpha = 1;
    this.titleLayer.position.set(layout.x, title.startY);
    this.titleLayer.rotation = title.startRotation;
    this.titleLayer.scale.set(title.startScale);
    this.titleSquashLayer.scale.set(1);

    this.logoLayer.alpha = 1;
    this.logoLayer.position.set(0, 0);
    this.logoLayer.scale.set(1);

    this.subtitleBaseY = this.subtitleLayer.y;
    this.subtitleLayer.alpha = 0;
    this.subtitleLayer.y =
      this.subtitleBaseY + MENU.animation.subtitle.startOffsetY;
    this.subtitleLayer.scale.set(MENU.animation.subtitle.startScale);
  }

  play(layout: TitleLayout): void {
    this.dropTitle(layout);
  }

  syncLayout(layout: TitleLayout): void {
    this.titleLayer.position.set(layout.x, layout.y);
  }

  isAnimating(): boolean {
    return this.tracker.isActive();
  }

  dispose(): void {
    this.tracker.killTargets(
      this.titleLayer,
      this.titleLayer.scale,
      this.titleSquashLayer.scale,
      this.logoLayer,
      this.logoLayer.scale,
      this.subtitleLayer,
      this.subtitleLayer.scale,
    );
    this.tracker.dispose();
  }

  private dropTitle(layout: TitleLayout): void {
    const title = MENU.animation.title;

    this.tracker.track(
      gsap.to(this.titleLayer, {
        y: layout.y + title.overshootY,
        rotation: title.bounceRotation,
        duration: title.dropDuration,
        ease: title.dropEase,
        overwrite: true,
        onComplete: () => this.playBounce(layout.y),
      }),
    );

    this.tracker.track(
      gsap.to(this.titleLayer.scale, {
        x: title.overshootScale,
        y: title.overshootScale,
        duration: title.dropDuration,
        ease: title.dropEase,
        overwrite: true,
      }),
    );
  }

  private playBounce(finalY: number): void {
    const bounce = MENU.animation.bounce;
    let accumulatedDelay = 0;

    for (let i = 0; i < bounce.phases.length; i++) {
      const phase = bounce.phases[i];
      const phaseDelay = accumulatedDelay;

      this.tracker.delay(phaseDelay, () => {
        this.tracker.track(
          gsap.to(this.titleLayer, {
            y: finalY + phase.y,
            rotation: phase.rot,
            duration: phase.dur,
            ease: 'power2.out',
            overwrite: true,
          }),
        );

        this.tracker.track(
          gsap.to(this.titleSquashLayer.scale, {
            x: phase.squashX,
            y: phase.squashY,
            duration: phase.dur * bounce.squashDurationRatio,
            ease: 'power2.out',
            overwrite: true,
          }),
        );

        if (i === bounce.impactPhaseIndex) {
          this.onImpact();
        }
      });

      accumulatedDelay += phase.dur;
    }

    this.tracker.delay(accumulatedDelay, () => this.playSettle());
  }

  private playSettle(): void {
    const bounce = MENU.animation.bounce;

    this.tracker.track(
      gsap.to(this.titleSquashLayer.scale, {
        x: 1,
        y: 1,
        duration: bounce.settleDuration,
        ease: bounce.settleEase,
        overwrite: true,
      }),
    );

    this.tracker.delay(MENU.animation.subtitle.delay, () =>
      this.revealSubtitle(),
    );

    this.playSettleRotations();
  }

  private playSettleRotations(): void {
    const steps = MENU.animation.title.settleSteps;
    let accumulatedDelay = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepDelay = accumulatedDelay;

      this.tracker.delay(stepDelay, () => {
        this.tracker.track(
          gsap.to(this.titleLayer, {
            rotation: step.rotation,
            duration: step.duration,
            ease: 'power2.out',
            overwrite: true,
          }),
        );
      });

      accumulatedDelay += step.duration;
    }
  }

  private revealSubtitle(): void {
    const subtitle = MENU.animation.subtitle;

    this.subtitleLayer.alpha = 1;

    this.tracker.track(
      gsap.to(this.subtitleLayer, {
        y: this.subtitleBaseY,
        duration: subtitle.duration,
        ease: subtitle.ease,
        overwrite: true,
      }),
    );

    this.tracker.track(
      gsap.to(this.subtitleLayer.scale, {
        x: 1,
        y: 1,
        duration: subtitle.duration,
        ease: subtitle.ease,
        overwrite: true,
      }),
    );
  }
}
