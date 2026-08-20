import { PythonDefaultStrategy } from './python-default.strategy';
import { WorkerType } from '../enum/worker-type.enum';

describe('PythonDefaultStrategy', () => {
  const strategy = new PythonDefaultStrategy();

  it('uses the Python worker paths and entrypoint', () => {
    expect(strategy.workerType).toBe(WorkerType.PYTHON_DEFAULT);
    expect(strategy.workerConfig.srcPath).toBe('/app/src');
    expect(strategy.workerConfig.testPath).toBe('/app/test');
    expect(strategy.buildExecutionJobCommand({})).toEqual([
      'python',
      '-u',
      '/app/trigger.py',
    ]);
  });

  it('builds bootstrap payload files using pytest-compatible names', () => {
    const payload = strategy.buildWorkerPayload(
      {
        files: { 'src/app.py': 'def main():\n    return 1\n' },
        testFilesContent: [
          'from app import main\n\ndef test_main():\n    assert main() == 1\n',
        ],
      },
      [],
    );

    expect(payload).toEqual({
      files: { 'src/app.py': 'def main():\n    return 1\n' },
      testFiles: {
        '0-template.test.py':
          'from app import main\n\ndef test_main():\n    assert main() == 1\n',
      },
      srcPath: '/app/src',
      testPath: '/app/test',
      dependencies: [],
    });
  });

  it('parses the pytest summary emitted by trigger.py', () => {
    expect(
      strategy.processLogResult(
        'Tests:       4 passed, 5 total\nFailed:      1\n',
      ),
    ).toEqual({
      passes: 4,
      failures: 1,
      completeTrace: 'Tests:       4 passed, 5 total\nFailed:      1\n',
    });
  });
});
