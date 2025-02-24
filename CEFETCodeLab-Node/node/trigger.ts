import fs from 'fs';
import path from 'path';

function checkupDependencies() {

  const directoryPath = __dirname;
  const filesToSearch = ['app.ts', 'validation.test.ts'];

  filesToSearch.forEach(file => {
    const filePath = path.join(directoryPath, file);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`${file} does not exist.`);
        throw err;
      } else {
        console.log(`${file} exists.`);
      }
    });
  });
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