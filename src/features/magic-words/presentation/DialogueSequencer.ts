import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { gsap } from 'gsap';
import type { PixiDialogueRow } from './PixiDialogueRow';
import type { PixiMagicWordsCurtain } from './PixiMagicWordsCurtain';

/**
 * Orchestrates the row-by-row dialogue reveal using a single GSAP master timeline.
 * Each row is a labelled segment: setup → entrance → text reveal → finalize → hold-pause.
 * Interactive advance either skips the current text reveal or resumes from a hold pause.
 * Cancellation is handled by killing the master timeline.
 */
export class DialogueSequencer {
  private readonly onLayoutNeeded: () => void;
  private readonly onScrollToLatest: (immediate: boolean) => void;

  private masterTimeline: gsap.core.Timeline | null = null;
  private curtainIdleTween: gsap.core.Tween | null = null;
  private holdTimer: number | null = null;
  private inReveal = false;

  private _isFinished = false;
  private _revealedCount = 0;

  constructor(
    onLayoutNeeded: () => void,
    onScrollToLatest: (immediate: boolean) => void,
  ) {
    this.onLayoutNeeded = onLayoutNeeded;
    this.onScrollToLatest = onScrollToLatest;
  }

  get revealedCount(): number {
    return this._revealedCount;
  }

  get isFinished(): boolean {
    return this._isFinished;
  }

  play(rows: readonly PixiDialogueRow[]): void {
    this.masterTimeline?.kill();
    this.clearHoldTimer();

    this._isFinished = false;
    this._revealedCount = 0;
    this.inReveal = false;

    this.masterTimeline = this.buildSequence(rows);
  }

  /**
   * If currently in a text reveal, skip to the end of the current row's segment.
   * Otherwise, if paused in a hold, resume the timeline to advance to the next row.
   * If neither, do nothing (e.g. if the timeline hasn't started or has already finished).
   */
  handleAdvance(): void {
    if (!this.masterTimeline) {
      return;
    }

    /**
     * If paused in a hold, resume the timeline to advance to the next row. We check this before the inReveal condition
     * because the timeline is paused immediately after the text reveal segment, so we want to prioritize advancing over skipping
     */
    if (this.masterTimeline.paused()) {
      this.clearHoldTimer();
      this.masterTimeline.resume();

      return;
    }

    /**
     * If currently in a text reveal, skip to the end of the current row's segment.
     * We do this by seeking to the label placed at the end of the segment.
     * GSAP will render the timeline at that position, which applies all the final states (e.g. fully revealed text).
     * We use seek with the second parameter set to false to prevent firing callbacks, since we don't want to trigger any onComplete or onUpdate handlers when skipping.
     */
    if (this.inReveal) {
      const label = `row-${this._revealedCount - 1}-done`;
      this.masterTimeline.seek(label, false);
    }
  }

