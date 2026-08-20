import { TemplateTestService } from './template-test.service';
import { WorkerService } from 'src/worker/worker.service';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { TemplateParamType } from 'src/template-params/enums/template-param-type.enum';

describe('TemplateTestService', () => {
  let service: TemplateTestService;
  let workerService: jest.Mocked<Pick<WorkerService, 'createWorkerWithInitContainer'>>;

  beforeEach(() => {
    workerService = {
      createWorkerWithInitContainer: jest.fn().mockResolvedValue({
        passes: 2,
        failures: 0,
        completeTrace: 'Tests: 2 passed, 2 total',
      }),
    };
    service = new TemplateTestService(
      workerService as unknown as WorkerService,
    );
  });

  it('mirrors the application file into both srcPath and testPath so tests can import it from either location', async () => {
    await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("ok", () => expect(1).toBe(1));',
      applicationFileContent: 'export const sum = (a, b) => a + b;',
    });

    const call = workerService.createWorkerWithInitContainer.mock.calls[0];
    expect(call[0]).toMatch(/^template-test-preview-\d+$/);
    expect(call[1]).toBe(WorkerType.NODE_DEFAULT);

    const workerData = call[2];
    // files go to srcPath (/app/src). The bootstrap resolves the `..` so
    // `../test/app.ts` lands at /app/test/app.ts.
    expect(workerData.files).toEqual({
      'app.ts': 'export const sum = (a, b) => a + b;',
      '../test/app.ts': 'export const sum = (a, b) => a + b;',
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

    const call = workerService.createWorkerWithInitContainer.mock.calls[0];
    const workerData = call[2];
    expect(workerData.files).toEqual({
      'src/index.ts': 'export const x = 1;',
      'app.ts': 'export const app = 1;',
      '../test/app.ts': 'export const app = 1;',
    });
  });

  it('omits the mirrored app.ts when applicationFileContent is empty', async () => {
    await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("a", () => {});',
      applicationFileContent: '',
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const call = workerService.createWorkerWithInitContainer.mock.calls[0];
    const workerData = call[2];
    expect(workerData.files).toEqual({ 'src/index.ts': 'export const x = 1;' });
    expect(workerData.testFilesContent).toEqual(['test("a", () => {});']);
  });

  it('forwards dependencies as-is', async () => {
    await service.run({
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("a", () => {});',
      applicationFileContent: '',
      dependencies: ['lodash'],
    });

    const call = workerService.createWorkerWithInitContainer.mock.calls[0];
    expect(call[2].dependencies).toEqual(['lodash']);
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

    const call = workerService.createWorkerWithInitContainer.mock.calls[0];
    const generated = call[2].templateVariablesModuleContent ?? '';
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
