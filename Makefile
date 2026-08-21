GHCR_NAMESPACE ?= ghcr.io/cocsi-mg
TAG            ?= develop
# PRIVATE_KEY_PATH ?= ~/.ssh/id_personal
PRIVATE_KEY_PATH ?= secrets/id_iee_cluster

HELM_RELEASE ?= eevee
NAMESPACE    ?= eevee-cefetrj
CHART        ?= infrastructure/helm/eevee
VALUES       ?= infrastructure/helm/eevee/values.yaml

up: up-minikube up-docker up-platform-api up-front up-assignment-runner

up-infra: up-minikube up-docker

up-minikube:
	@echo Starting minikube
	minikube start

up-docker:
	@echo Starting all services with Docker
	cd infrastructure && docker compose up -d

up-platform-api:
	@echo Starting the Platform API
	cd platform-api && npm run start:dev

up-assignment-runner:
	@echo Starting the Assignment Runner
	cd assignment-runner && npm run start:dev

up-front:
	@echo Starting front-end service
	cd front && npm run dev

down:
	@echo Stopping all services
	minikube stop
	cd infrastructure && docker compose down

.PHONY: images build-images push-images build-workers push-workers
images: build-images push-images

 .PHONY: build-packages build-execution-contracts
build-packages: build-execution-contracts

build-execution-contracts:
	cd packages/execution-contracts && npm install --no-package-lock && npm run build

build-images: \
	build-platform-api \
	build-assignment-runner \
	build-front \
	build-workers

push-images: \
	push-platform-api \
	push-assignment-runner \
	push-front \
	push-workers

build-workers: \
	build-eevee-worker-bootstrap \
	build-worker-node-default \
	build-worker-node-javascript-default \
	build-worker-node-teraorm \
	build-worker-nestjs-default \
	build-worker-node-grpcjs \
	build-worker-node-nextjs-cypress \
	build-worker-react-cypress \
	build-worker-python-default

push-workers: \
	push-eevee-worker-bootstrap \
	push-worker-node-default \
	push-worker-node-javascript-default \
	push-worker-node-teraorm \
	push-worker-nestjs-default \
	push-worker-node-grpcjs \
	push-worker-node-nextjs-cypress \
	push-worker-react-cypress \
	push-worker-python-default

# Per-image targets ----------------------------------------------------------
# Each app/worker has a `build-*` and `push-*` target so a single image can be
# rebuilt without re-running the whole pipeline.
.PHONY: build-platform-api push-platform-api
build-platform-api:
	docker build -t $(GHCR_NAMESPACE)/platform-api:$(TAG) -f platform-api/Dockerfile .
push-platform-api:
	docker push $(GHCR_NAMESPACE)/platform-api:$(TAG)

.PHONY: build-assignment-runner push-assignment-runner
build-assignment-runner:
	docker build -t $(GHCR_NAMESPACE)/assignment-runner:$(TAG) -f assignment-runner/Dockerfile .
push-assignment-runner:
	docker push $(GHCR_NAMESPACE)/assignment-runner:$(TAG)

.PHONY: build-front push-front
build-front:
	docker build -t $(GHCR_NAMESPACE)/front:$(TAG) -f front/Dockerfile .
push-front:
	docker push $(GHCR_NAMESPACE)/front:$(TAG)

.PHONY: build-eevee-worker-bootstrap push-eevee-worker-bootstrap
build-eevee-worker-bootstrap:
	docker build -t $(GHCR_NAMESPACE)/eevee-worker-bootstrap:$(TAG) images/worker-bootstrap
push-eevee-worker-bootstrap:
	docker push $(GHCR_NAMESPACE)/eevee-worker-bootstrap:$(TAG)

.PHONY: build-worker-node-default push-worker-node-default
build-worker-node-default:
	docker build -t $(GHCR_NAMESPACE)/worker-node-default-img:$(TAG) images/node/node-default
