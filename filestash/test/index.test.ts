import { FileStash } from '../src/core/file-stash';
import { PublicFileSchema } from '../src/core/store/store-file-schema';
import {
    indexedDB as fakeIndexedDB
} from "fake-indexeddb";

describe('FileStash', () => {
  let db: FileStash<PublicFileSchema>;
  const mockData = {
    name: "index.js",
    data: 'console.log("Hello, world")',
    size: new String('console.log("Hello, world")').length,
    createdAt: new Date().toISOString(),
    updateAt: new Date().toISOString(),
  }
  const mockKey = 'mock-key';

  beforeAll(async () => {
    db = new FileStash<PublicFileSchema>('TestDB', {
      indexedDB: fakeIndexedDB
    });
    await db.makeStores(
      trans => trans.createStore("files"),
      trans => trans.createStore("filesTwo")
    ).open();
  });

  afterAll(async () => {
    if (db) {
      await db.destructor();
      fakeIndexedDB.deleteDatabase("TestDB");
    }
  });

  test('FileStash can store data', async () => {
    const { files } = db.transactionWrite(["files"]).stores;
    const key = await files.upsert(mockData, mockKey);
    expect(key).toBeDefined();
  });

  test('File stash can retrieve data', async () => {
    const files = db.transactionRead(["files"]).files;
    const result = await files.get(mockKey);
    expect(result).toMatchObject({
      name: mockData.name,
      data: mockData.data,
      size: mockData.size,
      createdAt: mockData.createdAt,
      updateAt: mockData.updateAt,
    });
  })

  test('File stash can delete data', async () => {
    const { files } = db.transactionWrite(["files"]).stores;
    await files.destroy(mockKey);

    const readFiles = db.transactionRead(["files"]).files;
    const result = await readFiles.get(mockKey);
    expect(result).toBeUndefined();
  });

  test('File stash can clear data', async () => {
    const { files } = db.transactionWrite(["files"]).stores;
    await files.clear();
    expect(files.count()).resolves.toBe(0); 
  });
});
