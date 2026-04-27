import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';

export interface ShellMetrics {
  shellX: number;
  shellY: number;
  shellW: number;
  shellH: number;
  vpX: number;
  vpY: number;
  vpW: number;
  vpH: number;
}

export interface FeedViewportMetrics {
  frameInset: number;
  scrollLaneX: number;
  scrollLaneY: number;
  scrollLaneWidth: number;
  scrollLaneHeight: number;
  scrollTrackX: number;
  scrollTrackY: number;
  scrollTrackHeight: number;
  transcriptInsetX: number;
  transcriptInsetY: number;
  transcriptWidth: number;
}

export interface MagicWordsSceneLayout {
  shell: ShellMetrics;
  feed: FeedViewportMetrics;
  hintY: number;
}

export function computeMagicWordsSceneLayout(
  viewWidth: number,
  viewHeight: number,
): MagicWordsSceneLayout {
  const maxShellWidth = Math.min(
    MAGIC.shell.maxWidth,
    viewWidth - MAGIC.shell.minInset * 2,
  );

  const maxShellHeight = Math.min(
    MAGIC.shell.maxHeight,
    viewHeight - MAGIC.shell.minInset * 2,
  );

  const shellWidth = Math.min(
    maxShellWidth,
    maxShellHeight * MAGIC.shell.aspectRatio,
  );

  const shellHeight = Math.min(
    maxShellHeight,
    shellWidth / MAGIC.shell.aspectRatio,
  );

  const shellX = (viewWidth - shellWidth) * 0.5;
  const shellY = (viewHeight - shellHeight) * 0.5;
  const vpX = shellX + MAGIC.shell.padding;
  const vpY = shellY + MAGIC.shell.padding;
  const vpW = shellWidth - MAGIC.shell.padding * 2;
  const vpH = shellHeight - MAGIC.shell.padding * 2;

  const scrollLaneWidth = MAGIC.scroll.trackWidth + MAGIC.feed.scrollLaneGap;
  const transcriptInsetX = MAGIC.feed.backdropPad.x;
  const transcriptInsetY = MAGIC.feed.backdropPad.y;

  return {
    shell: {
      shellX,
      shellY,
      shellW: shellWidth,
      shellH: shellHeight,
      vpX,
      vpY,
      vpW,
      vpH,
    },
    feed: {
      frameInset: MAGIC.feed.frameInset,
      scrollLaneX: vpW - MAGIC.scroll.trackInset - scrollLaneWidth,
      scrollLaneY: transcriptInsetY + MAGIC.feed.scrollLaneOffsetY,
      scrollLaneWidth,
      scrollLaneHeight:
        vpH - transcriptInsetY * 2 + MAGIC.feed.scrollLaneHeightAdjustment,
      scrollTrackX:
        vpX + vpW - MAGIC.scroll.trackInset - MAGIC.scroll.trackWidth,
      scrollTrackY: vpY + transcriptInsetY,
      scrollTrackHeight: vpH - transcriptInsetY * 2,
      transcriptInsetX,
      transcriptInsetY,
      transcriptWidth:
        vpW -
        transcriptInsetX * 2 -
        MAGIC.scroll.trackInset -
        MAGIC.scroll.scrollerGap -
        MAGIC.scroll.trackWidth,
    },
    hintY: shellY + shellHeight + MAGIC.shell.hintOffsetY,
  };
}
