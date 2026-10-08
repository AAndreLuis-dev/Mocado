import type { MocadoApi } from '@/src/content/api';
import { createPageApi } from '@/src/content/page';

// Injected on demand (activeTab): never declared in the manifest, so it never runs on its own.
export default defineUnlistedScript(() => {
  const g = globalThis as typeof globalThis & { __mocado?: MocadoApi };
  g.__mocado ??= createPageApi(); // already injected in this tab → keep its state
});
