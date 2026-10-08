# Práticas guiadas e questionários

Na edição de uma turma, a seção **Práticas e questionários** permite criar duas atividades independentes: um laboratório sem nota e um questionário com respostas registradas. Os estudantes encontram as atividades publicadas na aba de mesmo nome da turma. Uma conta precisa estar matriculada para acessar a atividade, inclusive por URL direta.

## Laboratório de prática

Escolha **Criar prática ou questionário → Laboratório de prática**. Preencha o título, o contexto e a abertura. Atividades novas começam como rascunho. Marque **Publicar para os estudantes** quando estiverem prontas.

Escolha um laboratório:

- **SQL:** cada estudante recebe um PostgreSQL temporário no navegador, com as tabelas e os dados definidos pelo professor. O roteiro inicial trabalha `INSERT`, `UPDATE`, `DELETE` e `ROLLBACK`. Os alunos escrevem SQL, executam, inspecionam resultados e verificam o objetivo.
- **Bases numéricas e unidades:** os alunos manipulam bits, representam valores em binário/decimal/hexadecimal e exploram a diferença entre unidades decimais e binárias de armazenamento. O roteiro inicial inclui 45 em binário, 254 em hexadecimal, a fração 0,625 e 4 MiB em bytes.

Edite os objetivos e os valores iniciais. Os exemplos são adaptações práticas dos conceitos do material de aula, não uma transcrição automática dos PDFs. História das gerações de computadores e outros tópicos conceituais ainda não têm um simulador próprio.

Em SQL, configure uma consulta de verificação e as linhas esperadas em JSON. Use `ORDER BY` para ordem determinística; nomes de colunas, tipos de valores e ordem das linhas devem corresponder. PostgreSQL pode retornar valores `NUMERIC` como texto, como `"5500.00"`. Verifique também os dados que devem permanecer intactos. A verificação compara o estado final, não a sequência de ações: um objetivo como rollback pode estar satisfeito no estado inicial, portanto sua execução deve ser discutida com o aluno, não tratada como prova de que executou determinada sequência.

**Experimentar prática** abre uma prévia antes de salvar. A área de prática livre usa o mesmo banco inicial e ferramentas, sem um resultado obrigatório. Trocar de tarefa ou abrir a prática livre reinicia o ambiente; a interface pede confirmação. **Reiniciar banco** descarta as alterações e carrega os dados iniciais. **Interromper** encerra o worker; reinicie para continuar.

A prática não cria tentativas de correção, notas ou progresso persistido. O prazo informado não bloqueia a revisão do laboratório. SQL fica na sessão do navegador e é descartado ao sair/recarregar. O banco de prática não se conecta ao banco do EEVEE. Os critérios de verificação de prática são públicos e não servem para avaliação protegida.

## Questionário de múltipla escolha

Escolha **Questionário de múltipla escolha**. Para cada questão, informe enunciado, alternativas, uma alternativa correta e uma explicação. Configure até 20 envios, a abertura e o prazo. O questionário não utiliza arquivo Python, template de código ou worker de correção.

O estudante seleciona as alternativas e escolhe **Enviar respostas**. Deve responder todas as questões. O servidor valida as alternativas e calcula a proporção de acertos, com peso igual para cada questão. O estudante vê a confirmação de envio, mas não a nota nem as respostas corretas nesse momento. Não existe uma ação de prévia da correção.

O professor acompanha os envios na edição do questionário. **Liberar notas e explicações** mostra aos alunos a nota, suas respostas e a explicação de cada questão, e encerra novos envios. Essa liberação não pode ser desfeita para reabrir tentativas. Depois do primeiro envio, as questões não podem ser alteradas: crie um novo questionário para preservar a interpretação das respostas existentes. Datas e publicação podem ser ajustadas.

As notas deste recurso são independentes das **Provas** de atividades de código; elas ainda não entram no cálculo de notas dessas provas. O painel apresenta os últimos 1.000 envios da atividade. Não há importação automática de PDF ou cadastro automático de turmas/alunos.

## Antes da primeira aula

1. Confirme o conteúdo e a turma. No material de Neemias, quatro pastas contêm a mesma lista SQL, e a turma técnica de Python contém a mesma lista de arquitetura da graduação.
2. Revise ambiguidades nos enunciados e alternativas antes de criar questões. A questão 24 de arquitetura tem opções corretas duplicadas no PDF.
3. Experimente cada objetivo com uma solução correta e uma incorreta e confira o reset.
4. Faça um piloto com uma conta de estudante: abertura, matrícula, prática, envio do questionário e posterior liberação da nota.

## Implantação

Esta funcionalidade requer a migration `1790179200000-LearningActivities`, que cria `learning_activity` e `learning_quiz_attempt`. A implantação deve reconciliar também as migrations pendentes anteriores. Nenhuma migration é aplicada automaticamente por esta alteração em produção.

O build do frontend executa `build:practice-sql` e inclui os arquivos do [PGlite](https://pglite.dev/docs/) em `/practice-sql`; o navegador não depende de um CDN para o laboratório. Preserve essa pasta ao empacotar a aplicação. O Dockerfile existente copia os assets gerados.

O SQL tem timeout de comando no banco e encerramento do worker pelo cliente após 10 segundos (inicialização: 60 segundos). A exibição limita resultados a 10 conjuntos, 200 linhas por conjunto e aproximadamente 64 KB de dados; o motor pode materializar mais dados antes desse limite de exibição. Não há cota rígida de memória do navegador. Esses limites destinam-se à prática local e não a execução de código não confiável no servidor.

Validações locais: testes da API para autorização, redaction de gabaritos, limites, prazos e preservação das questões; testes dos controles de prática; execução do worker SQL real com dados descartáveis; migration up/down e restrições em PostgreSQL isolado. O SQL exige WebAssembly e Web Workers no navegador. Ainda é necessário um piloto em navegador com a API implantada; o ambiente de automação desta sessão não expôs navegadores disponíveis.

Comandos de desenvolvimento:

```text
cd platform-api
npm test
npm run build

cd ../front
npm test -- --runInBand
npm run test:practice-sql
node scripts/test-learning-schema.mjs
npm run build
```
