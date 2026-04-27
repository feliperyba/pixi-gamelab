import { MAGIC } from '@/features/magic-words/config/MagicWordsConfig';
import { ensureAssetBundle } from '@/infrastructure/ensureAssetBundle';
import type { SharedUITextures } from '@/infrastructure/SharedUIBundle';
import type { AtlasTextures } from '@/infrastructure/SpritesheetBundle';
import type { PixiNineSliceInsets } from '@/ui/contracts/PixiNineSliceInsets';
import { BRAND } from '@/ui/theme/BrandTokens';
import type { Texture } from 'pixi.js';
import { Assets, TextStyle } from 'pixi.js';
import type { PixiDialogueSideSkin } from './PixiDialogueRow';

// Narrow contract for what PixiMagicWordsCurtain actually needs.
export interface CurtainSkin {
  shellPanelTexture: Texture;
  shellInsets: PixiNineSliceInsets;
  bubbleTexture: Texture;
  bubbleInsets: PixiNineSliceInsets;
  transitionTitleStyle: TextStyle;
  transitionSubtitleStyle: TextStyle;
  transitionStatusStyle: TextStyle;
  palette: Pick<
    typeof MAGIC.palette,
    'overlayCardTint' | 'overlayStatusTint' | 'overlayScrim' | 'shellGlow'
  >;
}

export interface MagicWordsPixiSkin extends CurtainSkin {
  screenFrameTexture: Texture;
  screenFrameInsets: PixiNineSliceInsets;
  glassPanelTexture: Texture;
  fallbackAvatarTexture: Texture;
  messageStyle: TextStyle;
  hintStyle: TextStyle;
  emptyStateStyle: TextStyle;
  palette: typeof MAGIC.palette;
  leftSide: PixiDialogueSideSkin;
  rightSide: PixiDialogueSideSkin;
}

const MAGIC_SVG_BUNDLE_ID = ensureAssetBundle('scene-magic-words-svg', [
  { alias: 'magic-avatar-fallback', src: 'ui/avatarFallback.svg' },
]);

type TextStyleInit = ConstructorParameters<typeof TextStyle>[0];

function createBodyStyle(
  overrides: Omit<TextStyleInit, 'fontFamily'>,
): TextStyle {
  return new TextStyle({ fontFamily: BRAND.fonts.body, ...overrides });
}

function createHeadingStyle(
  overrides: Omit<TextStyleInit, 'fontFamily'>,
): TextStyle {
  return new TextStyle({ fontFamily: BRAND.fonts.heading, ...overrides });
}

function createSideSkin(
  speakerFill: number,
  bubbleTint: number,
  avatarFrameTint: number,
): PixiDialogueSideSkin {
  return {
    bubbleTint,
    bubbleShadowColor: MAGIC.palette.bubbleShadow,
    avatarFrameTint,
    speakerStyle: createBodyStyle({
      fontSize: MAGIC.text.speakerFontSize,
      fontWeight: '700',
      fill: speakerFill,
      letterSpacing: 0.05,
    }),
  };
}

const messageStyle = createBodyStyle({
  fontSize: MAGIC.text.messageFontSize,
  fill: MAGIC.palette.messageInk,
  lineHeight: MAGIC.text.messageLineHeight,
  breakWords: true,
  letterSpacing: 0,
});

const hintStyle = createBodyStyle({
  fontSize: MAGIC.text.hintFontSize,
  fill: MAGIC.palette.hint,
  fontWeight: '500',
  letterSpacing: 0.05,
});

const emptyStateStyle = createBodyStyle({
  fontSize: MAGIC.text.emptyStateFontSize,
  fontWeight: '500',
  fill: BRAND.palette.white,
  align: 'center',
  wordWrap: true,
  wordWrapWidth: 240,
});

const transitionTitleStyle = createHeadingStyle({
  fontSize: MAGIC.text.transitionTitleFontSize,
  fontWeight: '700',
  fill: BRAND.palette.white,
  letterSpacing: 0.3,
});

const transitionSubtitleStyle = createBodyStyle({
  fontSize: MAGIC.text.transitionSubtitleFontSize,
  fill: MAGIC.palette.subtitle,
  letterSpacing: 0.15,
});

const transitionStatusStyle = createBodyStyle({
  fontSize: MAGIC.text.transitionStatusFontSize,
  fontWeight: '600',
  fill: MAGIC.palette.overlayStatusText,
  letterSpacing: 0.1,
});

export async function loadMagicWordsPixiSkin(
  shared: SharedUITextures,
  atlas: AtlasTextures,
): Promise<MagicWordsPixiSkin> {
  const svgTextures = (await Assets.loadBundle(MAGIC_SVG_BUNDLE_ID)) as Record<
    string,
    Texture
  >;

  return {
    shellPanelTexture: shared.metalPanel,
    screenFrameTexture: shared.metalPanel,
    screenFrameInsets: createUniformInsets(16),
    glassPanelTexture: atlas['glassPanel'],
    bubbleTexture: atlas['bar_round_gloss_large'],
    fallbackAvatarTexture: svgTextures['magic-avatar-fallback'],
    shellInsets: createUniformInsets(MAGIC.ui.shellInsets),
    bubbleInsets: MAGIC.ui.bubbleInsets,
    messageStyle,
    hintStyle,
    emptyStateStyle,
    transitionTitleStyle,
    transitionSubtitleStyle,
    transitionStatusStyle,
    palette: MAGIC.palette,
    leftSide: createSideSkin(
      MAGIC.palette.speakerLeft,
      MAGIC.palette.bubbleLeftTint,
      MAGIC.palette.avatarLeftTint,
    ),
    rightSide: createSideSkin(
      MAGIC.palette.speakerRight,
      MAGIC.palette.bubbleRightTint,
      MAGIC.palette.avatarRightTint,
    ),
  };
}

export async function unloadMagicWordsPixiSkin(): Promise<void> {
  await Assets.unloadBundle(MAGIC_SVG_BUNDLE_ID);
}

function createUniformInsets(value: number): PixiNineSliceInsets {
  return { left: value, top: value, right: value, bottom: value };
}
