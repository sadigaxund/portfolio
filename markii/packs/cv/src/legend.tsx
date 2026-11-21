import type { ReactElement } from 'react';
import { Dot, LEVELS, type Level } from './levels';

/** `::cv_legend`: what each dot means. */
export function Legend(): ReactElement {
  return (
    <ul className="mk-cv_legend">
      {(Object.keys(LEVELS) as Level[]).map((level) => (
        <li key={level}>
          <Dot level={level} />
          {LEVELS[level]}
        </li>
      ))}
    </ul>
  );
}
