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

  async refineReport(rawReport: string, assignmentDescription?: string): Promise<string> {
    if (this.client) {
      try {
        const contextBlock = assignmentDescription
          ? `Descrição da tarefa:\n${assignmentDescription}\n\n`
          : '';

        const prompt = `
            Você é um assistente educacional que ajuda alunos a entender erros em exercícios de programação.

            Sua tarefa é ler um relatório bruto de execução de testes e reescrevê-lo como uma explicação clara,
            amigável e didática em português.

            REGRAS IMPORTANTES:
            1. Explique apenas o que deu errado nos testes.
            3. NÃO mencione detalhes técnicos do sistema de testes (frameworks, ferramentas, stack traces ou logs internos).
            4. Ignore qualquer mensagem técnica ou interna do sistema de testes.
            5. Quando mencionar o comportamento esperado e o comportamento obtido, deixe claro que é apenas um exemplo de um teste executado.

            Use expressões como:
            - "Em um dos testes realizados..."
            - "No teste executado, foi esperado que..."
            - "No entanto, o comportamento observado foi..."

            6. Seja conciso, direto e fácil de entender.
            7. Escreva como se estivesse explicando para um aluno iniciante.

            CONTEXTO DO EXERCÍCIO:
            ${contextBlock}

            RELATÓRIO BRUTO DE TESTES:
            """
            ${rawReport}
            """

            Agora escreva apenas a explicação amigável do que deu errado.
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
          this.parseRawReport(rawReport)
        );
      } catch (error: any) {
        this.logger.warn(`Groq API error, using fallback parser: ${error.message}`);
      }
    }

    return this.parseRawReport(rawReport);
  }

  private parseRawReport(report: string): string {
    const lines = report.split('\n');
    const parts: string[] = [];

    const failLine = lines.find((l) => l.includes('FAIL '));
    const passLine = lines.find((l) => l.includes('PASS '));
    if (failLine) parts.push(`${failLine.trim()}`);
    else if (passLine) parts.push(`${passLine.trim()}`);

    const tsErrors = lines.filter((l) => /error TS\d+:/.test(l));
    if (tsErrors.length > 0) {
      parts.push('\nErros de compilação encontrados:');
      tsErrors.forEach((e) => parts.push(`• ${e.trim()}`));
    }

    const testFailures = lines.filter((l) => l.trim().startsWith('●'));
    if (testFailures.length > 0) {
      parts.push('\nTestes que falharam:');
      testFailures.forEach((f) => parts.push(`• ${f.trim()}`));
    }

    const summaryLine = lines.find(
      (l) => l.includes('Tests:') && (l.includes('failed') || l.includes('total')),
    );
    if (summaryLine) parts.push(`\nResumo: ${summaryLine.trim()}`);

    if (parts.length === 0) {
      return 'Não foi possível processar o resultado automaticamente. Consulte o relatório completo para mais detalhes.';
    }

    return parts.join('\n');
  }
}
