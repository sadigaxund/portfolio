/** Tracks every running animation of a walk, so a new walk can cancel them all at once. */
export interface Runner {
  play(element: Element, frames: Keyframe[] | PropertyIndexedKeyframes, timing: KeyframeAnimationOptions): Promise<unknown>;
  /** Starts an animation that the caller needs to read while it runs. */
  start(element: Element, frames: Keyframe[] | PropertyIndexedKeyframes, timing: KeyframeAnimationOptions): Animation;
  cancel(): void;
}

export function createRunner(): Runner {
  const running = new Set<Animation>();
  return {
    play(element, frames, timing) {
      const animation = this.start(element, frames, timing);
      return animation.finished.then(() => running.delete(animation));
    },
    start(element, frames, timing) {
      const animation = element.animate(frames, timing);
      running.add(animation);
      return animation;
    },
    cancel() {
      for (const animation of running) animation.cancel();
      running.clear();
    },
  };
}
