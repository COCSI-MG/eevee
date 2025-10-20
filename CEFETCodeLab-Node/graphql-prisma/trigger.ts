import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';

function log(msg: string) {
  console.log(msg);
}

function fail(msg: string, err?: unknown): never {
  console.error(msg);
  if (err) console.error(err);
  process.exit(1);
}

function checkupDependencies() {
  const cwd = process.cwd();

  const prismaSchemaPath = path.join(cwd, 'prisma', 'schema.prisma');
  if (!fs.existsSync(prismaSchemaPath)) {
    log('No prisma/schema.prisma found. Using built-in schema.');
  } else {
    log('Found prisma/schema.prisma (will override built-in schema).');
  }

  const resolversPath = path.join(cwd, 'src', 'resolvers.ts');
  if (!fs.existsSync(resolversPath)) {
    fail('Missing src/resolvers.ts (student solution).');
  } else {
    log('Found src/resolvers.ts.');
  }

  const testFolder = path.join(cwd, 'test');
  if (!fs.existsSync(testFolder)) {
    fail('Missing test folder. Provide at least one validation*.test.ts file under /test');
  }

  const hasTests = fs
    .readdirSync(testFolder)
    .some((f) => /^validation.*\.(test|spec)\.ts$/.test(f) || f.endsWith('.e2e-spec.ts'));
  if (!hasTests) {
    fail('No validation*.test.ts (or *.e2e-spec.ts) found in /test');
  } else {
    log('Found at least one validation test file.');
  }
}

function prepareDatabase() {
  try {
    log('Running Prisma generate...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    log('Pushing schema to SQLite (dev.db)...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

    const seedTs = path.join(process.cwd(), 'prisma', 'seed.ts');
    if (fs.existsSync(seedTs)) {
      log('Running seed (prisma/seed.ts)...');
      execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
    } else {
      log('No seed file found. Skipping seeding.');
    }
  } catch (e) {
    fail('Database preparation failed.', e);
  }
}

function applyTests() {
  const start = Date.now();
  const child = exec('npm test', (err, stdout, stderr) => {
    if (stdout) console.log(`stdout:\n${stdout}`);
    if (stderr) console.log(`stderr:\n${stderr}`);

    if (err) {
      console.error(`exec error: ${err}`);
      process.exit(1);
    }

    const end = Date.now();
    log(`Tests run! Total time: ${(end - start) / 1000}s`);
  });

  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
}

function main() {
  log('Checking dependencies...');
  checkupDependencies();
  log('Dependencies checked!');

  log('Preparing database...');
  prepareDatabase();
  log('Database ready!');

  log('Running tests...');
  applyTests();
}

main();