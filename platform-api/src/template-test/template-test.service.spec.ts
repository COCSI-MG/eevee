import { TemplateTestService } from './template-test.service';
import { ExecutionRequestService } from 'src/execution/execution-request.service';
import { WorkerType } from 'src/worker/enum/worker-type.enum';
import { TemplateParamType } from 'src/template/enums/template-param-type.enum';

describe('TemplateTestService', () => {
  let service: TemplateTestService;
  let executionRequestService: jest.Mocked<Pick<ExecutionRequestService, 'execute'>>;
  let classAccess: { assertTeacherAssignment: jest.Mock; assertTemplateAccess: jest.Mock };
  let templateResources: { workerSnapshots: jest.Mock };

  beforeEach(() => {
    executionRequestService = {
      execute: jest.fn().mockResolvedValue({
        passes: 2,
        failures: 0,
        completeTrace: 'Tests: 2 passed, 2 total',
      }),
    };
    classAccess = {
      assertTeacherAssignment: jest.fn().mockResolvedValue({ id: 1 }),
      assertTemplateAccess: jest.fn().mockResolvedValue({ id: 7, classId: 1 }),
    };
    templateResources = { workerSnapshots: jest.fn().mockResolvedValue([]) };
    service = new TemplateTestService(
      executionRequestService as unknown as ExecutionRequestService,
      classAccess as any,
      templateResources as any,
    );
  });

  it('uses the assignment import paths and writes the application under src', async () => {
    await service.run({
      classId: 1,
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'import { sum } from "./app"; test("ok", () => expect(sum(1, 1)).toBe(2));',
      applicationFileContent: 'export const sum = (a, b) => a + b;',
    });

    const call = executionRequestService.execute.mock.calls[0];
    expect(call[0].jobName).toMatch(/^template-test-preview-\d+$/);
    expect(call[0].workerType).toBe(WorkerType.NODE_DEFAULT);

    const workerData = call[0].workerData;
    expect(workerData.files).toEqual({
      'app.ts': 'export const sum = (a, b) => a + b;',
      'template-variables.ts':
        expect.stringContaining('export const vars'),
    });
    // testFilesContent goes through the strategy's index-based naming →
    // /app/test/0-template.spec.ts.
    expect(workerData.testFilesContent).toEqual([
      'import { sum } from "../src/app"; test("ok", () => expect(sum(1, 1)).toBe(2));',
    ]);
    expect(workerData.dependencies).toEqual([]);
  });

  it('merges user-supplied files with the application and variables', async () => {
    await service.run({
      classId: 1,
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
      'template-variables.ts':
        expect.stringContaining('export const vars'),
    });
  });

  it('omits app.ts when applicationFileContent is empty', async () => {
    await service.run({
      classId: 1,
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("a", () => {});',
      applicationFileContent: '',
      files: { 'src/index.ts': 'export const x = 1;' },
    });

    const call = executionRequestService.execute.mock.calls[0];
    const workerData = call[0].workerData;
    expect(workerData.files).toEqual({
      'src/index.ts': 'export const x = 1;',
      'template-variables.ts':
        expect.stringContaining('export const vars'),
    });
    expect(workerData.testFilesContent).toEqual(['test("a", () => {});']);
  });

  it('forwards dependencies as-is', async () => {
    await service.run({
      classId: 1,
      workerType: WorkerType.NODE_DEFAULT,
      templateContent: 'test("a", () => {});',
      applicationFileContent: '',
      dependencies: ['lodash'],
    });

    const call = executionRequestService.execute.mock.calls[0];
    expect(call[0].workerData.dependencies).toEqual(['lodash']);
  });

  it('normalizes application and variable imports for the worker test directory', async () => {
    await service.run({
      classId: 1, workerType: WorkerType.NODE_NEXTJS_CYPRESS,
      templateContent: 'import { main } from "./app"; import { vars } from "./template-variables";',
      applicationFileContent: 'export const main = () => 1;',
    });
    const payload = executionRequestService.execute.mock.calls[0][0].workerData;
    expect(payload.testFilesContent?.[0]).toContain('from "../../src/app"');
    expect(payload.testFilesContent?.[0]).toContain('from "../../src/template-variables"');
    expect(payload.files?.['template-variables.ts']).toContain('export const vars');
  });

  it('uses snapshots of the authorized saved template in the same class', async () => {
    const snapshot = { kind: 'template', scope: 'eevee-template-t7', id: 'a'.repeat(64) };
    templateResources.workerSnapshots.mockResolvedValue([snapshot]);
    await service.run({
      templateId: 7, classId: 1, workerType: WorkerType.PYTHON_DEFAULT,
      templateContent: 'test content', applicationFileContent: 'def main(): pass',
    });
    expect(classAccess.assertTemplateAccess).toHaveBeenCalledWith(7, true);
    expect(executionRequestService.execute.mock.calls[0][0].workerData).toEqual(
      expect.objectContaining({
        templateSnapshots: [snapshot],
        files: { 'app.py': 'def main(): pass' },
      }),
    );
  });

  it('rejects resources from a template in another class', async () => {
    classAccess.assertTemplateAccess.mockResolvedValue({ id: 7, classId: 2 });
    await expect(service.run({
      templateId: 7, classId: 1, workerType: WorkerType.PYTHON_DEFAULT,
      templateContent: '', applicationFileContent: '',
    })).rejects.toThrow('Template does not belong to the selected class');
    expect(templateResources.workerSnapshots).not.toHaveBeenCalled();
    expect(executionRequestService.execute).not.toHaveBeenCalled();
  });

  it('generates a non-empty templateVariablesModuleContent with the params supplied', async () => {
    await service.run({
      classId: 1,
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
      classId: 1,
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
