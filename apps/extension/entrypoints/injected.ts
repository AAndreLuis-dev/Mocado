import type { MocadoApi } from '@/src/content/api';
import { createPageApi } from '@/src/content/page';

export default defineUnlistedScript(() => {
  const g = globalThis as typeof globalThis & { __mocado?: MocadoApi };
  g.__mocado ??= createPageApi();
});
