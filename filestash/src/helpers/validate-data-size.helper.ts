import { MAX_FILE_SIZE } from '@/constants';

export function validateDataSize(size: number) {
  if (size > MAX_FILE_SIZE) {
    return false;
  }
  return true;
}
