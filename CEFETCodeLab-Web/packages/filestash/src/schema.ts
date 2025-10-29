export type StoreSchema = Record<string, { key: IDBValidKey; value: any }>;

export type DefaultSchema = {
    assignments: {
        key: string;
        value: {
            id: string,
            [key: string]: any
        }
    }
}