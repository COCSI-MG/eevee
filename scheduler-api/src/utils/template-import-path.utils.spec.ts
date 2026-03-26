import { normalizeTemplateImportPaths } from './template-import-path.utils';

describe('normalizeTemplateImportPaths', () => {
  it('normalizes src imports based on dynamic srcPath and testPath', () => {
    const content = [
      "import { findAll } from '../src/app';",
      "const app = require('../src/app');",
      "const dynamicApp = import('../src/app');",
    ].join('\n');

    const output = normalizeTemplateImportPaths({
      content,
      srcPath: '/workspace/src',
      testPath: '/workspace/tests',
    });

    expect(output).toContain("import { findAll } from '../src/app';");
    expect(output).toContain("const app = require('../src/app');");
    expect(output).toContain("const dynamicApp = import('../src/app');");
  });

  it('rewrites hardcoded /src prefixes to match runtime paths', () => {
    const content = "import { start } from '/app/src/main';";

    const output = normalizeTemplateImportPaths({
      content,
      srcPath: '/workspace/src',
      testPath: '/workspace/tests',
    });

    expect(output).toContain("import { start } from '../src/main';");
  });

  it('rewrites cypress test imports according to deep testPath', () => {
    const content = "import { Home } from '../src/pages/home';";

    const output = normalizeTemplateImportPaths({
      content,
      srcPath: '/app/src',
      testPath: '/app/cypress/e2e',
    });

    expect(output).toContain("import { Home } from '../../src/pages/home';");
  });

  it('keeps package imports unchanged', () => {
    const content = "import { Injectable } from '@nestjs/common';";

    const output = normalizeTemplateImportPaths({
      content,
      srcPath: '/workspace/src',
      testPath: '/workspace/tests',
    });

    expect(output).toBe(content);
  });

  it('rewrites imports with absolute path that not includes src as relative to testPath', () => {
    const content = 'import app from ./app';

    const output = normalizeTemplateImportPaths({
      content,
      srcPath: '/workspace/src',
      testPath: '/workspace/tests',
    });

    // path que o teste vai rodar é /app/tests, então o import relativo para chegar no app é ../src/app
    expect(output).toContain("import app from '../src/app';");
  });

  it('rewrites more than one import in the same file', () => {
    const content = [
      "import { findAll } from './app';",
      "import { start } from './main';",
    ].join('\n');

    const output = normalizeTemplateImportPaths({
      content,
      srcPath: '/workspace/src',
      testPath: '/workspace/tests',
    });

    expect(output).toContain("import { findAll } from '../src/app';");
    expect(output).toContain("import { start } from '../src/main';");
  });
});
