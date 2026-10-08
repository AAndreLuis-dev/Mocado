import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const e2e = process.env.MOCADO_E2E === '1';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  vite: () => ({ plugins: [tailwindcss()] }),
  outDir: e2e ? '.output/e2e' : '.output',
  zip: {
    artifactTemplate: 'mocado-{{browser}}.zip',
    sourcesTemplate: 'mocado-sources.zip',
    sourcesRoot: resolve(import.meta.dirname, '../..'),
    excludeSources: [
      '**/node_modules/**',
      '**/.output/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'docs/*.gif',
      'apps/playground/**',
    ],
  },
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'pt_BR',
    permissions: ['activeTab', 'scripting', 'storage', 'contextMenus'],
    commands: {
      'fill-form': {
        suggested_key: { default: 'Ctrl+Shift+F', mac: 'Command+Shift+F' },
        description: '__MSG_cmdFillForm__',
      },
      'fill-field': {
        suggested_key: { default: 'Alt+Shift+F', mac: 'Alt+Shift+F' },
        description: '__MSG_cmdFillField__',
      },
    },
    ...(e2e ? { host_permissions: ['http://localhost/*'] } : {}),
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'mocado@mocado.dev',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
