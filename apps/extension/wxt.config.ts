import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

const e2e = process.env.MASSA_E2E === '1';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  vite: () => ({ plugins: [tailwindcss()] }),
  outDir: e2e ? '.output/e2e' : '.output',
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'pt_BR',
    permissions: ['activeTab', 'scripting', 'storage', 'contextMenus'],
    // e2e only: Playwright cannot press extension shortcuts, so tests inject via host permission.
    ...(e2e ? { host_permissions: ['http://localhost/*'] } : {}),
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'massa@massa.dev',
          strict_min_version: '140.0',
          // Nothing leaves the browser: declare no data collection (AMO requirement).
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
