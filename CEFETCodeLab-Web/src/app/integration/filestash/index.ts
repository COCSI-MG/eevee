import { FileStash, PublicFileSchema } from "filestash";

const DB_VERSION = 1 //increment when schema changes

export async function initStash() {
  const db = new FileStash<PublicFileSchema>("EEVEE-DB");
  return await db.makeStores(
    trans => trans.createStore("files")
  ).version(DB_VERSION).open();
}

export async function upsertFileInStash(data: PublicFileSchema['files']['Schema'], key: PublicFileSchema['files']['Key']) {
  try {
    const db = new FileStash<PublicFileSchema>("EEVEE-DB");
    await db.version(DB_VERSION).open();
    const { files } = db.transactionWrite(["files"]).stores;
    const result = await files.upsert(data, key);
    db.destructor();
    return result;
  } catch (error) {
    console.error("Error upserting file in Filestash:", error);
    throw error;
  }
}

export async function getFileFromStash(fileKey: string) {
  try {
    const db = new FileStash<PublicFileSchema>("EEVEE-DB");
    await db.version(DB_VERSION).open();
    const files = db.transactionRead(["files"]).files;
    const result = await files.get(fileKey);
    db.destructor();
    return result;
  } catch (error) {
    console.error("Error getting file from Filestash:", error);
  }
}
