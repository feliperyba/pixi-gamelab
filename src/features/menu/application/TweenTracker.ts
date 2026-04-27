import { gsap } from 'gsap';

export class TweenTracker {
  private readonly tweens: gsap.core.Tween[] = [];
  private readonly delayedCalls: gsap.core.Tween[] = [];

  track(tween: gsap.core.Tween): gsap.core.Tween {
    this.tweens.push(tween);
    return tween;
  }

  delay(seconds: number, callback: () => void): gsap.core.Tween {
    const dc = gsap.delayedCall(seconds, callback);
    this.delayedCalls.push(dc);
    return dc;
  }

  isActive(): boolean {
    for (const t of this.tweens) {
      if (t.isActive()) {
        return true;
      }
    }

    for (const dc of this.delayedCalls) {
      if (dc.isActive()) {
        return true;
      }
    }

    return false;
  }

  killTargets(...targets: object[]): void {
    for (const target of targets) {
      gsap.killTweensOf(target);
    }
  }

  dispose(): void {
    for (const t of this.tweens) {
      t.kill();
    }
    this.tweens.length = 0;

    for (const dc of this.delayedCalls) {
      dc.kill();
    }
    this.delayedCalls.length = 0;
  }
}
