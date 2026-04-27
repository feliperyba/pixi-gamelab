import type { InlineToken } from '@/features/magic-words/application/MagicWordsModels';

type Atom =
  | { kind: 'text'; value: string }
  | { kind: 'space'; value: string }
  | { kind: 'emoji'; name: string };

type NormalizedToken =
  | { kind: 'text'; value: string }
  | { kind: 'emoji'; name: string };

export type LayoutSegment =
  | {
      kind: 'text';
      value: string;
      x: number;
      y: number;
      unitStart: number;
      unitLength: number;
    }
  | {
      kind: 'emoji';
      name: string;
      x: number;
      y: number;
      unitStart: number;
    };

export interface LayoutModel {
  segments: LayoutSegment[];
  width: number;
  height: number;
  totalUnits: number;
}

export interface InlineLayoutConfig {
  emojiSize: number;
  maxWidth: number;
  lineHeight: number;
  measure: (value: string) => number;
  isEmojiAvailable: (name: string) => boolean;
}

/**
 * inline layout for mixed text and emoji content.
 * Text is normalized first so omitted emojis do not leave spacing,
 * then split into atomic runs and wrapped line by line.
 * Long words fall back to per-character breaking to keep the bubble width bounded.
 */
export function computeInlineLayout(
  tokens: readonly InlineToken[],
  config: InlineLayoutConfig,
): LayoutModel {
  const normalized = normalizeTokens(tokens, config.isEmojiAvailable);
  const atomLines = splitIntoAtomLines(normalized);
  const wrapped = wrapLines(atomLines, config);

  return buildSegments(wrapped, config);
}

function normalizeTokens(
  tokens: readonly InlineToken[],
  isEmojiAvailable: (name: string) => boolean,
): NormalizedToken[] {
  const merged = mergeTokens(tokens, isEmojiAvailable);
  return normalizeTextContent(merged);
}

function mergeTokens(
  tokens: readonly InlineToken[],
  isEmojiAvailable: (name: string) => boolean,
): NormalizedToken[] {
  const result: NormalizedToken[] = [];

  for (const token of tokens) {
    if (token.kind === 'omitted') {
      continue;
    }

    if (token.kind === 'emoji') {
      if (isEmojiAvailable(token.name)) {
        result.push({ kind: 'emoji', name: token.name });
      }

      continue;
    }

    const prev = result[result.length - 1];
    if (prev?.kind === 'text') {
      prev.value += token.value;
    } else {
      result.push({ kind: 'text', value: token.value });
    }
  }

  return result;
}

function normalizeTextContent(
  tokens: readonly NormalizedToken[],
): NormalizedToken[] {
  const result: NormalizedToken[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.kind === 'emoji') {
      result.push(token);
      continue;
    }

    const value = cleanTextValue(
      token.value,
      tokens[i - 1]?.kind === 'emoji',
      tokens[i + 1]?.kind === 'emoji',
    );

    if (value.length > 0) {
      result.push({ kind: 'text', value });
    }
  }

  return result;
}

/**
 * The raw text value from the tokens is cleaned up by collapsing multiple spaces, trimming leading/trailing spaces, and removing spaces around newlines.
 * However, we want to preserve intentional spacing around emojis,
 * so we only trim leading spaces if the previous token is not an emoji, and only trim trailing spaces if the next token is not an emoji.
 */
function cleanTextValue(
  raw: string,
  prevIsEmoji: boolean,
  nextIsEmoji: boolean,
): string {
  let value = raw
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;!?])/g, '$1');

  if (!prevIsEmoji) {
    value = value.replace(/^[ \t]+/, '');
  }

  if (!nextIsEmoji) {
    value = value.replace(/[ \t]+$/, '');
  }

  return value;
}

function splitIntoAtomLines(tokens: readonly NormalizedToken[]): Atom[][] {
  const lines: Atom[][] = [[]];

  for (const token of tokens) {
    if (token.kind === 'emoji') {
      lines[lines.length - 1].push(token);
      continue;
    }

    atomizeText(token.value, lines);
  }

  trimTrailingSpaces(lines[lines.length - 1]);
  return lines;
}

function atomizeText(text: string, lines: Atom[][]): void {
  for (const char of text) {
    if (char === '\n') {
      trimTrailingSpaces(lines[lines.length - 1]);
      lines.push([]);

      continue;
    }

    const kind = char === ' ' || char === '\t' ? 'space' : 'text';
    const current = lines[lines.length - 1];
    const prev = current[current.length - 1];

    if (prev && prev.kind === kind) {
      prev.value += char;
    } else {
      current.push({ kind, value: char });
    }
  }
}

