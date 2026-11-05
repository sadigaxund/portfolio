import { ROOT } from "../tree/walk";
import { retraction } from "./geometry";
import type { Runner } from "./runner";
import type { Scene } from "./scene";
import type { Step } from "./walkPlan";

export const CLEAR_MS = 240;
const PAN_MS = 800;
const DRAW_MS = 520;

function announce(stage: HTMLElement, name: string, detail: object): void {
  stage.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
}

function levelOf(scene: Scene, step: Step) {
  return scene.levels().find((level) => level.node === step.node);
}

function setRun(run: HTMLElement, scale: number): string {
  run.style.transform = `scaleY(${scale})`;
  return `scaleY(${scale})`;
}

/** The three moves of every step: clear what leaves, pan the camera, draw what arrives. */
export function createSteps(stage: HTMLElement, scene: Scene, runner: Runner, ease: string) {
  const motion = (speed: number, duration: number) => ({ duration: duration * speed, easing: ease });

  /** Moves a fork path to its retraction, a stop's run to its length, and the like. */
  const clearStep = (step: Step, speed: number): Promise<unknown> => {
    const timing = motion(speed, CLEAR_MS);
    if (step.kind === "up") {
      const level = levelOf(scene, step)!;
      const from = new DOMMatrix(getComputedStyle(level.run).transform).d;
      return runner.play(level.run, { transform: [`scaleY(${from})`, setRun(level.run, 0)] }, timing);
    }
    if (step.node.parent === ROOT) {
      scene.walked = [step.node];
      scene.aim();
      const parts: Promise<unknown>[] = [runner.play(scene.back, { opacity: [0, 1] }, timing)];
      scene.back.style.opacity = "1";
      scene.back.style.visibility = "visible";
      for (const { direction, path, label } of scene.branches) {
        const end = retraction(step.node.direction, direction, 1);
        if (end > 0) {
          path.style.strokeDashoffset = String(end);
          parts.push(runner.play(path, { strokeDashoffset: ["0", String(end)] }, timing));
        }
        if (label) {
          label.style.opacity = "0";
          parts.push(runner.play(label, { opacity: [1, 0] }, timing).then(() => (label.style.visibility = "hidden")));
        }
      }
      return Promise.all(parts);
    }
    const parent = scene.levels().find((level) => level.node === step.node.parent)!;
    scene.addLevel(step.node);
    scene.aim();
    const cut = levelOf(scene, { kind: "up", node: step.node.parent! })!.cut!;
    const length = parseFloat(parent.run.style.height) || 1;
    return runner.play(parent.run, { transform: ["scaleY(1)", setRun(parent.run, cut / length)] }, timing);
  };

  const panStep = (step: Step, speed: number, compensate: number): Promise<unknown> => {
    const before = new DOMMatrix(getComputedStyle(stage.querySelector(".line-world")!).transform);
    scene.focus += step.kind === "down" ? 1 : -1;
    scene.aim();
    const world = stage.querySelector(".line-world")!;
    const after = getComputedStyle(world).transform;
    before.f += compensate;
    const timing = motion(speed, PAN_MS);
    const pan = runner.start(world, { transform: [before.toString(), after] }, timing);
    announce(stage, "line:transition-start", {
      from: step.kind === "down" ? 0 : 1,
      to: scene.focus > 0 ? 1 : 0,
      seconds: timing.duration / 1000,
      chosen: scene.walked[0]?.direction ?? null,
      measure: scene.measure(),
      progress: () => {
        const done = pan.effect?.getComputedTiming().progress ?? 1;
        return step.kind === "down" ? done : 1 - done;
      },
    });
    return pan.finished;
  };

  /** Draws what the step leaves behind once the camera has arrived. */
  const growStep = (step: Step, speed: number): Promise<unknown> => {
    const timing = motion(speed, DRAW_MS);
    if (step.kind === "down") {
      const level = levelOf(scene, step)!;
      return runner.play(level.run, { transform: ["scaleY(0)", setRun(level.run, 1)] }, timing);
    }
    if (step.node.parent === ROOT) {
      const chosen = step.node.direction;
      const parts: Promise<unknown>[] = [];
      for (const { direction, path, label } of scene.branches) {
        const start = retraction(chosen, direction, 1);
        if (start > 0) {
          path.style.strokeDashoffset = "0";
          parts.push(runner.play(path, { strokeDashoffset: [String(start), "0"] }, timing));
        }
        if (label) {
          label.style.visibility = "visible";
          label.style.opacity = "1";
          parts.push(runner.play(label, { opacity: [0, 1] }, { ...timing, delay: timing.duration * 0.5, fill: "backwards" }));
        }
      }
      scene.back.style.opacity = "0";
      parts.push(runner.play(scene.back, { opacity: [1, 0] }, timing).then(() => (scene.back.style.visibility = "hidden")));
      return Promise.all(parts).then(() => {
        scene.walked = [];
        scene.aim();
      });
    }
    const parent = scene.levels().find((level) => level.node === step.node.parent)!;
    const from = new DOMMatrix(getComputedStyle(parent.run).transform).d;
    const grown = runner.play(parent.run, { transform: [`scaleY(${from})`, setRun(parent.run, 1)] }, timing);
    scene.dropLevel(step.node);
    scene.aim();
    return grown;
  };

  return { clearStep, panStep, growStep };
}
