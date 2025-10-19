# EEVEE - Educational Exercices and Video-based E-learning Environment

## _Steps To Reproduce_

1. Construa a infraestrutura do projeto, com detalhamento disponível em [CEFETCodeLab-Infra](./CEFETCodeLab-Infrastructure/README.md).

2. Instale os pacotes NPM para os arquivos a seguir:

### 1. [CEFETCodeLab-Web]
  Talvez precise instalar o next:  `sudo apt install mailutils-mh`
  1. `npm install`
  2. `npm run dev`


### 2. [CEFETCodeLab-Node/nest.js]
  1. `cd CEFETCodeLab-Node/nest.js/`
  2. `npm install`
  3. `npm run start`
  
### 3. [CEFETCodeLab-SchedulerApi]
  
   Lembre-se de definir uma secret JWT no .env
   
   Pode copiar o [.env.example](CEFETCodeLab-SchedulerApi\.env.example) e trocar os valores
  
  1. `npm install`
  2. `npm start`

### 4. [CEFETCodeLab-Node/node.js]

  1. `npm install`
  2. `npx ts-node app.ts`


### 5. [filestash]
  1. `npm install`
  2. `npx run tsconfig.json`
