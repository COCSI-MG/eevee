# Node TeraORM Worker

This worker image is a Node.js profile preloaded with TeraORM dependencies to reduce setup time for study assignments that compare direct SQL/SDK style against ORM style.

## Included packages

- teraorm
- @teraorm/bigquery
- @teraorm/nestjs

It keeps the same runtime contract as the default node worker:

- student source is written under /app/src
- validation tests are written under /app/test
- trigger runs jest and emits JSON summary

## Build and load

```bash
cd images
make build-node-teraorm
make load-node-teraorm
```

Or manual build:

```bash
docker build -t worker-node-teraorm-img:latest -f ./node-teraorm/Dockerfile ./node-teraorm
minikube image load worker-node-teraorm-img:latest
```