  startCurtainIdle(curtain: PixiMagicWordsCurtain): void {
    curtain.alpha = 1;
    curtain.visible = true;

    this.curtainIdleTween?.kill();
    this.curtainIdleTween = gsap.to(curtain, {
      alpha: 0.9,
      duration: MAGIC.transition.pulseDuration,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  async hideCurtain(curtain: PixiMagicWordsCurtain): Promise<void> {
    this.curtainIdleTween?.kill();
    this.curtainIdleTween = null;

    await new Promise<void>((resolve) => {
      gsap
        .timeline({
          defaults: { overwrite: true },
          onComplete: () => {
            curtain.visible = false;
            resolve();
          },
        })
        .to(
          curtain,
          {
            alpha: 0,
            duration: MAGIC.transition.exitDuration,
            ease: 'power2.inOut',
          },
          0,
        )
        .to(
          curtain.scale,
          {
            x: MAGIC.transition.exitScale,
            y: MAGIC.transition.exitScale,
            duration: MAGIC.transition.exitDuration,
            ease: 'power2.inOut',
          },
          0,
        );
    });
  }

  dispose(curtain: PixiMagicWordsCurtain | null): void {
    this._revealedCount = 0;
    this._isFinished = false;
    this.inReveal = false;

    this.masterTimeline?.kill();
    this.masterTimeline = null;
    this.clearHoldTimer();

    this.curtainIdleTween?.kill();
    this.curtainIdleTween = null;

    if (curtain) {
      gsap.killTweensOf(curtain);
      gsap.killTweensOf(curtain.scale);
    }
  }

  private buildSequence(rows: readonly PixiDialogueRow[]): gsap.core.Timeline {
    const master = gsap.timeline({
      onComplete: () => {
        this._isFinished = true;
        this.onLayoutNeeded();
      },
    });

    for (let i = 0; i < rows.length; i++) {
      this.addRowSegment(master, rows[i], i, i === rows.length - 1);
    }

    return master;
  }

  private addRowSegment(
    tl: gsap.core.Timeline,
    row: PixiDialogueRow,
    index: number,
    isLast: boolean,
  ): void {
    tl.addLabel(`row-${index}`);

    tl.call(() => {
      this._revealedCount = index + 1;
      row.visible = true;

      this.onLayoutNeeded();
      row.prepareForReveal();

      this.onScrollToLatest(true);
    });

    tl.add(this.buildEntrance(row));

    tl.call(() => {
      this.inReveal = true;
    });

    const totalUnits = row.totalRevealUnits;
    if (totalUnits > 0) {
      const state = { units: 0 };
      let lastUnits = -1;

      tl.to(state, {
        units: totalUnits,
        duration: Math.max(
          MAGIC.sequence.minRevealDuration,
          totalUnits / MAGIC.sequence.charsPerSecond,
        ),
        ease: 'none',
        onUpdate: () => {
          const next = Math.floor(state.units);
          if (next !== lastUnits) {
            lastUnits = next;
            row.setVisibleUnits(next);
          }
        },
      });
    }

    tl.call(() => {
      this.inReveal = false;
    });

    tl.addLabel(`row-${index}-done`);
    tl.call(() => {
      row.finalizeRevealState();
      this.onLayoutNeeded();
      this.onScrollToLatest(false);
    });

    const holdMs = isLast
      ? MAGIC.sequence.finalHoldMs
      : MAGIC.sequence.holdAfterMessageMs;

    tl.addPause('+=0', () => this.startHoldTimer(holdMs));
  }

  /**
   * Capture target positions before prepareForReveal offsets them.
   * prepareForReveal runs in the preceding call() right before this nested timeline renders,
   * so GSAP records the offset values as start values and animates toward these captured originals.
   */
  private buildEntrance(row: PixiDialogueRow): gsap.core.Timeline {
    const ent = MAGIC.sequence.entrance;

    const avatarTargetX = row.avatarVisual.x;
    const bubbleTargetX = row.bubbleVisual.x;
    const speakerTargetY = row.speakerVisual.y;

    return gsap
      .timeline({ defaults: { overwrite: true } })
      .to(row, { alpha: 1, duration: ent.fadeIn, ease: 'power1.out' }, 0)
      .to(
        row.scale,
        {
          x: 1,
          y: 1,
          duration: MAGIC.sequence.rowEntrance,
          ease: 'back.out(1.2)',
        },
        0,
      )
      .to(
        row.avatarVisual,
        {
          alpha: 1,
          x: avatarTargetX,
          duration: ent.avatarDuration,
          ease: 'power3.out',
        },
        0,
      )
      .to(
        row.avatarVisual.scale,
        {
          x: 1,
          y: 1,
          duration: ent.avatarScaleDuration,
          ease: 'back.out(1.4)',
        },
        0,
      )
      .to(
        row.speakerVisual,
        {
          alpha: 1,
          y: speakerTargetY,
          duration: ent.speakerDuration,
          ease: 'power2.out',
        },
        ent.speakerDelay,
      )
      .to(
        row.bubbleVisual,
        {
          alpha: 1,
          x: bubbleTargetX,
          duration: ent.bubbleDuration,
          ease: 'power2.out',
        },
        ent.bubbleDelay,
      );
  }

  private startHoldTimer(delayMs: number): void {
    this.clearHoldTimer();

    this.holdTimer = window.setTimeout(() => {
      this.holdTimer = null;
      this.masterTimeline?.resume();
    }, delayMs);
  }

  private clearHoldTimer(): void {
    if (this.holdTimer !== null) {
      window.clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }
}
