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

Para criar o banco de dados, é necessário acessar o diretório [CEFETCodeLab-Infrastructure\codeLabDB\charts](CEFETCodeLab-Infrastructure\codeLabDB\charts) e executar o comando

```
helm upgrade --install code-lab-db .
```

Como só há um ambiente, não foram criados multiplos arquivos de configuração

### Criando o banco de dados (local)

Para criar o banco de dados local, é necessário somente subir uma imagem do docker postgres com o comando

```
docker run --name code-lab-db -e POSTGRES_PASSWORD=code-lab -d -p 5433:5432 postgres
```

Assim você não precisa se preocupar com os dilemas de acessar um banco em uma rede interna como teria que lidar utilizando o minikube.

Se conecte utilizando o usuário e senha padrão `postgres` e `code-lab` respectivamente.

### Atualizando imagem no minikube

Para atualizar a imagem do minikube, é necessário executar os seguintes comandos:

```bash
# 1. Construir a imagem atualizada
docker build . -t worker-node-default-img:latest

# 2. Remover a imagem antiga do minikube (opcional, mas recomendado)
minikube image rm worker-node-default-img:latest

# 3. Carregar a nova imagem no minikube
minikube image load worker-node-default-img:latest

# 4. Deletar os jobs existentes para forçar o uso da nova imagem
kubectl delete jobs -l app=worker-node-default

Verificar se as imagens estão disponíveis

```

Verificar se as imagens estão disponíveis no minikube:
```bash
minikube ssh "docker images | grep worker-node"
```

### Scheduler-Api Kafka
Para que o Scheduler-Api seja executado, há necessidade de uma imagem Kafka, que para este projeto é [docker-compose.yml](CEFETCodeLab-SchedulerApi\docker-compose.yml). 


```bash
cd CEFETCodeLab-SchedulerApi
docker compose up -d
```

## Conclusão
Após construir as dependências pode-se fazer uso do projeto. Lembre-se sempre de verificar se essas imagens estão rodando antes de rodar o projeto.

```bash
CONTAINER ID   IMAGE                                 COMMAND                  CREATED        STATUS       PORTS                                                   
                                                                               NAMES
bd4ea84b6a55   obsidiandynamics/kafdrop:latest       "/kafdrop.sh"            27 hours ago   Up 3 hours   0.0.0.0:19000->9000/tcp, [::]:19000->9000/tcp           
                                                                               eevee-scheduler-kafkadrop
db06ffdbf812   confluentinc/cp-kafka:latest          "/etc/confluent/dock…"   27 hours ago   Up 3 hours   0.0.0.0:9092-9093->9092-9093/tcp, [::]:9092-9093->9092-9093/tcp                                                                        eevee-scheduler-kafka
8298fd81691d   postgres                              "docker-entrypoint.s…"   27 hours ago   Up 3 hours   0.0.0.0:5433->5432/tcp, [::]:5433->5432/tcp             
                                                                               code-lab-db
c32786732975   gcr.io/k8s-minikube/kicbase:v0.0.48   "/usr/local/bin/entr…"   27 hours ago   Up 3 hours   127.0.0.1:61869->22/tcp, 127.0.0.1:61868->2376/tcp, 127.0.0.1:61871->5000/tcp, 127.0.0.1:61867->8443/tcp, 127.0.0.1:61870->32443/tcp   minikube
```