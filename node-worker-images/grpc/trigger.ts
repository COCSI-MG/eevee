import fs from 'fs';
import path from 'path';

function checkupDependencies() {
  const directoryPath = __dirname;

  // Check if server.ts exists
  const serverPath = path.join(directoryPath, 'server.ts');
  fs.access(serverPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('server.ts does not exist.');
      throw err;
    } else {
      console.log('server.ts exists.');
    }
  });

  // Check if at least one test file exists
  const hasAtLeastOneTestFile = fs
    .readdirSync(directoryPath)
    .some((file) => file.startsWith('validation') && file.endsWith('.test.ts'));

  if (!hasAtLeastOneTestFile) {
    console.error('No validation*.test.ts file found.');
  } else {
    console.log('At least one test file found.');
  }
}

function applyTests() {
  const { exec } = require('child_process');
  exec('npm test', (err: any, stdout: any, stderr: any) => {
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

