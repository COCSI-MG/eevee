import fs from 'fs';
import path from 'path';

function checkupDependencies() {

  const directoryPath = __dirname;

  const appPath = path.join(directoryPath, 'app.ts');
  fs.access(appPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`app.ts does not exist.`);
      throw err;
    } else {
      console.log(`app.ts exists.`);
    }
  });

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

    console.log("Tests run!");
  });
}

function main() {
  console.log("Checking dependencies...");
  checkupDependencies();
  console.log("Dependencies checked!");

  console.log("Running tests...");
  applyTests();
}

main();