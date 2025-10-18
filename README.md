# EEVEE - Educational Exercices and Video-based E-learning Environment

## _Steps To Reproduce_

1. Primeiro, construa a infraestrutura do projeto, com detalhamento disponível em [CEFETCodeLab-Infra/README.md](./CEFETCodeLab-Infrastructure/README.md).

2. Construa as depdências NPM para os arquivos a seguir:

- [CEFETCodeLab-Node/nest.js]
  1. `cd CEFETCodeLab-Node/nest.js/`
  2. `npm install`
  3. `npm run start`
- [CEFETCodeLab-SchedulerApi]
  <br>
  -> Instale o Kubernetes client na seguinte versão:
  <br>
  `npm install kubernetes-client@^9.0.0`

    <br>
    -> Lembre-se de definir uma secret JWT no .env
    <br>

    <br>
    -> Certifique-se de que o container do banco estja UP and RUNNING
    <br>
  `docker ps | grep postgres`
  `docker start code-lab-db`

  1. `npm install`
  2. `docker compose up -d kafka`
  3. `npm start`

  - [CEFETCodeLab-Node/node.js]

  1. `npm install`
  2. `npx ts-node app.ts`

- [CEFETCodeLab-Web]
  <br>
  Talvez precise instalar o next:
  <br>
  `sudo apt install mailutils-mh`

  1. `npm install`
  2. `npm run dev`

- [filestash]
  1. `npm install`
  2. `npx run tsconfig.json`
