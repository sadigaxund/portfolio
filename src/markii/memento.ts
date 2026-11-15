import type { GrantMemento, Thenable } from "@markii/host";

const PREFIX = "markii:";

/** Device-local memory in localStorage. A blocked or full store degrades to no memory and never throws. */
export function createLocalStorageMemento(): GrantMemento {
  return {
    get<T>(key: string, defaultValue?: T): T {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw !== null) return JSON.parse(raw) as T;
      } catch {
        // fall through to the default
      }
      return defaultValue as T;
    },
    update(key: string, value: unknown): Thenable<void> {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        // no memory this time
      }
      return Promise.resolve();
    },
  };
}

/** The same contract in memory, for tests that have no localStorage. */
export function createMemoryMemento(): GrantMemento {
  const map = new Map<string, unknown>();
  return {
    get<T>(key: string, defaultValue?: T): T {
      return (map.has(key) ? map.get(key) : defaultValue) as T;
    },
    update(key: string, value: unknown): Thenable<void> {
      map.set(key, value);
      return Promise.resolve();
    },
  };
}
