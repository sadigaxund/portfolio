import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import { PageCard } from './card';

/** `:::page_prev{img=images/thumb.webp}` with a link line: the card for the preceding page. */
export function Prev(props: MarkComponentProps): ReactElement {
  return <PageCard {...props} direction="prev" label="Previous" />;
}
