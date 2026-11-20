import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './pager.css';

/**
 * `::page_back[Projects](../projects)`: one quiet line leading back to the
 * parent page, an arrow and the parent's name. "Back to" is for screen readers only. The bracket content is the link, rendered by Markii, so the
 * host resolves its address. The arrow is an inline SVG that follows the
 * text color.
 */
export function Back({ children }: MarkComponentProps): ReactElement {
  return (
    <p className="mk-page_back">
      <svg className="mk-page_back__arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="mk-page_back__label">Back to</span>
      <span className="mk-page_back__name">{children}</span>
    </p>
  );
}
