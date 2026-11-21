import { PythonDefaultStrategy } from './python-default.strategy';

describe('PythonDefaultStrategy', () => {
  it('passes the configured storage project limit to the bootstrap container', () => {
    const previous = process.env.STORAGE_MAX_PROJECT_BYTES;
    try {
      process.env.STORAGE_MAX_PROJECT_BYTES = '12345';
      const options = new PythonDefaultStrategy().buildJobOptions('definition');
      expect(options.initContainers?.[0].env).toContainEqual({
        name: 'STORAGE_MAX_PROJECT_BYTES', value: '12345',
      });
    } finally {
      if (previous === undefined) delete process.env.STORAGE_MAX_PROJECT_BYTES;
      else process.env.STORAGE_MAX_PROJECT_BYTES = previous;
    }
  });
  it('writes applicationFileContent to app.py for the bootstrap worker', () => {
    const strategy = new PythonDefaultStrategy();

    const payload = strategy.buildWorkerPayload(
      {
        applicationFileContent: 'def main(df):\n    return {}\n',
        files: { 'helper.py': 'VALUE = 1\n' },
        testFilesContent: ['from app import main'],
      },
      [],
    );

    expect(payload.files).toEqual({
      'app.py': 'def main(df):\n    return {}\n',
      'helper.py': 'VALUE = 1\n',
    });
  });
});
