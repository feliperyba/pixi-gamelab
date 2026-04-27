export class FullscreenController {
  private _isFullscreen = false;

  private readonly handleFullscreenChange = () => {
    this._isFullscreen = !!document.fullscreenElement;
  };

  get isFullscreen() {
    return this._isFullscreen;
  }

  init() {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  dispose() {
    document.removeEventListener(
      'fullscreenchange',
      this.handleFullscreenChange,
    );
  }

  async request() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  }
}
