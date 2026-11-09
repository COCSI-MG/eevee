# Worker Execution 

Esse diretório contém imagens Docker usadas para executar workers em um ambiente isolado. Essas imagens são configuradas para fornecer o ambiente necessário para a execução de tarefas específicas, garantindo consistência e reprodutibilidade.

## Execução de Workers

Os Workers depois da mudança para o novo sistema de execução, precisam de um bootstrap para preparar o ambiente de execução, injetar os arquivos de source code e testes.

Os workers devem ser iniciados de forma singular, cada worker pode ter sua particularidade, o bootstrap só é responsável por criar os arquivos, em um init container onde um volume é compartilhado entre eles. 

O worker inicia a aplicação e roda os testes pelo seu trigger. Veja o [trigger do Node.js padrão](./node/node-default/trigger.ts).

O bootstrap escreve os arquivos de código e teste sob `/app/src` e `/app/test` no volume compartilhado. O worker usa esses arquivos para iniciar a aplicação e rodar os testes.

### Worker Bootstrap 

Para execuções do workspace, o [bootstrap](./worker-bootstrap/source-snapshot.ts) busca o snapshot na File Storage API e verifica os arquivos antes de escrevê-los no volume do Job. O bootstrap também aceita o mapa `files` nos payloads que ainda carregam código inline:

```json
{
  "src/index.js": "console.log('Hello, World!');",
  "src/controller.js": "module.exports = { ... }",
  "src/service.js": "module.exports = { ... }",
}
```

O Worker Bootstrap percorre essa estrutura e cria os arquivos no caminho definido na estrutura do worker, por exemplo, o arquivo `src/index.js` seria criado no caminho `/app/src/index.js` dentro do container do worker.

Posteriormente é feito o merge entre os arquivos enviados pelo cliente e a estrutura base do worker, para que o worker consiga localizar os arquivos de source code e testes corretamente. Isso é responsabilidade do worker, saber onde os arquivos existem e como utilizá-los para iniciar a aplicação e rodar os testes.

#### Limitações Atuais

- Só executa um comando de teste
- Inicializa a aplicação em modo de desenvolvimento (dev)
- Suporta Node.js e Python como motores de execução
- Só inicia a aplicação para um worker baseado em cypress (React.js + Cypress, por exemplo)

### Utilizando banco de dados

Os workers Node.js e NestJS com banco usam o [Dockerfile dos workers PostgreSQL](./node/postgresql/Dockerfile). Veja os comandos de build e os testes no [guia PostgreSQL](./node/postgresql/README.md).

## Imagens Disponíveis

Atualmente, as imagens disponíveis suportam motores de execução baseados em Node.js e Python. Cada imagem é otimizada para o motor de execução do worker, permitindo que os workers sejam executados de forma apropriada conforme necessário.

- [Worker Bootstrap](./worker-bootstrap/Dockerfile) - Imagem base para o processo de bootstrap dos workers. Esta imagem é responsável por preparar o ambiente de execução, criar os arquivos de source code e testes, e garantir que o worker tenha acesso a esses arquivos para iniciar a aplicação e rodar os testes.

- [Node.js padrão](./node/node-default/Dockerfile) - Imagem para execução de workers utilizando Node.js.

- [JavaScript Default](./javascript-default/Dockerfile) - Imagem Node.js exclusiva para aplicações e testes JavaScript ES Modules, sem toolchain TypeScript.

- [React.js + Cypress](./node/reactjs-cypress/Dockerfile) - Imagem para testes de aplicações React.js com Cypress.

- [gRPC Node.js](./node/grpc/Dockerfile) - Imagem para serviços gRPC em Node.js.

- [NestJS](./node/nest.js/Dockerfile) - Imagem para aplicações NestJS.

- [Next.js + Cypress](./node/next.js-cypress/Dockerfile) - Imagem para testes de aplicações Next.js com Cypress.

- [Python + pytest](./python-default/Dockerfile) - Imagem para execução de exercícios em Python, rodando os testes com pytest. O trigger emite um resumo compatível com o Jest consumido pelo Assignment Runner.

## Como Utilizar

O [Makefile deste diretório](./Makefile) constrói as imagens e as carrega no
Minikube. A partir da raiz do repositório, liste os comandos ou reconstrua o
bootstrap e o worker React.js + Cypress:

```bash
make -C images help
make -C images rebuild-bootstrap rebuild-react
```
