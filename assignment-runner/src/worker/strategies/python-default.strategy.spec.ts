import { PythonDefaultStrategy } from './python-default.strategy';

describe('PythonDefaultStrategy', () => {
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
