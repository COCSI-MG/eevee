import { Store } from '@/core/store/store';
import { Transaction } from './transaction/transaction';
import { FileStashSchema, StoreStashSchema } from './store/store-file-schema';
import { FileStashConnectionNotOpenError, FileStashError } from '@/filestash-errors';

interface FileStashOptions {
  indexedDB?: { open: Function };
}

export class FileStash<Schema extends FileStashSchema> {
  private dependencies: {
    indexedDB: IDBFactory;
  };
  private stores: ((transaction: Transaction<Schema>) => void)[];

  idxdb: IDBDatabase;
  storeNames: {
    [name: string]: Store<StoreStashSchema>;
  };

  constructor(
    readonly name: string,
    readonly options?: FileStashOptions
  ) {
    this.name = name;
    this.options = {
      ...options,
    };
    this.dependencies = {
      indexedDB: options.indexedDB as IDBFactory,
    };
    this.idxdb = null;
  }

  makeStores(...stores: ((transaction: Transaction<Schema>) => void)[]) {
    this.stores = stores;
    return {
      open: this.open.bind(this),
    };
  }

  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const { indexedDB } = this.dependencies;
      if (!indexedDB) {
        reject(
          new FileStashError('IndexedDB API is missing', 'IDXDB_API_MISSING')
        );
      }
      const request = indexedDB.open(this.name);
      request.onerror = (event: Event) => {
        event.preventDefault();
        const error =
          (event.target as IDBRequest)?.error ||
          new FileStashError('Unknown IndexedDB error', 'UNKOWN_ERROR');
        reject(error);
      };
      request.onblocked = (event: Event) => {
        console.warn(
          `Database ${this.name} is blocked. Another connection is holding it.`
        );
        reject();
      };
      request.onupgradeneeded = (ev) => {
        const transaction = new Transaction<Schema>(request.transaction!);
        for (const store of this.stores) {
          store(transaction);
        }
        this.idxdb = request.result;
      };
      request.onsuccess = (ev) => {
        this.idxdb = request.result;
        resolve(this.idxdb);
      };
    });
  }

  destructor(): Promise<void> {
    if (!this.idxdb) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      try {
        this.idxdb.close();
        this.idxdb = null;
        resolve();
      } catch (error) {
        console.error(`Error closing database ${this.name}:`, error);
        reject();
      }
    });
  }

  transactionRead<K extends Exclude<keyof Schema, symbol | number>>(
    names: K[]
  ) {
    if (!this.idxdb) {
      throw new FileStashConnectionNotOpenError();
    }
    return new Transaction(
      this.idxdb.transaction(names, 'readonly', {
        durability: 'relaxed',
      })
    ).stores as {
      [StoreName in K]: Store<Schema[StoreName]>;
    };
  }

  transactionWrite<K extends Exclude<keyof Schema, symbol | number>>(
    names: K[],
  ) {
    if (!this.idxdb) {
      throw new FileStashConnectionNotOpenError();
    }
    return new Transaction(
      this.idxdb.transaction(names, 'readwrite', { durability: 'relaxed' })
    );
  }
}
