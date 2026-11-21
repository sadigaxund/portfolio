import type { ReactElement, ReactNode } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { Dot, LEVELS, levelOf, text } from './levels';

/**
 * `::cv_skill[Spark]{level=work used="KDM Force, Aqueduct"}`: one tool with a dot for
 * how deep it went. With `used`, the tool opens to show where it was used.
 */
export function Skill({ attributes, children }: MarkComponentProps): ReactElement {
  const level = levelOf(attributes?.level);
  const used = text(attributes?.used);
  const label: ReactNode = (
    <>
      <Dot level={level} />
      <span className="mk-cv_skill__name">{children}</span>
      <span className="mk-cv_skill__level">{LEVELS[level]}</span>
    </>
  );
  if (used === undefined) return <div className="mk-cv_skill">{label}</div>;
  return (
    <details className="mk-cv_skill mk-cv_skill--used">
      <summary>{label}</summary>
      <p className="mk-cv_skill__used">{used}</p>
    </details>
  );
}

