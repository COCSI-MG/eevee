import { StoreStashSchema } from './store-file-schema';
import { stashResponse } from '../response/index';
import { isStorageUsageHigherThan90Percent } from '@/helpers/storage-quota.helper';

export class Store<Schema extends StoreStashSchema> {
  constructor(private readonly store: IDBObjectStore) {}

  createIndex(name: string, path = [] as string[]) {
    return this.store.createIndex(name, path);
  }

  dropIndex(name: string) {
    return this.store.deleteIndex(name);
  }

  async save(fileData: Schema['Schema'], key?: Schema['Key']) {
    if (this.store.transaction.mode !== 'readwrite') {
      throw new Error(
        `Transaction is not set to readwrite - transaction mode ${this.store.transaction.mode}`
      );
    }
    const storageQuotaIsHigh = await isStorageUsageHigherThan90Percent();
    if (storageQuotaIsHigh) {
      throw new Error('Storage not avaliable to add file');
    }
    //TODO: check file size
    if (typeof fileData.data !== 'string') {
    }
    const request = this.store.add(fileData, key);
    return stashResponse<Schema['Key']>(request);
  }

  async get(key: Schema['Key']) {
    if (this.store.transaction.mode !== "readonly") {
      throw new Error(
        `Transaction is not set to readonly mode - transaction mode ${this.store.transaction.mode}`
      )
    }
    const request = this.store.get(key);
    return stashResponse<Schema['Schema']>(request as IDBRequest<Schema['Schema']>);
  }

  async destroy(key: Schema['Key']) {
    const request = this.store.delete(key);
    return stashResponse(request);
  }

  async clear() {
    return stashResponse(this.store.clear());
  }
}
