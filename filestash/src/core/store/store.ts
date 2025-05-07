import { StoreStashSchema } from './store-file-schema';
import { stashResponse } from '../response/index';
import { isStorageUsageHigherThan90Percent } from '@/helpers/storage-quota.helper';
import { isFileSizeLowerThanMaxSizeAllowed } from '@/helpers/validate-data-size.helper';
import { StoreError } from '@/filestash-errors';

export class Store<Schema extends StoreStashSchema> {
  constructor(private readonly store: IDBObjectStore) {}

  createIndex(name: string, path = [] as string[]) {
    return this.store.createIndex(name, path);
  }

  dropIndex(name: string) {
    return this.store.deleteIndex(name);
  }

  async upsert(fileData: Schema['Schema'], key?: Schema['Key']) {
    if (this.store.transaction.mode !== 'readwrite') {
      throw new StoreError(
        `Transaction is not set to readwrite - transaction mode ${this.store.transaction.mode}`
      );
    }
    const [ result, err ] = await isStorageUsageHigherThan90Percent();
    if (result && err) {
      throw new StoreError(err);
    }
    if (!isFileSizeLowerThanMaxSizeAllowed(fileData.data)) {
      throw new StoreError('File Size is higher than 5MB');
    }
    const request = this.store.put(fileData, key);
    return stashResponse<Schema['Key']>(request);
  }

  async get(key: Schema['Key']) {
    if (this.store.transaction.mode !== "readonly") {
      throw new StoreError(
        `Transaction is not set to readonly mode - transaction mode ${this.store.transaction.mode}`
      )
    }
    const request = this.store.get(key);
    return stashResponse<Schema['Schema']>(request as IDBRequest<Schema['Schema']>);
  }

  async destroy(key: Schema['Key']) {
    const request = this.store.delete(key);
    return stashResponse<void>(request);
  }

  async clear() {
    return stashResponse(this.store.clear());
  }

  async count() {
    const request = this.store.count();
    return stashResponse<number>(request);
  }
}
