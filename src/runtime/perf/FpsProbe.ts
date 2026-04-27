const FPS_SAMPLE_INTERVAL_MS = 1000;

export class FpsProbe {
  private _fps = 0;

  private frames = 0;
  private elapsed = 0;

  get fps() {
    return this._fps;
  }

  reset() {
    this.frames = 0;
    this.elapsed = 0;
  }

  tick(dt: number) {
    this.frames++;
    this.elapsed += dt;

    if (this.elapsed >= FPS_SAMPLE_INTERVAL_MS) {
      this._fps = Math.round(
        (this.frames * FPS_SAMPLE_INTERVAL_MS) / this.elapsed,
      );
      this.frames = 0;
      this.elapsed = 0;
    }
  }
}
