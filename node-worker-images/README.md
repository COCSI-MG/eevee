# Worker Execution 

Esse diretório contém imagens Docker usadas para executar workers em um ambiente isolado. Essas imagens são configuradas para fornecer o ambiente necessário para a execução de tarefas específicas, garantindo consistência e reprodutibilidade.

## Execução de Workers

Os Workers depois da mudança para o novo sistema de execução, precisam de um bootstrap para preparar o ambiente de execução, injetar os arquivos de source code e testes.

Os workers devem ser iniciados de forma singular, cada worker pode ter sua particularidade, o bootstrap só é responsável por criar os arquivos, em um init container onde um volume é compartilhado entre eles. 

Quem é responsável por iniciar a aplicação e rodar os testes, é o próprio worker, a partir de um arquivo de trigger, como no [exemplo do trigger do node](./node/trigger.ts). O trigger é o ponto de entrada do worker, onde a aplicação é iniciada e os testes são executados. 

O volume compartilhado, possui um mount em `/app/workspace`, onde os arquivos de source code e testes são criados, a partir da estrutura enviada pelo cliente, e o worker tem acesso a esses arquivos para iniciar a aplicação e rodar os testes.

### Worker Bootstrap 

A estrutura enviada pelo cliente contém outras propriedades que são utilizados carregar os arquivos que foram enviados para o worker, com o objeto `files`, que contém uma estrutura de arquivos que foram criados pelos Alunos e enviado pelo worker na estrutura:

```json
{
  "src/index.js": "console.log('Hello, World!');",
  "src/controller.js": "module.exports = { ... }",
  "src/service.js": "module.exports = { ... }",
}
```

O Worker Bootstrap percorre essa estrutura e cria os arquivos no caminho definido na estrutura do worker, por exemplo, o arquivo `src/index.js` seria criado no caminho `/app/workspace/src/index.js` dentro do container do worker.

Posteriormente é feito o merge entre os arquivos enviados pelo cliente e a estrutura base do worker, para que o worker consiga localizar os arquivos de source code e testes corretamente. Isso é responsabilidade do worker, saber onde os arquivos existem e como utilizá-los para iniciar a aplicação e rodar os testes.

#### Limitações Atuais

- Só executa um comando de teste
- Inicializa a aplicação em modo de desenvolvimento (dev)
- Suporta apenas Node.js como motor de execução
- Só inicia a aplicação para um worker baseado em cypress (React.js + Cypress, por exemplo)

## Imagens Disponíveis

Atualmente, as imagens disponívels suportam apenas motores de execução baseados em Node.js. Cada imagem é otimizada para diferentes versões do Node.js, permitindo que os workers sejam executados com a versão apropriada conforme necessário.

- [node](./node/Dockerfile) - Imagem base para execução de workers utilizando Node.js. Esta imagem pode ser personalizada para incluir bibliotecas ou ferramentas adicionais conforme necessário.

- [React.Js + Cypress](./react-cypress/Dockerfile) - Imagem especializada para execução de testes end-to-end utilizando Cypress em aplicações React.js. Esta imagem inclui todas as dependências necessárias para rodar testes Cypress de forma eficiente.

- [GRPC Node.js](./grpc-node/Dockerfile) - Imagem otimizada para execução de serviços gRPC utilizando Node.js. Esta imagem inclui as bibliotecas e ferramentas necessárias para desenvolver e executar serviços gRPC.

- [NestJs](./nest.js/Dockerfile) - Imagem configurada para executar aplicações desenvolvidas com o framework NestJs. Esta imagem inclui todas as dependências necessárias para rodar aplicações NestJs de forma eficiente.

- [Next.Js](./next.js/Dockerfile) - Imagem especializada para execução de aplicações Next.js. Esta imagem inclui todas as dependências necessárias para rodar aplicações Next.js de forma eficiente.

## Como Utilizar

Existe um Makefile na raiz deste diretório, com alguns comandos úteis para construir e gerenciar as imagens Docker.

Execute o comando `make help` para ver a lista completa de comandos disponíveis:

```bash
make help
```

### Exemplo Construindo uma Imagem React.Js + Cypress

Build da imagem base Node.js:

```bash
make build-cefet-cypress-base
```

Build da imagem base Cypress:

```bash
make build-cypress-base
```

Build da imagem React.Js + Cypress:

```bash
make build-react-cypress
```

Carregar a imagem para o Docker Deamon/ Minikube:

```bash
make load-react-cypress
```

Reconstruir a imagem após alterações no Dockerfile:

```bash
make rebuild-react-cypress
```