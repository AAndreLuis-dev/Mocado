export const openHistory = () =>
  browser.tabs.create({ url: browser.runtime.getURL('/history.html') });

export const openOptions = () => browser.runtime.openOptionsPage();

export const activeTabId = async () =>
  (await browser.tabs.query({ active: true, currentWindow: true }))[0]?.id;

export const shortcuts = () => browser.commands.getAll();