push-worker-node-default:
	docker push $(GHCR_NAMESPACE)/worker-node-default-img:$(TAG)

.PHONY: build-worker-node-javascript-default push-worker-node-javascript-default
build-worker-node-javascript-default:
	docker build -t $(GHCR_NAMESPACE)/worker-node-javascript-default-img:$(TAG) images/javascript-default
push-worker-node-javascript-default:
	docker push $(GHCR_NAMESPACE)/worker-node-javascript-default-img:$(TAG)

.PHONY: build-worker-node-teraorm push-worker-node-teraorm
build-worker-node-teraorm:
	docker build -t $(GHCR_NAMESPACE)/worker-node-teraorm-img:$(TAG) images/node/node-teraorm
push-worker-node-teraorm:
	docker push $(GHCR_NAMESPACE)/worker-node-teraorm-img:$(TAG)

.PHONY: build-worker-nestjs-default push-worker-nestjs-default
build-worker-nestjs-default:
	docker build -t $(GHCR_NAMESPACE)/worker-nestjs-default-img:$(TAG) images/node/nest.js
push-worker-nestjs-default:
	docker push $(GHCR_NAMESPACE)/worker-nestjs-default-img:$(TAG)

.PHONY: build-worker-node-grpcjs push-worker-node-grpcjs
build-worker-node-grpcjs:
	docker build -t $(GHCR_NAMESPACE)/worker-node-grpcjs-img:$(TAG) -f images/node/grpc/Dockerfile images/node
push-worker-node-grpcjs:
	docker push $(GHCR_NAMESPACE)/worker-node-grpcjs-img:$(TAG)

.PHONY: build-worker-node-nextjs-cypress push-worker-node-nextjs-cypress
build-worker-node-nextjs-cypress:
	docker build -t $(GHCR_NAMESPACE)/worker-node-nextjs-cypress-img:$(TAG) images/node/next.js-cypress
push-worker-node-nextjs-cypress:
	docker push $(GHCR_NAMESPACE)/worker-node-nextjs-cypress-img:$(TAG)

.PHONY: build-worker-react-cypress push-worker-react-cypress
build-worker-react-cypress:
	docker build -t $(GHCR_NAMESPACE)/worker-react-cypress-img:$(TAG) images/node/reactjs-cypress
push-worker-react-cypress:
	docker push $(GHCR_NAMESPACE)/worker-react-cypress-img:$(TAG)

.PHONY: build-worker-python-default push-worker-python-default
build-worker-python-default:
	docker build -t $(GHCR_NAMESPACE)/worker-python-default-img:$(TAG) images/python-default
push-worker-python-default:
	docker push $(GHCR_NAMESPACE)/worker-python-default-img:$(TAG)

proxy:
	@echo Starting backup VM reverse-proxy tunnel to single entrypoint NodePort
	ssh -i "$(PRIVATE_KEY_PATH)" -N -R 127.0.0.1:43080:127.0.0.1:30001 ubuntu@136.248.94.172

proxy-db:
	@echo "Starting backup VM reverse tunnel for PostgreSQL (5432)"
	ssh -i "$(PRIVATE_KEY_PATH)" -N -R 127.0.0.1:45432:127.0.0.1:5432 ubuntu@136.248.94.172

lint:
	helm lint $(CHART)

template:
	helm template $(HELM_RELEASE) $(CHART) -n $(NAMESPACE) \
		$(if $(wildcard $(VALUES)),-f $(VALUES))

install:
	helm upgrade --install $(HELM_RELEASE) $(CHART) -n $(NAMESPACE) \
		--set front.image.pullPolicy=Always \
		--set platformApi.image.pullPolicy=Always \
		--set assignmentRunner.image.pullPolicy=Always \
		$(if $(wildcard $(VALUES)),-f $(VALUES))

uninstall:
	helm uninstall $(HELM_RELEASE) -n $(NAMESPACE)

status:
	helm status $(HELM_RELEASE) -n $(NAMESPACE)
