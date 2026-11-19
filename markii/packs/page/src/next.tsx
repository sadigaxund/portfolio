import type { ReactElement } from 'react';
import type { MarkComponentProps } from '@markii/react';
import './pager.css';

/** The still's address: the host resolver's answer, or the path as written when it has none or throws. */
function stillSource(path: string, resolve: MarkComponentProps['resolveImageSrc']): string {
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
 * `:::page_next{img=images/thumb.webp}` with a link line and one preview
 * paragraph as the body: a wide card for the next page. The link inside is
 * ordinary Markdown, so the host resolves its address. Its anchor is
 * stretched over the card in CSS, which makes the whole card one tab stop.
 */
export function Next({ attributes, children, resolveImageSrc }: MarkComponentProps): ReactElement {
  const img = typeof attributes?.img === 'string' && attributes.img.trim() !== '' ? attributes.img.trim() : undefined;
  return (
    <div className="mk-page_next">
      <div className={img === undefined ? 'mk-page_next__card' : 'mk-page_next__card mk-page_next__card--still'}>
        {img !== undefined && (
          <div className="mk-page_next__still">
            <img src={stillSource(img, resolveImageSrc)} alt="" loading="lazy" decoding="async" />
          </div>
        )}
        <div className="mk-page_next__text">
          <span className="mk-page_next__label">Next</span>
          <div className="mk-page_next__body">{children}</div>
        </div>
      </div>
    </div>
  );
}
