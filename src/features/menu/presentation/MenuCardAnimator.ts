import { MENU } from '@/features/menu/config/MenuConfig';
import { gsap } from 'gsap';
import type { Container } from 'pixi.js';
import type { TweenTracker } from '../application/TweenTracker';

const OVERSHOOT_ROTATION_MULT = 0.5;
const UNDERSHOOT_ROTATION_MULT = 0.3;
const SETTLE_ROTATION_MULT = 0.15;

export interface CardTargets {
  readonly targets: readonly { x: number; y: number }[];
}

export interface MenuCardAnimatorDeps {
  cards: readonly Container[];
  tracker: TweenTracker;
  onCardsReady: () => void;
}

export class MenuCardAnimator {
  private readonly cards: readonly Container[];
  private readonly tracker: TweenTracker;
  private readonly onCardsReady: () => void;

  private cardsReady = false;

  constructor(deps: MenuCardAnimatorDeps) {
    this.cards = deps.cards;
    this.tracker = deps.tracker;
    this.onCardsReady = deps.onCardsReady;
  }

  prepare(layout: CardTargets): void {
    const config = MENU.animation.buttons;

    for (let i = 0; i < this.cards.length; i++) {
      const target = layout.targets[i];

      if (!target) {
        continue;
      }

      const card = this.cards[i];
      card.eventMode = 'none';
      card.alpha = 0;
      card.position.set(target.x, target.y + config.startOffsetY);
      card.rotation = this.resolveRotation(config, i);
      card.scale.set(config.startScale);
    }
  }

  play(layout: CardTargets): void {
    const config = MENU.animation.buttons;

    for (let index = 0; index < this.cards.length; index++) {
      const card = this.cards[index];
      const target = layout.targets[index];

      if (!target) {
        continue;
      }

      const rotation = this.resolveRotation(config, index);
      const delay = index * config.stagger;

      this.tracker.delay(delay, () => {
        this.tracker.track(
          gsap.to(card, {
            y: target.y - config.overshoot.overshootY,
            alpha: 1,
            rotation: -rotation * OVERSHOOT_ROTATION_MULT,
            duration: config.overshoot.duration,
            ease: config.overshoot.ease,
            overwrite: true,
            onComplete: () => {
              this.playUndershoot(card, target.y, rotation);
            },
          }),
        );

        this.tracker.track(
          gsap.to(card.scale, {
            x: config.overshoot.scale,
            y: config.overshoot.scale,
            duration: config.overshoot.duration,
            ease: config.overshoot.ease,
            overwrite: true,
          }),
        );
      });
    }
  }

  enableCards(): void {
    if (this.cardsReady) {
      return;
    }

    this.cardsReady = true;
    for (const card of this.cards) {
      card.eventMode = 'static';
    }

    this.onCardsReady();
  }

  syncLayout(layout: CardTargets): void {
    for (let i = 0; i < this.cards.length; i++) {
      const target = layout.targets[i];

      if (target) {
        this.cards[i].position.set(target.x, target.y);
      }
    }
  }

  resetReadyState(): void {
    this.cardsReady = false;
  }

  dispose(): void {
    for (const card of this.cards) {
      gsap.killTweensOf(card);
      gsap.killTweensOf(card.scale);
    }

    this.tracker.dispose();
  }

  private playUndershoot(
    card: Container,
    finalY: number,
    startRotation: number,
  ): void {
    const config = MENU.animation.buttons;

    this.tracker.track(
      gsap.to(card, {
        y: finalY + config.undershoot.undershootY,
        rotation: startRotation * UNDERSHOOT_ROTATION_MULT,
        duration: config.undershoot.duration,
        ease: config.undershoot.ease,
        overwrite: true,
        onComplete: () => this.playSettleBounce(card, finalY, startRotation),
      }),
    );

    this.tracker.track(
      gsap.to(card.scale, {
        x: config.undershoot.scale,
        y: config.undershoot.scale,
        duration: config.undershoot.duration,
        ease: config.undershoot.ease,
        overwrite: true,
      }),
    );
  }

  private playSettleBounce(
    card: Container,
    finalY: number,
    startRotation: number,
  ): void {
    const config = MENU.animation.buttons;

    this.tracker.track(
      gsap.to(card, {
        y: finalY - config.settleBounce.settleY,
        rotation: -startRotation * SETTLE_ROTATION_MULT,
        duration: config.settleBounce.duration,
        ease: config.settleBounce.ease,
        overwrite: true,
        onComplete: () => this.playRest(card, finalY),
      }),
    );

    this.tracker.track(
      gsap.to(card.scale, {
        x: config.settleBounce.scale,
        y: config.settleBounce.scale,
        duration: config.settleBounce.duration,
        ease: config.settleBounce.ease,
        overwrite: true,
      }),
    );
  }

  private playRest(card: Container, finalY: number): void {
    const config = MENU.animation.buttons;

    this.tracker.track(
      gsap.to(card, {
        y: finalY,
        rotation: 0,
        duration: config.rest.duration,
        ease: config.rest.ease,
        overwrite: true,
      }),
    );

    this.tracker.track(
      gsap.to(card.scale, {
        x: 1,
        y: 1,
        duration: config.rest.duration,
        ease: config.rest.ease,
        overwrite: true,
      }),
    );
  }

  private resolveRotation(
    config: typeof MENU.animation.buttons,
    index: number,
  ): number {
    return config.rotations[index] ?? config.rotations[0] ?? 0;
  }
}
