// Fails the build if the injected script (runs inside every page we fill) grows past its budget.
import { statSync } from 'node:fs';

const BUDGET = 25_000;
for (const browser of ['chrome-mv3', 'firefox-mv3']) {
  const { size } = statSync(new URL(`../.output/${browser}/injected.js`, import.meta.url));
  console.log(
    `${browser}/injected.js: ${(size / 1000).toFixed(1)} kB (budget ${BUDGET / 1000} kB)`,
  );
  if (size > BUDGET) process.exit(1);
}
