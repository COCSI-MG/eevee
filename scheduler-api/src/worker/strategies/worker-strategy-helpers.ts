import { WorkerTestFile } from '../worker.interfaces';
import {
  ARTIFACT_ENV_VAR_NAME,
  ARTIFACT_LOCAL_TGZ_PATH,
} from 'src/artifacts/artifacts.constants';

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

export function buildDownloadArtifactCommand(
  destinationPath: string = ARTIFACT_LOCAL_TGZ_PATH,
): string {
  // Uses Node's built-in fetch (Node 18+) to avoid relying on curl/wget in images.
  // NOTE: uses env var injected into the Job.
  return (
    'node -e "' +
    "const fs=require('fs');" +
    '(async()=>{' +
    `const url=process.env.${ARTIFACT_ENV_VAR_NAME};` +
    "if(!url) throw new Error('Missing ${ARTIFACT_ENV_VAR_NAME}');" +
    'const r=await fetch(url);' +
    "if(!r.ok) throw new Error('Artifact download failed: '+r.status);" +
    'const b=Buffer.from(await r.arrayBuffer());' +
    `fs.writeFileSync('${destinationPath}', b);` +
    '})();"'
  );
}

export function buildExtractArtifactCommand(
  sourcePath: string = ARTIFACT_LOCAL_TGZ_PATH,
  destinationDir: string = '/',
): string {
  return `tar -xzf ${sourcePath} -C ${destinationDir}`;
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
