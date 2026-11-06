/** A line of text with an optional measured result set apart inside it. */
export interface TimelineResult {
  before: string;
  result?: string;
  after?: string;
}

export interface TimelineEntry {
  when: string;
  title: string;
  role?: string;
  results?: TimelineResult[];
  stack?: string;
}
