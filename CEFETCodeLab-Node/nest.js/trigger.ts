/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as fs from 'fs';
import * as path from 'path';

function checkupDependencies() {
  const directoryPath = __dirname;
  const appModulePath = path.join(directoryPath, 'src', 'app.module.ts');
  if (!fs.existsSync(appModulePath)) {
    console.error('src/app.module.ts does not exist.');
    throw new Error('Missing app.module.ts');
  } else {
    console.log('src/app.module.ts exists.');
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

function applyTests() {
  const { exec } = require('child_process');
  exec('npm run test:e2e', (err: any, stdout: any, stderr: any) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    console.log('Tests run!');
  });
}

function main() {
  console.log('Checking dependencies...');
  checkupDependencies();
  console.log('Dependencies checked!');

  console.log('Running tests...');
  applyTests();
}

main();
