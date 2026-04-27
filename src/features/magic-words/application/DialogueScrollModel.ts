export interface DialogueScrollThumbState {
  visible: boolean;
  height: number;
  progress: number;
}

export class DialogueScrollModel {
  private offset = 0;
  private contentHeight = 0;
  private viewportHeight = 0;

  get currentOffset(): number {
    return this.offset;
  }

  get hasOverflow(): boolean {
    return this.maxScroll > 0;
  }

  get maxScroll(): number {
    return Math.max(0, this.contentHeight - this.viewportHeight);
  }

  setContentHeight(height: number): void {
    this.contentHeight = Math.max(0, height);
    this.offset = this.clampOffset(this.offset);
  }

  setViewportHeight(height: number): void {
    this.viewportHeight = Math.max(0, height);
    this.offset = this.clampOffset(this.offset);
  }

  setOffset(nextOffset: number): number {
    this.offset = this.clampOffset(nextOffset);
    return this.offset;
  }

  getThumbState(minThumbHeight: number): DialogueScrollThumbState {
    if (
      !this.hasOverflow ||
      this.viewportHeight <= 0 ||
      this.contentHeight <= 0
    ) {
      return { visible: false, height: 0, progress: 0 };
    }

    const ratio = this.viewportHeight / this.contentHeight;
    const height = Math.max(minThumbHeight, this.viewportHeight * ratio);
    const progress = this.maxScroll === 0 ? 0 : this.offset / this.maxScroll;

    return { visible: true, height, progress };
  }

  private clampOffset(nextOffset: number): number {
    return Math.max(0, Math.min(nextOffset, this.maxScroll));
  }
}
