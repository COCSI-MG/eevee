GHCR_NAMESPACE ?= ghcr.io/cocsi-mg
TAG            ?= develop
# PRIVATE_KEY_PATH ?= ~/.ssh/id_personal
PRIVATE_KEY_PATH ?= C:\\Users\\João Vitor Coimbra\\.ssh\\id_personal

HELM_RELEASE ?= eevee
NAMESPACE    ?= eevee-cefetrj
CHART        ?= eevee-infrastructure/helm/eevee
VALUES       ?= eevee-infrastructure/helm/eevee/values.local.yaml
VM_PUBLIC_IP ?= 136.248.94.172

up: up-minikube up-docker up-scheduler

up-infra: up-minikube up-docker

up-minikube:
	@echo Starting minikube
	minikube start

up-docker:
	@echo Starting all services with Docker
	cd eevee-infrastructure && docker compose up -d

up-scheduler:
	@echo Starting only the scheduler-api service
	cd scheduler-api && npm run start:dev

up-front:
	@echo Starting front-end service
	cd front && npm run dev

down:
	@echo Stopping all services
	minikube stop
	cd eevee-infrastructure && docker compose down

up-queue-worker:
	@echo Starting queue worker 
	cd scheduler-api && npm run start:worker:dev

.PHONY: images build-images push-images build-workers push-workers
images: build-images push-images

build-images: \
	build-scheduler-api \
	build-front \
	build-workers

push-images: \
	push-scheduler-api \
	push-front \
	push-workers

build-workers: \
	build-eevee-worker-bootstrap \
	build-worker-node-default \
	build-worker-node-teraorm \
	build-worker-nestjs-default \
	build-worker-node-grpcjs \
	build-worker-node-nextjs-cypress \
	build-worker-react-cypress

push-workers: \
	push-eevee-worker-bootstrap \
	push-worker-node-default \
	push-worker-node-teraorm \
	push-worker-nestjs-default \
	push-worker-node-grpcjs \
	push-worker-node-nextjs-cypress \
	push-worker-react-cypress

# Per-image targets ----------------------------------------------------------
# Each app/worker has a `build-*` and `push-*` target so a single image can be
# rebuilt without re-running the whole pipeline.
.PHONY: build-scheduler-api push-scheduler-api
build-scheduler-api:
	docker build -t $(GHCR_NAMESPACE)/scheduler-api:$(TAG) scheduler-api
push-scheduler-api:
	docker push $(GHCR_NAMESPACE)/scheduler-api:$(TAG)

.PHONY: build-front push-front
build-front:
	docker build -t $(GHCR_NAMESPACE)/front:$(TAG) front
push-front:
	docker push $(GHCR_NAMESPACE)/front:$(TAG)

.PHONY: build-eevee-worker-bootstrap push-eevee-worker-bootstrap
build-eevee-worker-bootstrap:
	docker build -t $(GHCR_NAMESPACE)/eevee-worker-bootstrap:$(TAG) node-worker-images/worker-bootstrap
push-eevee-worker-bootstrap:
	docker push $(GHCR_NAMESPACE)/eevee-worker-bootstrap:$(TAG)

.PHONY: build-worker-node-default push-worker-node-default
build-worker-node-default:
	docker build -t $(GHCR_NAMESPACE)/worker-node-default-img:$(TAG) node-worker-images/node
push-worker-node-default:
	docker push $(GHCR_NAMESPACE)/worker-node-default-img:$(TAG)

.PHONY: build-worker-node-teraorm push-worker-node-teraorm
build-worker-node-teraorm:
	docker build -t $(GHCR_NAMESPACE)/worker-node-teraorm-img:$(TAG) node-worker-images/node-teraorm
push-worker-node-teraorm:
	docker push $(GHCR_NAMESPACE)/worker-node-teraorm-img:$(TAG)

.PHONY: build-worker-nestjs-default push-worker-nestjs-default
build-worker-nestjs-default:
	docker build -t $(GHCR_NAMESPACE)/worker-nestjs-default-img:$(TAG) node-worker-images/nest.js
push-worker-nestjs-default:
	docker push $(GHCR_NAMESPACE)/worker-nestjs-default-img:$(TAG)

.PHONY: build-worker-node-grpcjs push-worker-node-grpcjs
build-worker-node-grpcjs:
	docker build -t $(GHCR_NAMESPACE)/worker-node-grpcjs-img:$(TAG) -f node-worker-images/grpc/Dockerfile node-worker-images
push-worker-node-grpcjs:
	docker push $(GHCR_NAMESPACE)/worker-node-grpcjs-img:$(TAG)

.PHONY: build-worker-node-nextjs-cypress push-worker-node-nextjs-cypress
build-worker-node-nextjs-cypress:
	docker build -t $(GHCR_NAMESPACE)/worker-node-nextjs-cypress-img:$(TAG) node-worker-images/next.js-cypress
push-worker-node-nextjs-cypress:
	docker push $(GHCR_NAMESPACE)/worker-node-nextjs-cypress-img:$(TAG)

.PHONY: build-worker-react-cypress push-worker-react-cypress
build-worker-react-cypress:
	docker build -t $(GHCR_NAMESPACE)/worker-react-cypress-img:$(TAG) node-worker-images/reactjs-cypress
push-worker-react-cypress:
	docker push $(GHCR_NAMESPACE)/worker-react-cypress-img:$(TAG)

proxy:
	@echo Starting the VM reverse-proxy tunnel
	ssh -i "$(PRIVATE_KEY_PATH)" -N -R 127.0.0.1:43000:127.0.0.1:3000 -R 127.0.0.1:43010:127.0.0.1:3010 ubuntu@136.248.94.172

lint:
	helm lint $(CHART)

template:
	helm template $(HELM_RELEASE) $(CHART) -n $(NAMESPACE) \
		$(if $(wildcard $(VALUES)),-f $(VALUES))

template-vm:
	helm template $(HELM_RELEASE) $(CHART) -n $(NAMESPACE) \
		--set ingress.enabled=true \
		--set front.apiUrl=http://$(VM_PUBLIC_IP)/v1 \
		--set config.CORS_ALLOWED_ORIGINS=http://$(VM_PUBLIC_IP)

install:
	helm upgrade --install $(HELM_RELEASE) $(CHART) -n $(NAMESPACE) \
		$(if $(wildcard $(VALUES)),-f $(VALUES))

install-vm:
	helm upgrade --install $(HELM_RELEASE) $(CHART) -n $(NAMESPACE) \
		--set ingress.enabled=true \
		--set front.apiUrl=http://$(VM_PUBLIC_IP)/v1 \
		--set config.CORS_ALLOWED_ORIGINS=http://$(VM_PUBLIC_IP)

uninstall:
	helm uninstall $(HELM_RELEASE) -n $(NAMESPACE)

status:
	helm status $(HELM_RELEASE) -n $(NAMESPACE)