function wrapLines(
  preSplitLines: readonly Atom[][],
  config: InlineLayoutConfig,
): Atom[][] {
  const lines: Atom[][] = [];

  for (const preLine of preSplitLines) {
    wrapSingleLine(preLine, lines, config);
  }

  return lines;
}

function wrapSingleLine(
  atoms: readonly Atom[],
  lines: Atom[][],
  config: InlineLayoutConfig,
): void {
  lines.push([]);
  let lineWidth = 0;

  for (const atom of atoms) {
    switch (atom.kind) {
      case 'emoji':
        lineWidth = placeEmoji(atom, lineWidth, lines, config);
        break;
      case 'space':
        lineWidth = placeSpace(atom, lineWidth, lines, config);
        break;
      case 'text':
        lineWidth = placeText(atom, lineWidth, lines, config);
        break;
    }
  }

  trimTrailingSpaces(lines[lines.length - 1]);
}

function placeEmoji(
  atom: Atom,
  lineWidth: number,
  lines: Atom[][],
  config: InlineLayoutConfig,
): number {
  if (lineWidth > 0 && lineWidth + config.emojiSize > config.maxWidth) {
    lineWidth = pushWrappedLine(lines);
  }

  lines[lines.length - 1].push(atom);
  return lineWidth + config.emojiSize;
}

function placeSpace(
  atom: Atom & { kind: 'space' },
  lineWidth: number,
  lines: Atom[][],
  config: InlineLayoutConfig,
): number {
  if (lines[lines.length - 1].length === 0) {
    return lineWidth;
  }

  const width = config.measure(atom.value);
  if (lineWidth + width > config.maxWidth) {
    return pushWrappedLine(lines);
  }

  lines[lines.length - 1].push(atom);
  return lineWidth + width;
}

function placeText(
  atom: Atom & { kind: 'text' },
  lineWidth: number,
  lines: Atom[][],
  config: InlineLayoutConfig,
): number {
  const width = config.measure(atom.value);

  if (lineWidth === 0 || lineWidth + width <= config.maxWidth) {
    lines[lines.length - 1].push(atom);
    return lineWidth + width;
  }

  if (width > config.maxWidth) {
    return placeWithWordBreak(atom.value, lineWidth, lines, config);
  }

  const newWidth = pushWrappedLine(lines);
  lines[lines.length - 1].push(atom);

  return newWidth + width;
}

function placeWithWordBreak(
  value: string,
  lineWidth: number,
  lines: Atom[][],
  config: InlineLayoutConfig,
): number {
  for (const fragment of breakWord(value, config)) {
    const fw = config.measure(fragment);

    if (lineWidth > 0 && lineWidth + fw > config.maxWidth) {
      lineWidth = pushWrappedLine(lines);
    }

    lines[lines.length - 1].push({ kind: 'text', value: fragment });
    lineWidth += fw;
  }

  return lineWidth;
}

function pushWrappedLine(lines: Atom[][]): number {
  trimTrailingSpaces(lines[lines.length - 1]);
  lines.push([]);

  return 0;
}

/**
 * Builds the final layout segments from the wrapped lines of atoms.
 * Each segment contains its position and unit indexing for text reveal.
 */
function buildSegments(
  lines: readonly Atom[][],
  config: InlineLayoutConfig,
): LayoutModel {
  const { lineHeight, emojiSize, measure } = config;
  const segments: LayoutSegment[] = [];

  let maxWidth = 0;
  let y = 0;
  let unitCursor = 0;

  for (const line of lines) {
    let x = 0;

    for (const atom of line) {
      if (atom.kind === 'emoji') {
        segments.push({
          kind: 'emoji',
          name: atom.name,
          x,
          y: y + (lineHeight - emojiSize) * 0.5,
          unitStart: unitCursor,
        });

        x += emojiSize;
        unitCursor += 1;
      } else {
        const width = measure(atom.value);
        segments.push({
          kind: 'text',
          value: atom.value,
          x,
          y,
          unitStart: unitCursor,
          unitLength: atom.value.length,
        });

        x += width;
        unitCursor += atom.value.length;
      }
    }

    maxWidth = Math.max(maxWidth, x);
    y += lineHeight;
  }

  return {
    segments,
    width: maxWidth,
    height: Math.max(lineHeight, y),
    totalUnits: unitCursor,
  };
}

// helpers
function breakWord(value: string, config: InlineLayoutConfig): string[] {
  const fragments: string[] = [];
  let current = '';

  for (const char of value) {
    const next = current + char;

    if (current.length > 0 && config.measure(next) > config.maxWidth) {
      fragments.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current.length > 0) {
    fragments.push(current);
  }

  return fragments;
}

function trimTrailingSpaces(line: Atom[]): void {
  while (line.length > 0 && line[line.length - 1].kind === 'space') {
    line.pop();
  }
}
