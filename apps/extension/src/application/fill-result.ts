export type FillResult =
  | { ok: true; filled: number; error?: undefined }
  | { ok: false; error: FillError; filled?: undefined };

export type FillError = 'blocked' | 'no-field' | (string & {});
