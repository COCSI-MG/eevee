# EEVEE - Educational Exercices and Video-based E-learning Environment

## _Steps To Reproduce_

1. Construa a infraestrutura do projeto, com detalhamento disponível em [CEFETCodeLab-Infra](./CEFETCodeLab-Infrastructure/README.md).

2. Instale os pacotes NPM para os arquivos a seguir:

### 1. [CEFETCodeLab-Web]

```bash
cd CEFETCodeLab-Web/
npm install
npm run dev
```

### 2. [CEFETCodeLab-Node/nest.js]

```bash
cd CEFETCodeLab-Node/nest.js/
npm install
npm run start
```

### 3. [CEFETCodeLab-SchedulerApi]

Lembre-se de definir uma secret JWT no .env

Pode copiar o [.env.example](CEFETCodeLab-SchedulerApi.env.example) e trocar os valores

```bash
cd CEFETCodeLab-SchedulerApi/
npm install
npm start
```

### 4. [CEFETCodeLab-Node/node.js]

```bash
cd CEFETCodeLab-Node/node/
npm install
npx ts-node app.ts
```

### 5. [filestash]

```bash
cd filestash/
npm install
npx run tsconfig.json
```
