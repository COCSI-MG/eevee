import { GroqReportService } from './groq-report.service';
import { WorkerType } from 'src/worker/enum/worker-type.enum';

const PYTEST_FAILED_LOG = `Running tests...
F.                                                                       [100%]
=================================== FAILURES ===================================
__________________________ test_indicador[quantidade] __________________________
"quantidade": era esperado 10, mas sua função devolveu 12.
------------------ generated xml file: /app/test-results.xml -------------------
1 failed, 1 passed in 0.40s
Tests:       1 passed, 2 total
Failed:      1
ResultsFile: /app/test-results.xml
Tests run!`;

const PYTEST_PASSED_LOG = `Running tests...
..                                                                       [100%]
2 passed in 0.40s
Tests:       2 passed, 2 total
Failed:      0
ResultsFile: /app/test-results.xml
Tests run!`;

describe('GroqReportService', () => {
  const originalApiKey = process.env.GROQ_API_KEY;
  let service: GroqReportService;

  beforeEach(() => {
    delete process.env.GROQ_API_KEY;
    service = new GroqReportService();
  });

  afterAll(() => {
    process.env.GROQ_API_KEY = originalApiKey;
  });

  it('lista as falhas do pytest para tarefas python_default', async () => {
    const report = await service.refineReport(
      PYTEST_FAILED_LOG,
      '',
      {},
      WorkerType.PYTHON_DEFAULT,
    );

    expect(report).toContain('● test_indicador[quantidade]');
    expect(report).toContain('"quantidade": era esperado 10');
    expect(report).toContain('Resumo: 1 de 2 testes passaram.');
  });

  it('parabeniza quando todos os testes do pytest passam', async () => {
    const report = await service.refineReport(
      PYTEST_PASSED_LOG,
      '',
      {},
      WorkerType.PYTHON_DEFAULT,
    );

    expect(report).toBe(
      'Parabéns! Seu exercício está correto e passou em todos os testes.',
    );
  });

  it('mantém o leitor do Jest para os workers Node', async () => {
    const report = await service.refineReport(
      PYTEST_FAILED_LOG,
      '',
      {},
      WorkerType.NODE_DEFAULT,
    );

    expect(report).not.toContain('● test_indicador[quantidade]');
  });
});
