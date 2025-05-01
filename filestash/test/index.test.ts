import { FileStash } from '../src/core/file-stash';
import { PublicFileSchema } from '../src/core/store/store-file-schema';
import {
    indexedDB as fakeIndexedDB
} from "fake-indexeddb";

describe('FileStash', () => {
  let db: FileStash<PublicFileSchema>;

  beforeEach(async () => {
    db = new FileStash<PublicFileSchema>('TestDB', {
      version: 1,
      indexedDB: fakeIndexedDB
    }, trans => trans.createStore("files"));
    await db.open();
  });

  afterEach(async () => {
    if (db) {
      await db.destructor();
      fakeIndexedDB.deleteDatabase("TestDB");
    }
  });

  test('FileStash can store data', async () => {
    // Arrange
    const testFile = {
      name: 'test.txt',
      data: 'Hello World',
      size: 11,
      createdAt: new Date().toISOString(),
      updateAt: new Date().toISOString(),
    };

    // Act
    const { files } = db.transactionWrite(['files']).stores;
    const key = await files.save(testFile);

    // Read back the data
    const trans = db.transactionRead(['files']);
    const storedFile = await trans.files.get(key as string);

    // Assert
    expect(storedFile).toEqual(
      expect.objectContaining({
        name: 'test.txt',
        data: 'Hello World',
        size: 11,
      })
    );
  });
});
