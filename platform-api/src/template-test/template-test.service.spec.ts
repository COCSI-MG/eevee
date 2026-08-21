import { TemplateTestService } from './template-test.service';
import { ExecutionRequestService } from 'src/execution/execution-request.service';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { TemplateParamType } from 'src/template-params/enums/template-param-type.enum';

describe('TemplateTestService', () => {
  let service: TemplateTestService;
  let executionRequestService: jest.Mocked<Pick<ExecutionRequestService, 'execute'>>;

  beforeEach(() => {
    executionRequestService = {
      execute: jest.fn().mockResolvedValue({
        passes: 2,
        failures: 0,
        completeTrace: 'Tests: 2 passed, 2 total',
      }),
    };
    service = new TemplateTestService(
      executionRequestService as unknown as ExecutionRequestService,
    );
  });

  it('mirrors the application file into both srcPath and testPath so tests can import it from either location', async () => {
    await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("ok", () => expect(1).toBe(1));',
      applicationFileContent: 'export const sum = (a, b) => a + b;',
    });

    const call = executionRequestService.execute.mock.calls[0];
    expect(call[0].jobName).toMatch(/^template-test-preview-\d+$/);
    expect(call[0].workerType).toBe(WorkerType.NODE_DEFAULT);

    const workerData = call[0].workerData;
    // files go to srcPath (/app/src). The bootstrap resolves the `..` so
    // `../test/app.ts` lands at /app/test/app.ts.
    expect(workerData.files).toEqual({
      'app.ts': 'export const sum = (a, b) => a + b;',
      '../test/app.ts': 'export const sum = (a, b) => a + b;',
      '../test/template-variables.ts':
        expect.stringContaining('export const vars'),
    });
    // testFilesContent goes through the strategy's index-based naming →
    // /app/test/0-template.spec.ts.
    expect(workerData.testFilesContent).toEqual([
      'test("ok", () => expect(1).toBe(1));',
    ]);
    expect(workerData.dependencies).toEqual([]);
  });

  it('merges user-supplied files with the mirrored app.ts', async () => {
    await service.run({
      workerType: WorkerType.NODE_NESTJS,
      templateContent: 'test("a", () => {});',
      applicationFileContent: 'export const app = 1;',
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const call = executionRequestService.execute.mock.calls[0];
    const workerData = call[0].workerData;
    expect(workerData.files).toEqual({
      'src/index.ts': 'export const x = 1;',
      'app.ts': 'export const app = 1;',
      '../test/app.ts': 'export const app = 1;',
      '../test/template-variables.ts':
        expect.stringContaining('export const vars'),
    });
  });

  it('omits the mirrored app.ts when applicationFileContent is empty', async () => {
    await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("a", () => {});',
      applicationFileContent: '',
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const call = executionRequestService.execute.mock.calls[0];
    const workerData = call[0].workerData;
    expect(workerData.files).toEqual({
      'src/index.ts': 'export const x = 1;',
      '../test/template-variables.ts':
        expect.stringContaining('export const vars'),
    });
    expect(workerData.testFilesContent).toEqual(['test("a", () => {});']);
  });

  it('forwards dependencies as-is', async () => {
    await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("a", () => {});',
      applicationFileContent: '',
      dependencies: ['lodash'],
    });

    const call = executionRequestService.execute.mock.calls[0];
    expect(call[0].workerData.dependencies).toEqual(['lodash']);
  });

  it('generates a non-empty templateVariablesModuleContent with the params supplied', async () => {
    await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("a", () => {});',
      applicationFileContent: '',
      params: { name: 'Alice', count: '3' },
      paramDefs: [
        { name: 'name', type: TemplateParamType.STRING },
        { name: 'count', type: TemplateParamType.NUMBER },
      ],
    });

    const call = executionRequestService.execute.mock.calls[0];
    const generated = call[0].workerData.templateVariablesModuleContent ?? '';
    expect(generated).toContain('"name": "Alice"');
    expect(generated).toContain('"count": 3');
    expect(generated).toContain('export const vars');
  });

  it('returns the WorkerResponse unchanged', async () => {
    const result = await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: '',
      applicationFileContent: '',
    });
    expect(result).toEqual({
      passes: 2,
      failures: 0,
      completeTrace: 'Tests: 2 passed, 2 total',
    });
  });
});

