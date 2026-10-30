import {
  hasAllPytestTestsPassed,
  parsePytestRawReport,
} from './pytest-report-parser';

const PASSED_LOG = `Running tests...
...........                                                              [100%]
------------------ generated xml file: /app/test-results.xml -------------------
11 passed in 1.78s
Tests:       11 passed, 11 total
Failed:      0
ResultsFile: /app/test-results.xml
Tests run!`;

const FAILED_LOG = `Running tests...
.F.F.                                                                    [100%]
=================================== FAILURES ===================================
__________________________ test_indicador[quantidade] __________________________
"quantidade": era esperado 10, mas sua função devolveu 12. Dica: use pedidos["vr_total"].count().
_____________________ test_tabela_pequena_com_valor_vazio ______________________
Com esta tabela pequena:
   vr_total
0      10.0
1       NaN

"quantidade": era esperado 1, mas sua função devolveu 2. Dica: refaça a conta à mão com a tabela acima.
____________________ test_ordem_do_maior_para_o_menor_total ____________________
test/validation0.test.py:167: in test_ordem_do_maior_para_o_menor_total
    assert ordem == esperada
E   AssertionError: Ordem esperada: ['PIX', 'Dinheiro']. Sua ordem: ['Dinheiro', 'PIX'].
------------------ generated xml file: /app/test-results.xml -------------------
=========================== short test summary info ============================
FAILED test/validation0.test.py::test_indicador[quantidade] - Failed: "quanti...
FAILED test/validation0.test.py::test_tabela_pequena_com_valor_vazio - Failed...
FAILED test/validation0.test.py::test_ordem_do_maior_para_o_menor_total - Ass...
3 failed, 2 passed in 0.68s
Tests:       2 passed, 5 total
Failed:      3
ResultsFile: /app/test-results.xml
Tests run!`;

const SYNTAX_ERROR_LOG = `Running tests...

==================================== ERRORS ====================================
__________________ ERROR collecting test/validation0.test.py ___________________
/usr/local/lib/python3.12/site-packages/_pytest/python.py:493: in importtestmodule
    mod = import_path(
test/validation0.test.py:5: in <module>
    from app import resumo_valores, main
E     File "/app/src/app.py", line 3
E       def resumo_valores(pedidos)
E                                  ^
E   SyntaxError: expected ':'
------------------ generated xml file: /app/test-results.xml -------------------
=========================== short test summary info ============================
ERROR test/validation0.test.py
!!!!!!!!!!!!!!!!!!!! Interrupted: 1 error during collection !!!!!!!!!!!!!!!!!!!!
1 error in 1.04s
Tests:       0 passed, 1 total
Failed:      1
ResultsFile: /app/test-results.xml
Tests run!`;

describe('pytest-report-parser', () => {
  describe('hasAllPytestTestsPassed', () => {
    it('reconhece quando todos os testes passaram', () => {
      expect(hasAllPytestTestsPassed(PASSED_LOG)).toBe(true);
    });

    it('reconhece falhas e erros de coleta', () => {
      expect(hasAllPytestTestsPassed(FAILED_LOG)).toBe(false);
      expect(hasAllPytestTestsPassed(SYNTAX_ERROR_LOG)).toBe(false);
    });

    it('não considera aprovado um log vazio ou sem testes', () => {
      expect(hasAllPytestTestsPassed('')).toBe(false);
      expect(hasAllPytestTestsPassed('Tests:       0 passed, 0 total')).toBe(
        false,
      );
    });
  });

  describe('parsePytestRawReport', () => {
    it('lista cada teste que falhou com a mensagem do teste', () => {
      const report = parsePytestRawReport(FAILED_LOG);

      expect(report).toContain('Testes que falharam:');
      expect(report).toContain(
        '● test_indicador[quantidade]\n"quantidade": era esperado 10, mas sua função devolveu 12. Dica: use pedidos["vr_total"].count().',
      );
      expect(report).toContain(
        '● test_tabela_pequena_com_valor_vazio\nCom esta tabela pequena:\n   vr_total',
      );
      expect(report).toContain('Resumo: 2 de 5 testes passaram.');
    });

    it('usa só as linhas E do traceback quando o teste usa assert', () => {
      const report = parsePytestRawReport(FAILED_LOG);

      expect(report).toContain(
        "● test_ordem_do_maior_para_o_menor_total\nAssertionError: Ordem esperada: ['PIX', 'Dinheiro']. Sua ordem: ['Dinheiro', 'PIX'].",
      );
      expect(report).not.toContain('test/validation0.test.py:167');
    });

    it('não mistura o resumo do pytest com as falhas', () => {
      expect(parsePytestRawReport(FAILED_LOG)).not.toContain(
        'FAILED test/validation0.test.py',
      );
    });

    it('mostra o erro de sintaxe do código do aluno', () => {
      const report = parsePytestRawReport(SYNTAX_ERROR_LOG);

      expect(report).toContain('● ERROR collecting test/validation0.test.py');
      expect(report).toContain('  File "/app/src/app.py", line 3');
      expect(report).toContain("SyntaxError: expected ':'");
      expect(report).not.toContain('importtestmodule');
    });

    it('avisa quando não consegue ler o log', () => {
      expect(parsePytestRawReport('')).toBe(
        'Não foi possível processar o resultado automaticamente.',
      );
    });
  });
});
