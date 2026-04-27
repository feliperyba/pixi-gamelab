interface RGB {
  r: number;
  g: number;
  b: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * clamp01(amount);
}

export function extractRGB(tint: number): RGB {
  return {
    r: (tint >> 16) & 0xff,
    g: (tint >> 8) & 0xff,
    b: tint & 0xff,
  };
}

export function lerpColor(from: number, to: number, amount: number): number {
  const t = clamp01(amount);

  const { r: r1, g: g1, b: b1 } = extractRGB(from);
  const { r: r2, g: g2, b: b2 } = extractRGB(to);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return (r << 16) | (g << 8) | b;
}

export function toHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

export function easePower5InOut(t: number): number {
  if (t <= 0) {
    return 0;
  }

  if (t >= 1) {
    return 1;
  }

  const t2 = t * 2;

  if (t2 < 1) {
    return 0.5 * t2 * t2 * t2 * t2 * t2;
  }

  return 0.5 * ((t2 - 2) ** 5 + 2);
}
