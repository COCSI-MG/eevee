# CEFETCodeLab-Infrastructure

Repositório para infraestrutura como código do projeto.

## Um pequeno contexto antes de iniciar

Esse repositório só existe basicamente considerando um contexto onpremise de execução do projeto. Se ele fosse ser executado em um ambiente em nuvem de provisionamento dinâmico, como AWS, GCP, Azure, etc, não seria necessário a existência desse repositório, pois a infraestrutura seria provisionada utilizando os recursos da nuvem.

## Como utilizar

### Pré-requisitos

É necessário instalar o Minikube (para execução local).
Versões do [minikube](https://github.com/kubernetes/minikube/releases/)
Também é necessário instalar o docker.
https://docs.docker.com/engine/install/

### Criando a máquina do kubernetes

Para executar o projeto, é necessário que o ambiente tenha o minikube sendo executado
em uma máquina. Se você executa em windows e não tem virtualização habilitada, você pode
usar o driver docker do minikube

```bash
minikube start --driver=docker
```

ou só iniciar o minikube em uma máquina virtual

```bash
minikube start
```

### Criando as dependências

É necessário primeiro executar o build de todas as imagens que serão usadas.

A primeira é a imagem dos workers que serão usados.

### Node Default Worker

```
cd CEFETCodeLab-Node\node
docker build . -t worker-node-default-img
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-default-img:latest
```

### Node NestJS Worker

```
cd CEFETCodeLab-Node\nestjs
docker build . -t worker-node-nestjs-img
```

Agora é necessário incluir a imagem no minikube

```
minikube image load worker-node-nestjs-img:latest
```

### Criando o banco de dados

Para criar o banco de dados, é necessário acessar o diretório `CEFETCodeLab-Infrastructure\codeLabDB\charts` e executar o comando

```
helm upgrade --install code-lab-db .
```

Como só há um ambiente, não foram criados multiplos arquivos de configuração

### Criando o banco de dados (local)

Para criar o banco de dados local, é necessário somente subir uma imagem do docker postgres com o comando

```
docker run --name code-lab-db -e POSTGRES_PASSWORD=code-lab -d -p 5432:5432 postgres
```

Assim você não precisa se preocupar com os dilemas de acessar um banco em uma rede interna como teria que lidar utilizando o minikube.

Se conecte utilizando o usuário e senha padrão `postgres` e `code-lab` respectivamente.
