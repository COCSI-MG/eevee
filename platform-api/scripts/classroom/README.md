# Turmas e exercícios do professor Neemias

Na raiz de `eevee`:

```bash
make seed-classroom-preview  # consulta o destino e mostra o plano, sem gravar
make seed-classroom          # cria as turmas ausentes e atividades em rascunho
make check-classroom-seed    # valida o conteúdo sem conectar ao banco
```

Os comandos de seed compilam a API e usam exclusivamente `platform-api/.env`, assim como as migrations. Abra o túnel primeiro se esse arquivo apontar para uma porta de túnel. Aplique as migrations pendentes antes do seed. Não são criados usuários, convites, matrículas ou respostas. O comando antigo `make seed` continua sendo o seed de contas de demonstração; ele não é chamado aqui.

## Conteúdo

| Turma | Laboratório | Questionário |
| --- | --- | --- |
| Arquitetura de Computadores | 24 tarefas (Q07–30) | 30 questões |
| Banco de Dados II | 30 tarefas SQL (Q01–30) | 30 questões |
| Ciência de Dados | 30 tarefas SQL (Q01–30) | 30 questões |
| Desenvolvimento Mobile | 30 tarefas SQL (Q01–30) | 30 questões |
| Jogos Educativos | 30 tarefas SQL (Q01–30) | 30 questões |
| Python — Turma Sexta de Manhã — Curso Técnico | 24 tarefas (Q07–30) | 30 questões |

São seis turmas e doze atividades: um laboratório e um questionário por turma. Uma turma existente com o mesmo nome é reutilizada. Os quatro PDFs SQL são iguais; o PDF do técnico é igual ao de arquitetura. Essa distribuição segue as pastas fornecidas, não implica que a lista SQL cubra todo o currículo de Mobile/Jogos/Ciência de Dados ou que exista uma lista de programação Python. Revise essa correspondência antes de publicar. Não foi presumido semestre atual a partir do cabeçalho do PDF.

As atividades novas ficam com `published=false`, sem datas, três tentativas e feedback fechado. O laboratório não consome tentativas nem gera nota. As gerações de computadores (Q01–06) são discutidas e avaliadas no questionário; o laboratório atual trabalha valores numéricos e unidades, não simula gerações de hardware.

Cada tarefa SQL reinicia o mesmo conjunto de tabelas fictícias isoladas no navegador. Há consultas iniciais, objetivos verificáveis, experimentação livre e reset. As respostas de referência ficam no código de validação e não são inseridas nas atividades. A verificação compara o estado final; não comprova que o aluno usou uma sintaxe específica ou executou todos os passos exploratórios. Tarefas sobre erros e rollback incluem uma alteração final verificável para não passarem sem trabalho. Conversões validam o valor, não a largura textual em bits. O questionário avalia os conceitos separadamente.

## Revisões do material original

- Arquitetura Q24: a alternativa D repetia a resposta correta A (`BEE`). Foi substituída por `BED`; A permanece correta.
- SQL Q02: a alternativa A passou a declarar explicitamente a lista de colunas, conforme o enunciado.
- SQL Q19: reformulada para PostgreSQL, sem a generalização sobre ausência de logs de linha e classificação DDL. O contraste avaliado é remoção total sem WHERE versus remoção filtrada. A explicação informa que TRUNCATE é transacional e gera WAL no PostgreSQL.
- SQL Q20: o enunciado agora declara que existem exatamente duas colunas, na ordem indicada, evitando a afirmação universal incorreta sobre inserções sem lista de colunas e defaults.
- Explicações foram revisadas/redigidas para a versão EEVEE. As atribuições a bancas no PDF não foram verificadas externamente e não são apresentadas como proveniência independente no questionário.
- As tarefas práticas são adaptações autorais dos conceitos da lista, não uma transcrição de instruções práticas dadas pelo professor.

Fontes locais: `classes-conducted/neemias/arquitetura-computadores/lista_exercicios_arquitetura_computadores.pdf` (questões pp. 1–6, gabarito pp. 7–8), `classes-conducted/neemias/banco-dados-ii/exercicios_sql_banco_dados.pdf` (questões pp. 1–6, gabarito pp. 6–7) e as cópias nas demais pastas. Os nomes das turmas seguem os grupos do arquivo `lista aluno.txt`; nenhum nome de aluno é importado.

## Reexecução e condução

O seed usa nome exato da turma e título da atividade como identificadores. Preserva integralmente registros existentes, inclusive edições do professor, publicação e tentativas. Nomes/títulos ambíguos causam falha e rollback de toda a operação. Se renomear uma turma ou atividade, atualize também o catálogo antes de repetir o seed, para não criar outro registro com o nome antigo. Ele não é um mecanismo de atualização do conteúdo já publicado.

Após executar: abra cada turma no painel administrativo, revise as duas atividades e os ajustes acima, defina abertura/prazo/tentativas e publique. Convide e matricule os alunos manualmente. Durante a aula, use o laboratório primeiro e o questionário depois; libere o feedback quando encerrar os envios. A liberação de feedback fecha novos envios. As notas desses questionários ficam nas atividades nativas e não são agregadas automaticamente às Provas de código.

## Validação

`make check-classroom-seed` requer as dependências da API e do frontend (`make setup`) e executa os 30 exemplos SQL no PGlite usado pelo laboratório, verifica estados iniciais/finais/reset, erros de integridade, rollback, 24 resultados numéricos, DTOs e pontuação dos 60 itens distintos. Não requer conexão ao PostgreSQL do `.env`.

Também foi validado em transação revertida no banco local: preview sem gravações, primeira execução, reexecução sem duplicação, preservação de edições/publicação do professor, rejeição de nomes ambíguos e ausência de alterações em usuários, matrículas e respostas. O preview atual reutiliza Arquitetura de Computadores e propõe criar cinco turmas e doze atividades. Nenhuma atividade foi persistida durante essa validação.
