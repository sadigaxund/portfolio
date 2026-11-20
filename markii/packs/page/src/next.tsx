import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { PageCard } from './card';

/**
 * `:::page_next{img=images/thumb.webp}` with a link line, and a preview
 * paragraph when the card spans the column: the card for the following page.
 */
export function Next(props: MarkComponentProps): ReactElement {
  return <PageCard {...props} direction="next" label="Next" />;
}
