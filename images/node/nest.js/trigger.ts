/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const SAFE_TEST_ENV = {
  PATH: process.env.PATH ?? '',
  NODE_ENV: 'test',
  CI: 'true',
  PORT: process.env.PORT ?? '3000',
};

function checkupDependencies() {
  const directoryPath = __dirname;
  const srcFolder = path.join(directoryPath, 'src');
  const hasSrcFiles =
    fs.existsSync(srcFolder) &&
    fs.readdirSync(srcFolder).some((f) => f.endsWith('.ts'));
  if (!hasSrcFiles) {
    console.error('No TypeScript files found in src/.');
    throw new Error('No TypeScript files in src/');
  } else {
    console.log('src/ folder has TypeScript files.');
  }

  const testFolder = path.join(directoryPath, 'test');
  if (!fs.existsSync(testFolder)) {
    console.error('test folder does not exist.');
    throw new Error('Missing test folder');
  }

  const hasAtLeastOneE2ETest = fs
    .readdirSync(testFolder)
    .some((file) => file.endsWith('.e2e-spec.ts'));

  if (!hasAtLeastOneE2ETest) {
    console.error('No *.e2e-spec.ts file found in test folder.');
    throw new Error('No e2e tests found');
  } else {
    console.log('At least one e2e test file found.');
  }
}

function applyTests(): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'test:e2e'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: SAFE_TEST_ENV,
    });

    child.stdout.on('data', (chunk: Buffer) => {
      process.stdout.write(chunk.toString());
    });

    child.stderr.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk.toString());
    });

    child.on('close', (code: number | null) => {
      console.log('Tests run!');
      resolve(code ?? 1);
    });
  });
}

async function main() {
  console.log('Checking dependencies...');
  checkupDependencies();
  console.log('Dependencies checked!');

  console.log('Running tests...');
  const exitCode = await applyTests();
  process.exit(exitCode);
}

main().catch((error) => {
  console.error('Error executing trigger:', error);
  process.exit(1);
});
