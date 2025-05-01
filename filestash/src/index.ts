import { FileStash } from './core/file-stash';
import { PublicFileSchema } from './core/store/store-file-schema';

const db = new FileStash<PublicFileSchema>('MyDB', {
  version: 3,
}, trans => trans.createStore("files"));


const { files } = db.transaction(['files'], 'readwrite');

files.save();
