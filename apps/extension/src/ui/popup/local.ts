// Per-viewer popup conveniences (last generator, mask toggle): never required to work.

export const load = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode or blocked storage: fine */
  }
};
