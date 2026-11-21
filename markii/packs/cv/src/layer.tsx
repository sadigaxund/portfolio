import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { text } from './levels';

/**
 * `:::cv_layer{name=Process}` around `::cv_skill` lines: one layer of a stack,
 * its name on the left and its tools on the right.
 */
export function Layer({ attributes, children }: MarkComponentProps): ReactElement {
  const name = text(attributes?.name) ?? '';
  return (
    <section className="mk-cv_layer" aria-label={name}>
      <h3 className="mk-cv_layer__name">{name}</h3>
      <div className="mk-cv_layer__tools">{children}</div>
    </section>
  );
}

