import { FileType } from '@/types/shared';

export function getFilePath(file: FileType, fileStructure: FileType[]): string {
  let path = file.name;
  let currentFile = file;
  
  while (currentFile.parentId) {
    const parent = findFileById(currentFile.parentId, fileStructure);
    if (!parent) break;
    path = `${parent.name}/${path}`;
    currentFile = parent;
  }
  
  return path;
}

function findFileById(id: string, items: FileType[]): FileType | null {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findFileById(id, item.children);
      if (found) return found;
    }
  }
  
  return null;
}

export function isActivePath(file: FileType, activeFilePath: string, fileStructure: FileType[]): boolean {
  const filePath = getFilePath(file, fileStructure);
  return filePath === activeFilePath;
}
