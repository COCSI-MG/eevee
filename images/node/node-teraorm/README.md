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

From the repository root, use the worker Makefile.

```bash
make -C images rebuild-node-teraorm
```

Or manual build:

```bash
docker build -t worker-node-teraorm-img:latest images/node/node-teraorm
minikube image load worker-node-teraorm-img:latest
```
