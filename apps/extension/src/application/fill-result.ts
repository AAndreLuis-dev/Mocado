/** Result of a fill as seen by the UI (popup) and returned by the background. */
export type FillResult =
  | { ok: true; filled: number; error?: undefined }
  | { ok: false; error: FillError; filled?: undefined };

/** 'blocked' and 'no-field' are expected; anything else is an unexpected error message. */
export type FillError = 'blocked' | 'no-field' | (string & {});
