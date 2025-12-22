# Worker Execution 

Esse diretório contém imagens Docker usadas para executar workers em um ambiente isolado. Essas imagens são configuradas para fornecer o ambiente necessário para a execução de tarefas específicas, garantindo consistência e reprodutibilidade.


## Execução de Workers

Os Workers depois da mudança para o novo sistema de execução, precisam de uma imagem base para ser executada. Essa imagem é baseada no Node.js e pode ser personalizada conforme as necessidades do projeto.

Atualmente o arquivo [Dockerfile](./worker-bootstrap/Dockerfile) presente no diretório `worker-bootstrap` é utilizado como base para a criação das imagens de execução dos workers.

Ao criar um novo worker, é necessário utilizar a imagem base que inclui o motor de execução base, que lida com múltiplos arquivos, instalas dependências, entre outras funcionalidades.

Os workers esperam que os arquivos injetados pelo cliente estejam localizados no diretóios `/app/inputs` dentro do container Docker que vai executar o worker.

### Worker Definition

Um worker é definido por um arquivo JSON que especifica alguns comportamentos do worker, como os comandos de testes, arquivos que devem ser injetados na pasta source da aplicação, comandos de inicialização, entre outros.

Precisamos definir primeiro, uma estrutura base para o worker. Nessa primeira estrutura, definimos os caminhos onde os arquivos de source code e testes estarão localizados, além dos comandos que serão executados para iniciar a aplicação e rodar os testes.

A estrutura abaixo, é a que deve ser previamente definida para o worker funcionar corretamente:

```json
{
    "srcPath": "/app/src",
    "testPath": "/app/test-app/cypress/e2e",
    "startCommands": [
        "npm run dev"
    ],
    "testCommands": [
        "cd /app/test-app && npm run test"
    ]
}
```

A estrutura enviada pelo cliente contém outras propriedades que são utilizados carregar os arquivos que foram enviados para o worker, com o objeto `files`, que contém uma estrutura de arquivos que foram criados pelos Alunos e enviado pelo worker na estrutura:

```json
{
  "files": {
    "id": "src",
    "children": [
      {
        "id": "index.js",
        "children": null,
        "type": "file",
        "content": "console.log('Hello, World')"
      },
      {
        "id": "controller",
        "children": [
          {
            "id": "user-controller.js",
            "children": null,
            "type": "file",
            "content": "algum código js"
          }
        ],
        "type": "folder",
        "content": null
      }
    ],
    "type": "folder",
    "content": null
  },
  "dependencies": {
    "express": "^4.17.1"
  },
}
```

Posteriormente é feito o merge entre os arquivos enviados pelo cliente e a estrutura base do worker, para que o worker consiga localizar os arquivos de source code e testes corretamente.

O bootstrap do worker, que está presente no [Dockerfile](./worker-bootstrap/Dockerfile) do diretório `worker-bootstrap`, a partir dessa estrutura, cria os arquivos enviados na pasta previamente definida em `srcPath` e `testPath`, instala as dependências enviadas no objeto `dependencies` e executa os comandos definidos em `startCommands` e `testCommands`. Além de criar toda estrutura de pastas e arquivos necessários para o funcionamento do teste.

Até o presente momento o cliente está injetando os arquivos de testes no caminho `/app/inputs/tests`. Dessa forma, o worker bootstrap copia os arquivos de testes dessa pasta para o caminho definido em `testPath`, que no exemplo acima é `/app/test-app/cypress/e2e`.

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

## Testando um exemplo com a Imagem React.Js + Cypress

Para testar a imagem React.Js + Cypress, você pode usar o script de exemplo localizado em `./examples/react-cypress`.

Certifique-se de ter as imagens necessárias construídas.

Execute o comando a partir do diretório raiz do projeto:

```bash
make test-reactjs
```

Output esperado é de sucesso nos testes Cypress.