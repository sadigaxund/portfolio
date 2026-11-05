import { useEffect, useRef } from "react";
import { Link } from "my-you-eye";
import { chosenFor, mountLine, type ForkOption } from "./controller";
import { DIRECTIONS } from "./geometry";

export interface LineStageProps {
  rootHref: string;
  options: ForkOption[];
  initialPath: string;
}

export default function LineStage({ rootHref, options, initialPath }: LineStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const initialChosen = chosenFor(options, initialPath);

  useEffect(() => {
    if (!stageRef.current || !probeRef.current) return;
    return mountLine(stageRef.current, probeRef.current, options, initialChosen);
  }, [initialChosen, options]);

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
          {options.map((option) => (
            <div
              key={option.direction}
              data-option={option.direction}
              className="line-option"
              style={{
                "--option-dir": option.direction,
                visibility: initialChosen === null ? "visible" : "hidden",
              } as React.CSSProperties}
            >
              <Link href={option.href}>{option.label}</Link>
            </div>
          ))}
        </nav>
      </div>
      <div
        data-back
        className="line-back"
        style={{ opacity: progress, visibility: progress > 0 ? "visible" : "hidden" }}
      >
        <Link href={rootHref}>Back</Link>
      </div>
    </div>
  );
}
