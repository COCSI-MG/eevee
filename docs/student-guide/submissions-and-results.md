# Execução, envio e resultados

O workspace oferece duas formas diferentes de testar sua solução. Use **Executar** durante o desenvolvimento e **Enviar para Correção** quando quiser registrar uma tentativa.

## Executar uma prévia

Ao escolher **Executar**, o EEVEE valida a estrutura dos arquivos e inicia uma prévia com os testes da atividade. Essa execução não cria uma tentativa de estudante e não reduz o limite disponível.

A janela de pré-visualização mostra:

- Situação aceita ou reprovada;
- Pontuação;
- Quantidade de testes aprovados e reprovados;
- Relatório produzido pelo executor.

Enquanto a prévia estiver ativa, fechar ou cancelar a janela solicita o encerramento da execução. Depois de analisar o relatório, corrija os arquivos e execute novamente quando necessário.

!!! tip "Erros antes da execução"
    A validação local verifica se os arquivos principais esperados pelo tipo da atividade existem e procura erros de sintaxe ou compilação. Preserve a estrutura inicial e leia os detalhes apresentados quando a execução for bloqueada.

## Enviar para correção

Ao escolher **Enviar para Correção**, o sistema:

1. Reúne todos os arquivos do workspace;
2. Executa a mesma pré-validação estrutural;
3. Verifica a matrícula e o limite de tentativas;
4. Registra a nova tentativa e a coloca na fila de processamento;
5. Retorna o aluno à página anterior.

O cartão da atividade fica marcado como **Em execução** enquanto a tentativa estiver pendente ou em processamento. Nesse período, o botão **Iniciar** permanece desabilitado.

!!! warning "Envio é diferente de salvamento"
    Somente **Enviar para Correção** registra uma tentativa. Editar os arquivos, usar **Salvar** ou executar uma prévia não envia a solução como resposta final.

## Acompanhar os estados

| Estado | Interpretação |
| --- | --- |
| `pending` / `enqueded` | A tentativa foi registrada e aguarda processamento. |
| `running` | Os testes estão em execução. |
| `completed` | A execução terminou e o resultado foi armazenado. |
| `failed` | Ocorreu uma falha de validação, preparação, infraestrutura ou execução. |

Se a tentativa permanecer pendente por muito tempo, informe o professor, pois o processamento depende dos serviços de fila e execução da instalação.

## Consultar os resultados

Depois da primeira tentativa, use **Visualizar Resultados** no cartão da atividade. O histórico é exibido da tentativa mais recente para a mais antiga e apresenta:

- Número e data da tentativa;
- Estado aceita, em execução ou com falha;
- Pontuação;
- Testes aprovados e reprovados;
- Botão **Ver feedback**, quando existe um relatório.

## Continuar

- [Responder à entrevista](interview.md)
- [Voltar ao workspace](workspace.md)
