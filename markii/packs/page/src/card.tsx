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

const CHEVRON = {
  prev: 'M10 3 5 8l5 5',
  next: 'M6 3l5 5-5 5',
} as const;

/**
 * The card both `page_prev` and `page_next` draw: an optional still, a label
 * with a chevron, and the body. The link inside the body is ordinary Markdown,
 * so the host resolves its address. Its anchor is stretched over the card in
 * CSS, which makes the whole card one tab stop.
 */
export function PageCard({ direction, label, attributes, children, resolveImageSrc }: MarkComponentProps & { direction: 'prev' | 'next'; label: string }): ReactElement {
  const img = typeof attributes?.img === 'string' && attributes.img.trim() !== '' ? attributes.img.trim() : undefined;
  const chevron = (
    <svg className="mk-page_card__chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d={CHEVRON[direction]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <div className={`mk-page_card-wrap mk-page_${direction}`}>
      <div className={img === undefined ? 'mk-page_card' : 'mk-page_card mk-page_card--still'}>
        {img !== undefined && (
          <div className="mk-page_card__still">
            <img src={stillSource(img, resolveImageSrc)} alt="" loading="lazy" decoding="async" />
          </div>
        )}
        <div className="mk-page_card__text">
          <span className="mk-page_card__label">
            {direction === 'prev' && chevron}
            {label}
            {direction === 'next' && chevron}
          </span>
          <div className="mk-page_card__body">{children}</div>
        </div>
      </div>
    </div>
  );
}
