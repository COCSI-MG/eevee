# Aplicar a atividade e interpretar resultados

## Disponibilização

Depois que a atividade é salva, os estudantes da turma podem encontrá-la na página de turmas.

Antes da aplicação, confirme:

- Matrículas da turma;
- Pelo menos um template compatível;
- Limite de tentativas adequado;
- Dependências e serviços externos, quando usados.
- Tipos de alerta punitivo, limite global de alertas e limite de caracteres digitados por segundo.

## Durante a atividade

O workspace mostra um termo de uso com a política da atividade, armazena arquivos no navegador e aplica mecanismos de monitoramento no cliente. Sair da tela, abrir ferramentas de desenvolvimento, copiar/colar conteúdo proibido e exceder a velocidade de digitação só geram registros punitivos quando o tipo correspondente está selecionado. As ações protegidas continuam bloqueadas mesmo quando não são punitivas.


<figure markdown="span">
  ![Formulário de editar turma](../images/assingment-term-of-use.png){ .screenshot }
  <figcaption>Termo de uso por atividade</figcaption>
</figure>

### Bloqueio

Para consultar ocorrências, vá até atividades e clique nos 3 pontinhos de ações para entrar em **Alertas e bloqueios**. A suspensão é derivada da quantidade de alertas ativos e do limite atual da atividade; portanto, reduzir ou aumentar o limite recalcula o acesso imediatamente.

<figure markdown="span">
  ![Formulário de editar turma](../images/assingment-actions.png){ .screenshot }
  <figcaption>Usuários bloqueados por tarefa</figcaption>
</figure>

Consulte o histórico do aluno para ver o tipo, a data, a informação registrada e o estado de cada ocorrência. O modal abre no filtro **Ativos** e permite arquivar cada alerta individualmente, após confirmação. A aba **Arquivados** mostra quais registros foram arquivados e quando; o aluno é liberado assim que a contagem ativa fica abaixo do limite. Desmarcar um tipo de alerta impede novos registros desse tipo, mas não remove alertas ativos já existentes.

<figure markdown="span">
  ![Formulário de editar turma](../images/assingment-users-block-list.png){ .screenshot }
  <figcaption>Lista de usuários bloqueados</figcaption>
</figure>

## Execução prévia

Ao escolher **Executar** o registro é processado e pode ser acompanhado ou cancelado. A prévia não incrementa o número de tentativas.

## Envio para correção

Ao escolher **Enviar para Correção**, o sistema:

1. Verifica a atividade, a matrícula e o limite de tentativas;
2. Persiste os arquivos enviados;
3. Coloca a tentativa na fila;
4. Executa os testes;
5. Persiste pontuação, contagens e relatório.

O consumidor da fila é um processo separado da API. Se ele não estiver em execução, a submissão é aceita pela API, mas permanece pendente.

## Estados e resultados

| Estado | Interpretação |
| --- | --- |
| `pending` / `enqueded` | Registrada e aguardando processamento. |
| `running` | O consumidor iniciou o processamento. |
| `completed` | Execução encerrada e resultado persistido. |
| `failed` | Erro de preparação, infraestrutura, testes ausentes ou execução. |

A pontuação é calculada por:

```text
testes aprovados / (testes aprovados + testes reprovados)
```

Uma pontuação de `0.75` corresponde a 75%. `isAcceptable` é verdadeiro a partir de `0.7`.

O relatório bruto contém a saída tratada do executor. Erros de infraestrutura podem aparecer junto de mensagens do framework de testes, avalie o relatório antes de interpretar toda falha como erro do estudante.

## Acompanhamento administrativo

Em **Tentativas**, o administrador seleciona uma atividade, filtra por estudante e expande cada registro para ver:

- Estado, nota e contagens;
- Relatório bruto;
- Arquivos recebidos;
- Dados da tentativa.

A ação administrativa de reexecução usa os arquivos armazenados e cria **uma nova tentativa** para o estudante. Ela não altera a tentativa anterior e não aplica o limite máximo ao administrador.

<figure markdown="span">
  ![Formulário de editar turma](../images/assingment-exec-again.png){ .screenshot }
  <figcaption>Lista de tentativas de execução detalhada</figcaption>
</figure>
