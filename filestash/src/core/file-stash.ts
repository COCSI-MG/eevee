import { Store } from '@/core/store/store';
import { Transaction } from './transaction/transaction';
import { FileStashSchema, StoreStashSchema } from './store/store-file-schema';
import {
  FileStashError,
} from '@/filestash-errors';

interface FileStashOptions {
  version: number;
  indexedDB?: { open: Function };
}

export class FileStash<Schema extends FileStashSchema> {
  private options: FileStashOptions;
  private dependencies: {
    indexedDB: IDBFactory;
  };

  idxdb: IDBDatabase;
  storeNames: {
    [name: string]: Store<StoreStashSchema>;
  };
  private _stores: ((transaction: Transaction<Schema>) => void)[];

  constructor(
    readonly name: string,
    options: FileStashOptions,
    ..._stores: ((transaction: Transaction<Schema>) => void)[]
  ) {
    this.name = name;
    this.options = {
      ...options,
    };
    this.dependencies = {
      indexedDB: options.indexedDB as IDBFactory,
    };
    this.idxdb = null;
    this._stores = _stores;
  }

  async open() {
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
        for (const store of this._stores) {
          store(transaction);
        }
        this.idxdb = request.result;
      };
      request.onsuccess = (ev) => {
        this.idxdb = request.result;
        resolve(this.idxdb);
      }
    });
  }

  destructor(): Promise<void> {
    if (!this.idxdb) {
      return;
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
    names: K[],
  ) {
    return new Transaction(
      this.idxdb.transaction(names, "readonly", {
        durability: 'relaxed',
      })
    ).stores as {
      [StoreName in K]: Store<Schema[StoreName]>;
    };
  }

  transactionWrite<K extends Exclude<keyof Schema, symbol | number>>(
    names: K[]
  ) {
    return new Transaction(
      this.idxdb.transaction(names, 'readwrite', { durability: 'relaxed' })
    );
  }
}
