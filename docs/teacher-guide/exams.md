# Provas e notas

Uma prova agrupa atividades de uma turma e define quantos pontos cada atividade vale. Ela não substitui as atividades: tentativas, alertas, bloqueios derivados, resultados e gabaritos continuam associados a cada atividade.

## Criar e disponibilizar uma prova

Na área administrativa, abra uma turma, acesse **Provas** e escolha **Nova prova**. Informe:

- título, com até 100 caracteres;
- descrição opcional, com até 255 caracteres;
- data de início opcional;
- data de vencimento opcional.

A data de início não pode ser posterior ao vencimento. Sem uma data de início, a prova permanece invisível para estudantes, quando o horário é alcançado, ela aparece automaticamente para os matriculados na turma.

!!! warning "O vencimento não encerra a prova"
    O sistema exibe e ordena pelo vencimento, mas atualmente não impede acessos ou submissões depois dele.

A listagem administrativa permite pesquisar, ordenar, editar e excluir provas. Excluir uma prova remove seus vínculos, mas não exclui automaticamente as atividades relacionadas.

## Vincular atividades e pontos

Abra os detalhes da prova e use a visualização **Atividades**. É possível vincular uma atividade existente da mesma turma e informar uma pontuação positiva.

Uma atividade pode pertencer a, no máximo, uma prova. Por isso, atividades já vinculadas a outra prova não aparecem na seleção. A pontuação pode ser alterada depois do vínculo.

As ações de remoção têm efeitos diferentes:

- **Desvincular** mantém a atividade e apenas a retira da prova;
- **Excluir atividade** remove a atividade da plataforma e, com ela, seus vínculos.

## Acompanhar estudantes e calcular a nota

Na visualização **Estudantes**, pesquise uma pessoa matriculada para consultar atividades realizadas, aprovações, quantidade de tentativas e a última tentativa concluída de cada atividade.

A nota da prova é calculada por:

```text
nota da prova = soma(pontos da atividade × nota da última tentativa concluída)
```

Uma tentativa com nota `0.8` em uma atividade de 3 pontos contribui com `2.4` pontos. Atividades sem tentativa concluída contribuem com zero. Tentativas pendentes, em execução ou com falha não substituem a última tentativa concluída nesse cálculo.

A ação de reexecução administrativa cria uma nova tentativa usando os arquivos já armazenados. Ela não altera a tentativa anterior.

## Continuar

- [Criar atividades](assignments.md)
- [Criar e liberar gabaritos](answer-keys.md)
- [Acompanhar tentativas e resultados](application-and-results.md)
