import { promises as fs } from 'fs';
import * as path from 'path';

export async function readFileAsString(relativePath: string): Promise<string> {
  const absolutePath = path.resolve(process.cwd(), 'templates-upload', relativePath);
  return await fs.readFile(absolutePath, 'utf-8');
}