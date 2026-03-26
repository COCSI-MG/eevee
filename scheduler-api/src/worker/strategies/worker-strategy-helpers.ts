import { WorkerTestFile } from '../worker.interfaces';
import { WorkerJobPayload } from 'src/worker/worker-job-payload.type';

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

type BuildWorkerPayloadArgs = {
  files?: Record<string, string> | null;
  testFilesContent?: string[];
  testFiles?: WorkerTestFile[];
  dependencies: string[];
  srcPath: string;
  testPath: string;
  testFileSuffix: string;
};

export function buildWorkerPayload({
  files,
  testFilesContent,
  testFiles,
  dependencies,
  srcPath,
  testPath,
  testFileSuffix,
}: BuildWorkerPayloadArgs): WorkerJobPayload {
  const normalizedTestFiles = normalizeTestFiles(
    testFilesContent ?? [],
    testFiles,
  );

  const testFilesMap = normalizedTestFiles.reduce<Record<string, string>>(
    (acc, testFile, index) => {
      acc[`${index}-template.${testFileSuffix}`] = testFile.content;
      return acc;
    },
    {},
  );

  return {
    files: files ?? null,
    testFiles: testFilesMap,
    srcPath,
    testPath,
    dependencies,
  };
}