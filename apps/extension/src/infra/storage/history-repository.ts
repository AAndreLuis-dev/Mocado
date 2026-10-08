import type { HistoryRepository } from '../../application/ports';
import type { HistoryRecord } from '../../domain/profile';

const KEY = 'history';

export class LocalHistoryRepository implements HistoryRepository {
  async all(): Promise<HistoryRecord[]> {
    const { [KEY]: list } = await browser.storage.local.get(KEY);
    return Array.isArray(list) ? (list as HistoryRecord[]) : [];
  }

  async get(id: string) {
    return (await this.all()).find((r) => r.id === id);
  }

  async save(record: HistoryRecord) {
    const rest = (await this.all()).filter((r) => r.id !== record.id);
    await this.replaceAll([record, ...rest]);
  }

  async update(id: string, patch: Partial<Omit<HistoryRecord, 'id'>>) {
    await this.replaceAll((await this.all()).map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async remove(id: string) {
    await this.replaceAll((await this.all()).filter((r) => r.id !== id));
  }

  async replaceAll(records: HistoryRecord[]) {
    await browser.storage.local.set({ [KEY]: records });
  }
}
