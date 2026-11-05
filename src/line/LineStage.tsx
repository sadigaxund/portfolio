import { useEffect, useRef } from "react";
import { Link } from "my-you-eye";
import type { Direction } from "../tree/tree";
import { BRANCHES, nodeAt, ROOT } from "../tree/walk";
import { mountLine } from "./controller";
import { DIRECTIONS } from "./geometry";
import { mountIntent } from "./intent";

export interface LineStageProps {
  initialPath: string;
}

export default function LineStage({ initialPath }: LineStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const initialNode = nodeAt(initialPath);
  const initialChosen: Direction | null = initialNode?.direction ?? null;

  useEffect(() => {
    if (!stageRef.current || !probeRef.current) return;
    const stopLine = mountLine(stageRef.current, probeRef.current, initialChosen);
    const stopIntent = mountIntent();
    return () => {
      stopLine();
      stopIntent();
    };
  }, [initialChosen]);

  const progress = initialChosen === null ? 0 : 1;
  return (
    <div
      ref={stageRef}
      className="line-stage"
      style={{ "--line-p": progress, "--line-dir": initialChosen ?? 0 } as React.CSSProperties}
    >
      <div ref={probeRef} className="line-probe" aria-hidden="true">
        <div className="line-probe-stem" />
        <div className="line-probe-lift" />
      </div>
      <div className="line-world">
        <div className="line-trunk" aria-hidden="true" />
        <svg className="line-fork" aria-hidden="true">
          {DIRECTIONS.map((direction) => (
            <path key={direction} data-branch={direction} pathLength={1} className="line-path" />
          ))}
        </svg>
        <div className="line-tail" aria-hidden="true" />
        <nav aria-label="Paths">
          {BRANCHES.map((branch) => (
            <div
              key={branch.direction}
              data-option={branch.direction}
              className="line-option"
              style={{
                "--option-dir": branch.direction,
                visibility: initialChosen === null ? "visible" : "hidden",
              } as React.CSSProperties}
            >
              <Link href={branch.url}>{branch.label}</Link>
            </div>
          ))}
        </nav>
      </div>
      <div
        data-back
        className="line-back"
        style={{ opacity: progress, visibility: progress > 0 ? "visible" : "hidden" }}
      >
        <Link href={(initialNode?.parent ?? ROOT).url}>Back</Link>
      </div>
    </div>
  );
}
