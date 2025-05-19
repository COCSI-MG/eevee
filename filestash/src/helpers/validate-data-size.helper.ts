import { MAX_FILE_SIZE } from '@/constants';
import { StoreStashSchema } from '@/core/store/store-file-schema';

export function isFileSizeLowerThanMaxSizeAllowed(fileObject: StoreStashSchema['Schema']['data']) {
  if (typeof fileObject === 'string') {
    return true;
  }
  if (fileObject instanceof Blob && fileObject.size < MAX_FILE_SIZE) {
    return true;
  }
  if (fileObject instanceof File && fileObject.size < MAX_FILE_SIZE) {
    return true;
  }
}
