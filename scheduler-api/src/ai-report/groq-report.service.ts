import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { AiReportService } from './ai-report.abstract';

@Injectable()
export class GroqReportService implements AiReportService {
  private readonly logger = new Logger(GroqReportService.name);
  private readonly client: OpenAI | null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    this.client = apiKey
      ? new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1',
        })
      : null;
  }

  async refineReport(rawReport: string, assignmentDescription: string, files?: Record<string, string>): Promise<string> {
    if (this.hasAllTestsPassed(rawReport)) {
      return 'Parabéns! Seu exercício está correto e passou em todos os testes!';
    }

    const filteredReport = this.parseRawReport(rawReport);
    if (this.client) {
      try {
        const contextBlock = assignmentDescription
          ? `Descrição da tarefa:\n${assignmentDescription}\n\n`
          : '';

        const prompt = `
          Você é um assistente educacional que ajuda alunos a entender erros em exercícios de programação.

          Sua tarefa é analisar:
          1. O relatório de testes (PRINCIPAL)
          2. A resolução do aluno (OBRIGATÓRIO)

          E gerar um feedback claro, direto e útil.

          REGRAS IMPORTANTES:

          1. NUNCA forneça a resposta correta ou código pronto.
            - NÃO escreva código corrigido
            - Explique o problema e onde ele ocorre

          2. NÃO seja genérico.
            - NÃO diga "o teste falhou"
            - Explique exatamente POR QUE falhou

          3. NÃO copie o nome do teste como está no Jest.
            - Reescreva em linguagem simples
            Exemplo:
            "deve criar uma nova tarefa (POST /tasks)"
            "criação de uma tarefa via requisição POST"

          4. Para cada teste com falha, você DEVE:
            - Explicar o que o teste está verificando (em linguagem simples)
            - Explicar claramente o que deu errado
            - Apontar EXATAMENTE o trecho do código relacionado ao erro
            - Explicar por que aquele trecho causa o problema

          5. Seja específico ao apontar o problema no código:
            "verifique a função"
            "na função criarTask, o campo title está sendo definido como string fixa 'title'"

          6. Analise a resolução do aluno e identifique apenas problemas SIMPLES e DIRETOS no código, como:
          - valores fixos incorretos
          - uso incorreto de parâmetros
          - variáveis mal utilizadas
          - pequenos problemas de lógica
          - inconsistência simples de dados

          NÃO analise:
          - estrutura de testes
          - código de testes (Jest, expect, etc)
          - arquitetura da aplicação
          - sugestões avançadas ou complexas

          7. Diferencie claramente:

          - ERROS (Testes que falharam):
            São problemas que fazem os testes quebrarem.
            Devem aparecer APENAS na seção "Testes que falharam".

          - DICAS DE MELHORIA:
            São apenas melhorias SIMPLES no código do aluno que NÃO quebram testes.

            REGRAS CRÍTICAS PARA DICAS:
            - As dicas DEVEM ser baseadas SOMENTE no código do aluno
            - NÃO sugerir mudanças nos testes
            - NÃO sugerir novas funcionalidades
            - NÃO sugerir refatorações grandes
            - NÃO repetir erros já citados
            - NÃO inventar problemas

          Exemplos de boas dicas:
            - "Evite usar valores fixos quando há parâmetros disponíveis"
            - "Considere validar se o título foi enviado"
            - "A variável poderia ter um nome mais descritivo"

            Exemplos proibidos:
            - "Altere o teste"
            - "Use outro framework"
            - "Implemente uma arquitetura diferente"

          8. Seja direto, sem enrolação.

          FORMATO DA RESPOSTA (OBRIGATÓRIO):

          Testes que falharam:

          - [Nome simples do comportamento testado]
            • O que o teste verifica:
            • O que deu errado:
            • Onde está o problema no código:
            • Por que isso causa erro:

          Dicas simples no seu código:
          - Sugestões baseadas no código do aluno
          - Deixe claro que são apenas melhorias
          - Se não tiverem melhores, NÃO INVENTE OU ENROLE, só não inclua esse tópico. Quero apenas feedbacks reais.
          - Se uma dica não estiver claramente baseada no código do aluno, NÃO inclua.

          Observações sobre sua implementação:
          - Pontos gerais (clareza, organização, etc)
          - NÃO repetir erros já citados

          IMPORTANTE:
          - NÃO use frases genéricas
          - NÃO repita conteúdo
          - NÃO invente erros

          CONTEXTO DO EXERCÍCIO:
          ${contextBlock}

          RESOLUÇÃO DO ALUNO:
          ${
            files && Object.keys(files).length > 0
              ? Object.entries(files)
                  .map(([path, content]) => `// ${path}\n${content}`)
                  .join('\n\n')
              : 'Nenhuma resolução fornecida.'
          }

          RELATÓRIO BRUTO DE TESTES:
          """
          ${filteredReport}
          """

          Agora gere o feedback seguindo EXATAMENTE o formato acima.
          `;

        const response = await this.client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 512,
        });

        return (
          response.choices?.[0]?.message?.content?.trim() ||
          filteredReport
        );
      } catch (error: any) {
        this.logger.warn(`Groq API error, using fallback parser: ${error.message}`);
      }
    }

    return filteredReport;
  }


  private hasAllTestsPassed(report: string): boolean {
    if (!report || !report.trim().length) {
      return false;
    }

    const hasFail = report.includes('FAIL ');
    const hasFailed = report.toLowerCase().includes('failed');
    const hasErrors = /error TS\d+:/.test(report);
    const hasFailedTests = report.includes('●');

    return !hasFail && !hasFailed && !hasErrors && !hasFailedTests;
  }

  private parseRawReport(report: string): string {
    const lines = report.split('\n');
    const parts: string[] = [];

    const failures = this.extractFailures(lines);
    if (failures.length > 0) {
      parts.push('\nTestes que falharam:');
      failures.forEach((f) => parts.push(`\n${f}`));
    }

    const passes = this.extractPasses(lines);
    if (passes.length > 0) {
      parts.push('\nTestes que passaram:');
      passes.forEach((p) => parts.push(`• ${p}`));
    }

    const summary = this.extractSummary(lines);
    if (summary) parts.push(`\nResumo: ${summary}`);

    if (!parts.length) {
      return 'Não foi possível processar o resultado automaticamente.';
    }

    return parts.join('\n');
  }

  private extractSummary(lines: string[]): string | null {
    const summary = lines.find(
      (l) => l.includes('Tests:') && (l.includes('failed') || l.includes('total'))
    );

    return summary ? summary.trim() : null;
  }

  private formatFailure(block: string[]): string {
    return block
      .join('\n')
      .replace(/\s+Expected:/g, '\nExpected:')
      .replace(/\s+Received:/g, '\nReceived:')
      .trim();
  }

  private extractFailures(lines: string[]): string[] {
      const failures: string[] = [];
      let current: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('●')) {
          if (current.length) {
            failures.push(this.formatFailure(current));
            current = [];
          }
          current.push(trimmed);
          continue;
        }

        if (current.length) {
          if (
            trimmed.startsWith('✓') ||
            trimmed.startsWith('●') ||
            line.includes('Test Suites:') ||
            line.includes('Tests:')
          ) {
            failures.push(this.formatFailure(current));
            current = [];
          } else {
            current.push(line);
          }
        }
      }

      if (current.length) {
        failures.push(this.formatFailure(current));
      }

      return failures;
    }

    private extractPasses(lines: string[]): string[] {
      return lines
        .filter((l) => l.trim().startsWith('✓'))
        .map((l) => l.trim());
    }
}
