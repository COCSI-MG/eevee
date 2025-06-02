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
  private options: FileStashOptions;
  private versionNumber: number;

  idxdb: IDBDatabase;
  storeNames: {
    [name: string]: Store<StoreStashSchema>;
  };

  constructor(
    readonly name: string,
    options?: FileStashOptions
  ) {
    this.name = name;
    this.options = options = {
      indexedDB: options?.indexedDB || window.indexedDB,
      ...options,
    };
    this.dependencies = {
      indexedDB: this.options.indexedDB as IDBFactory,
    };
    this.idxdb = null;
    this.versionNumber = 0;
  }

  makeStores(...stores: ((transaction: Transaction<Schema>) => void)[]): {
    version: (versionNumber: number) => {
      open: () => Promise<IDBDatabase>;
    }
  } {
    this.stores = stores;
    return {
      version: this.version.bind(this),
    };
  }

  version(versionNumber: number): {
    open: () => Promise<IDBDatabase>;
  } {
    if (isNaN(versionNumber) || versionNumber < 0) {
      throw new TypeError(
        `Invalid version number: ${versionNumber}. Version must be a positive integer.`
      );
    }
    versionNumber = Math.round(versionNumber);
    this.versionNumber = versionNumber;
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
      const request = indexedDB.open(this.name, this.versionNumber);
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
    ).stores; 
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
