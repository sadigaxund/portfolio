import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './pager.css';

/**
 * `:::page_links` around a Markdown list of links: the list shows as a row of
 * chips, such as Repository and Demo. Markii renders the links, so the host
 * resolves their addresses. Each chip is at least 44px tall.
 */
export function Links({ children }: MarkComponentProps): ReactElement {
  return <div className="mk-page_links">{children}</div>;
}
