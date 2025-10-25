import { DefaultSchema, StoreSchema } from "./schema";

export class FileStash<TSchema extends StoreSchema = DefaultSchema> {
    private version: number;
    private dbName: string;
    private storeConfig: Map<string, IDBObjectStoreParameters>;

    private currDb: IDBDatabase | null = null;

    private openPromise: Promise<IDBDatabase> | null = null;

    constructor(dbName?: string) {
        this.beforeRun();

        this.version = 1;
        this.dbName = dbName || 'filestash-db';
        this.storeConfig = new Map();
    }

    setVersion(version: number) {
        this.version = version;
        return this;
    }

    setDbName(name: string) {
        this.dbName = name;
        return this;
    }

    /**
     * Configura uma object store que será criada no onupgradeneeded
     * @param storeName Nome da store
     * @param options Opções do IndexedDB (keyPath, autoIncrement, etc)
     */
    configureStore(storeName: string, options?: IDBObjectStoreParameters) {
        this.storeConfig.set(storeName, options || {});
        return this;
    }

    open(): Promise<IDBDatabase> {
        if (this.currDb) {
            return Promise.resolve(this.currDb);
        }

        if (this.openPromise) {
            return this.openPromise;
        }

        this.openPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, this.version);

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                this.currDb = db;

                // Lida com fechamento inesperado da conexão
                db.onversionchange = () => {
                    db.close();
                    this.currDb = null;
                    this.openPromise = null;
                };

                resolve(this.currDb);
            };

            request.onerror = () => {
                this.openPromise = null;
                reject(request.error);
            };

            request.onupgradeneeded = (event => this.onUpgradeNeeded(event));
        });

        return this.openPromise;
    }

    close() {
        if (this.currDb) {
            this.currDb.close();
            this.currDb = null;
            this.openPromise = null;
        }
    }

    async add<K extends keyof TSchema>(storeName: K, data: TSchema[K]['value']): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName as string], 'readwrite');
            const store = transaction.objectStore(storeName as string);
            const request = store.add(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        })
    }

    async get<K extends keyof TSchema>(storeName: K, key: TSchema[K]['key']): Promise<TSchema[K]['value'] | undefined> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName as string], 'readonly');
            const store = transaction.objectStore(storeName as string);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete<K extends keyof TSchema>(storeName: K, key: TSchema[K]['key']): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName as string], 'readwrite');
            const store = transaction.objectStore(storeName as string);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async upsert<K extends keyof TSchema>(storeName: K, data: TSchema[K]['value']): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName as string], 'readwrite');
            const store = transaction.objectStore(storeName as string);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAll<K extends keyof TSchema>(storeName: K): Promise<TSchema[K]['value'][]> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName as string], 'readonly');
            const store = transaction.objectStore(storeName as string);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private beforeRun() {
        if (typeof window === 'undefined') {
            console.warn('IndexedDB not available in this environment.');
            return;
        }
        if (!window.indexedDB) {
            throw new Error('IndexedDB is not supported in this environment.');
        }
    }

    private onUpgradeNeeded(event: IDBVersionChangeEvent) {
        const db = (event.target as IDBOpenDBRequest).result;

        // Cria as stores configuradas
        if (event.oldVersion < 1) {
            this.storeConfig.forEach((options, storeName) => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, options);
                }
            });
        }
    }
}