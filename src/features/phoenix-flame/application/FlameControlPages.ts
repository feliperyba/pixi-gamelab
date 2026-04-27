import type { FlameConfig } from '../config/FlameConfig';

export interface SliderControl {
  label: string;
  min: number;
  max: number;
  step: number;
  readValue: () => number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export interface ControlPage {
  label: string;
  note: string;
  controls: SliderControl[];
}

type SliderDef = [label: string, key: keyof FlameConfig];

const FLAME_SLIDERS: SliderDef[] = [
  ['Amount', 'intensity'],
  ['Height', 'flameHeight'],
  ['Spread', 'flameWidth'],
  ['Opacity', 'coreStrength'],
  ['Rotation', 'turbulence'],
  ['Warmth', 'warmth'],
  ['Size', 'flameSize'],
  ['Speed', 'flameSpeed'],
  ['Lifetime', 'flameLifetime'],
];

const SMOKE_SLIDERS: SliderDef[] = [
  ['Amount', 'smokeAmount'],
  ['Size', 'smokeSize'],
  ['Opacity', 'smokeOpacity'],
  ['Spread', 'smokeSpread'],
  ['Speed', 'smokeSpeed'],
  ['Lifetime', 'smokeLifetime'],
];

const EMBER_SLIDERS: SliderDef[] = [
  ['Amount', 'emberAmount'],
  ['Size', 'emberSize'],
  ['Speed', 'emberSpeed'],
  ['Lifetime', 'emberLifetime'],
];

export function buildFlameControlPages(config: FlameConfig): ControlPage[] {
  const pctSliders = (defs: SliderDef[]): SliderControl[] =>
    defs.map(([label, key]) => ({
      label,
      min: 0,
      max: 1,
      step: 0.01,
      readValue: () => config[key] as number,
      onChange: (v: number) => {
        (config as Record<keyof FlameConfig, number>)[key] = v;
      },
      formatValue: (v: number) => `${Math.round(v * 100)}%`,
    }));

  return [
    {
      label: 'Flame',
      note: 'Shape, brightness and color of the fire body.',
      controls: pctSliders(FLAME_SLIDERS),
    },
    {
      label: 'Smoke',
      note: 'Atmospheric haze rising above the flame.',
      controls: pctSliders(SMOKE_SLIDERS),
    },
    {
      label: 'Embers',
      note: 'Sparks and glowing particles kicked from the fire.',
      controls: pctSliders(EMBER_SLIDERS),
    },
  ];
}
