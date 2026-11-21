import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './cv.css';

/** The logo's address: the host resolver's answer, or the path as written when it has none or throws. */
function logoSource(path: string, resolve: MarkComponentProps['resolveImageSrc']): string {
  try {
    const answer = resolve?.(path);
    if (typeof answer === 'string') return answer;
    if (answer !== undefined) return answer.src;
  } catch {
    // A throwing resolver is treated like one with no answer.
  }
  return path;
}

/**
 * `:::cv_entry{logo=images/logo-kdm.webp}` around a heading, a role line, and bullets.
 * The logo sits in a rail on the left. The rail's line runs down to the next entry,
 * so a run of entries reads as a timeline. The Markdown inside is rendered by Markii.
 */
export function Entry({ attributes, children, resolveImageSrc }: MarkComponentProps): ReactElement {
  const logo = typeof attributes?.logo === 'string' && attributes.logo.trim() !== '' ? attributes.logo.trim() : undefined;
  return (
    <div className="mk-cv_entry">
      <div className="mk-cv_entry__rail">
        {logo === undefined ? (
          <span className="mk-cv_entry__dot" aria-hidden="true" />
        ) : (
          <img className="mk-cv_entry__logo" src={logoSource(logo, resolveImageSrc)} alt="" width="48" height="48" loading="lazy" decoding="async" />
        )}
      </div>
      <div className="mk-cv_entry__body">{children}</div>
    </div>
  );
}
