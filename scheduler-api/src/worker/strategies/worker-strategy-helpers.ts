import { WorkerTestFile } from '../worker.interfaces';

export function normalizeTestFiles(
  testFilesContent: string[],
  testFiles?: WorkerTestFile[],
): WorkerTestFile[] {
  if (testFiles && testFiles.length) return testFiles;

  return testFilesContent.map((content, index) => ({
    templateId: index,
    type: 'legacy',
    content,
  }));
}

export function buildWriteFileCommand(
  content: string,
  filePath: string,
): string {
  const encoded = Buffer.from(content).toString('base64');
  return `echo "${encoded}" | base64 -d > ${filePath}`;
}

export function buildMkdirPCommand(dirPath: string): string {
  return `mkdir -p ${dirPath}`;
}

export function buildNpmInstallCommand(
  dependencies: string[],
): string | undefined {
  if (!dependencies.length) return undefined;
  return `npm install ${dependencies.join(' ')}`;
}

export function asShellCommand(commands: string[]): string[] {
  return ['/bin/sh', '-c', commands.join(' && ')];
}
