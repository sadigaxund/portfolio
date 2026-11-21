import type { ReactElement } from 'react';
import './stack.css';

export const LEVELS = {
  work: 'Used at work',
  project: 'Built a project with it',
  studied: 'Studied',
} as const;

export type Level = keyof typeof LEVELS;

export const text = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined);
export const levelOf = (value: unknown): Level => (text(value) ?? 'studied') in LEVELS ? ((text(value) ?? 'studied') as Level) : 'studied';

export function Dot({ level }: { level: Level }): ReactElement {
  return <span className={`mk-cv_dot mk-cv_dot--${level}`} aria-hidden="true" />;
}

