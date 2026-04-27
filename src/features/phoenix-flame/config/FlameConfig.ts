export interface FlameConfig {
  maxParticles: number;
  intensity: number;
  flameHeight: number;
  flameWidth: number;
  flameSize: number;
  flameSpeed: number;
  flameLifetime: number;
  coreStrength: number;
  turbulence: number;
  warmth: number;
  smokeAmount: number;
  smokeSize: number;
  smokeOpacity: number;
  smokeSpread: number;
  smokeSpeed: number;
  smokeLifetime: number;
  emberAmount: number;
  emberSize: number;
  emberSpeed: number;
  emberLifetime: number;
}

export function createDefaultFlameConfig(): FlameConfig {
  return {
    maxParticles: 10,
    intensity: 1.0,
    flameHeight: 0.15,
    flameWidth: 0.0,
    flameSize: 0.5,
    flameSpeed: 0.0,
    flameLifetime: 0.5,
    coreStrength: 0.45,
    turbulence: 0.05,
    warmth: 0.25,
    smokeAmount: 1.0,
    smokeSize: 0.1,
    smokeOpacity: 1.0,
    smokeSpread: 0.0,
    smokeSpeed: 1.0,
    smokeLifetime: 1.0,
    emberAmount: 1.0,
    emberSize: 0.25,
    emberSpeed: 0.4,
    emberLifetime: 0.7,
  };
}
