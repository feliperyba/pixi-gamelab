interface ViewportSpec {
  readonly width: number;
  readonly height: number;
  readonly maxResolution: number;
}

export interface Viewport {
  readonly width: number;
  readonly height: number;
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scale: number;
}

export const GAME_VIEWPORT: ViewportSpec = {
  width: 1920,
  height: 1080,
  maxResolution: 3,
};

export class ViewportService {
  private readonly spec: ViewportSpec;

  constructor(spec: ViewportSpec) {
    this.spec = spec;
  }

  resolveRenderResolution(devicePixelRatio: number): number {
    if (!Number.isFinite(devicePixelRatio) || devicePixelRatio <= 0) {
      return 1;
    }

    return Math.min(devicePixelRatio, this.spec.maxResolution);
  }

  resolve(screenWidth: number, screenHeight: number): Viewport {
    return this.fitViewport(this.spec, screenWidth, screenHeight);
  }

  private fitViewport(
    spec: ViewportSpec,
    screenWidth: number,
    screenHeight: number,
  ): Viewport {
    const safeWidth = Math.max(screenWidth, 1);
    const safeHeight = Math.max(screenHeight, 1);

    const scale = Math.min(safeWidth / spec.width, safeHeight / spec.height);
    const contentWidth = spec.width * scale;
    const contentHeight = spec.height * scale;

    return {
      width: spec.width,
      height: spec.height,
      screenWidth: safeWidth,
      screenHeight: safeHeight,
      offsetX: Math.round((safeWidth - contentWidth) * 0.5),
      offsetY: Math.round((safeHeight - contentHeight) * 0.5),
      scale,
    };
  }
}
