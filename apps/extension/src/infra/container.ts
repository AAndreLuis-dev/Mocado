import { makeFillField } from '../application/fill-field';
import { makeFillForm } from '../application/fill-form';
import { makeHistoryService } from '../application/history';
import type { Deps } from '../application/ports';
import { makePreferences } from '../application/preferences';
import { scriptingPageGateway } from './browser/page-gateway';
import { LocalHistoryRepository } from './storage/history-repository';
import { overridesStore, pinStore, settingsStore } from './storage/stores';

const deps: Deps = {
  page: scriptingPageGateway,
  history: new LocalHistoryRepository(),
  settings: settingsStore,
  overrides: overridesStore,
  pin: pinStore,
  now: Date.now,
};

export const fillForm = makeFillForm(deps);
export const fillField = makeFillField(deps);
export const historyService = makeHistoryService(deps);
export const preferences = makePreferences(deps);
