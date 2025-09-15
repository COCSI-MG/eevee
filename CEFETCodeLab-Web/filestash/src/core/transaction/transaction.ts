import { FileStashSchema } from '../store/store-file-schema';
import { Store } from '../store/store';

export class Transaction<Schema extends FileStashSchema> {
  constructor(readonly currDbTransaction: IDBTransaction) {}

  get stores() {
    return new Proxy(
      {} as {
        [Name in keyof Schema]: Store<Schema[Name]>;
      },
      {
        has: (_, name: string) =>
          this.currDbTransaction.objectStoreNames.contains(name),
        get: (_, proxy: string) => {
          if (
            typeof proxy === 'string' &&
            this.currDbTransaction.objectStoreNames.contains(proxy)
          ) {
            const store = new Store(this.currDbTransaction.objectStore(proxy));
            return store;
          }
          return undefined;
        },
      }
    );
  }

  commit() {
    this.currDbTransaction.commit?.();
    return new Promise<void>((resolve, reject) => {
      this.currDbTransaction.onerror = () =>
        reject(this.currDbTransaction.error?.message);
      this.currDbTransaction.oncomplete = () => resolve();
    });
  }

  abort(): void {
    if (this.currDbTransaction.error) return;
    this.currDbTransaction.abort();
  }

  createStore(name: string) {
    return this.currDbTransaction.db.createObjectStore(name, {
      autoIncrement: true
    })
  }

  dropStore(name: string) {
    return this.currDbTransaction.db.deleteObjectStore(name);
  }
}
