.PHONY: help build-all build-react build-nextjs build-node build-node-teraorm build-nestjs build-grpc build-bootstrap

DOCKER_REGISTRY ?=
IMAGE_TAG ?= latest

# Produces "name:tag" when REGISTRY is empty, or "registry/name:tag" otherwise
IMAGE_PREFIX = $(if $(DOCKER_REGISTRY),$(DOCKER_REGISTRY)/,)

REACT_IMAGE    = worker-react-cypress-img
NEXTJS_IMAGE   = worker-nextjs-cypress-img
NODE_IMAGE     = worker-node-default-img
NODE_TERAORM_IMAGE = worker-node-teraorm-img
NESTJS_IMAGE   = worker-nestjs-default-img
GRPC_IMAGE     = worker-grpc-img
BOOTSTRAP_IMAGE = eevee-worker-bootstrap

help:
	@echo "CEFET EEVEE - Worker Build Commands"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## " }; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Variables:"
	@echo "  DOCKER_REGISTRY - Docker registry to push images (default: docker.io/library)"
	@echo "  IMAGE_TAG       - Tag for the Docker images (default: latest)"

build-all: build-react build-nextjs build-node build-node-teraorm build-nestjs build-grpc build-bootstrap ## Build all worker Docker images (legacy)

build-react: ## Build the React Cypress worker Docker image
	@echo "Building React Cypress worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(REACT_IMAGE):$(IMAGE_TAG) -f ./reactjs-cypress/Dockerfile ./reactjs-cypress
	echo "React Cypress worker Docker image built successfully."

build-nextjs: ## Build the Next.js Cypress worker Docker image
	@echo "Building Next.js Cypress worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NEXTJS_IMAGE):$(IMAGE_TAG) -f ./next.js-cypress/Dockerfile ./next.js-cypress
	echo "Next.js Cypress worker Docker image built successfully."

build-node: ## Build the Node.js default worker Docker image
	@echo "Building Node.js default worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NODE_IMAGE):$(IMAGE_TAG) -f ./node/Dockerfile ./node
	echo "Node.js default worker Docker image built successfully."

build-node-teraorm: ## Build the Node.js TeraORM worker Docker image
	@echo "Building Node.js TeraORM worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NODE_TERAORM_IMAGE):$(IMAGE_TAG) -f ./node-teraorm/Dockerfile ./node-teraorm
	echo "Node.js TeraORM worker Docker image built successfully."

build-nestjs: ## Build the Nest.js default worker Docker image
	@echo "Building Nest.js default worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NESTJS_IMAGE):$(IMAGE_TAG) -f ./nest.js/Dockerfile ./nest.js
	echo "Nest.js default worker Docker image built successfully."

build-grpc: ## Build the gRPC worker Docker image
	@echo "Building gRPC worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(GRPC_IMAGE):$(IMAGE_TAG) -f ./grpc/Dockerfile ./grpc
	echo "gRPC worker Docker image built successfully."

build-bootstrap: ## Build the worker-bootstrap Docker image
	@echo "Building worker-bootstrap Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG) -f ./worker-bootstrap/Dockerfile ./worker-bootstrap
	echo "worker-bootstrap Docker image built successfully."

load-all: load-react load-nextjs load-node load-node-teraorm load-nestjs load-grpc load-bootstrap ## Load all worker Docker images into local Docker daemon

load-react: ## Load the React Cypress worker Docker image into local Docker daemon
	@echo "Loading React Cypress Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(REACT_IMAGE):$(IMAGE_TAG)
	@echo "React Cypress Worker Docker Image loaded successfully."

load-nextjs: ## Load the Next.js Cypress worker Docker image into local Docker daemon
	@echo "Loading Next.js Cypress Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(NEXTJS_IMAGE):$(IMAGE_TAG)
	@echo "Next.js Cypress Worker Docker Image loaded successfully."

load-node: ## Load the Node.js default worker Docker image into local Docker daemon
	@echo "Loading Node.js Default Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(NODE_IMAGE):$(IMAGE_TAG)
	@echo "Node.js Default Worker Docker Image loaded successfully."

load-node-teraorm: ## Load the Node.js TeraORM worker Docker image into local Docker daemon
	@echo "Loading Node.js TeraORM Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(NODE_TERAORM_IMAGE):$(IMAGE_TAG)
	@echo "Node.js TeraORM Worker Docker Image loaded successfully."

load-nestjs: ## Load the Nest.js default worker Docker image into local Docker daemon
	@echo "Loading Nest.js Default Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(NESTJS_IMAGE):$(IMAGE_TAG)
	@echo "Nest.js Default Worker Docker Image loaded successfully."

load-grpc: ## Load the gRPC worker Docker image into local Docker daemon
	@echo "Loading gRPC Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(GRPC_IMAGE):$(IMAGE_TAG)
	@echo "gRPC Worker Docker Image loaded successfully."	

load-bootstrap: ## Load the worker-bootstrap Docker image into local Docker daemon
	@echo "Loading worker-bootstrap Docker image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG)
	@echo "worker-bootstrap Docker image loaded successfully."

rebuild-all: build-all load-all ## Rebuild and load all worker Docker images into local Docker daemon

rebuild-react: build-react load-react ## Rebuild and load the React Cypress worker Docker image into local Docker daemon

rebuild-nextjs: build-nextjs load-nextjs ## Rebuild and load the Next.js Cypress worker Docker image into local Docker daemon

rebuild-node: build-node load-node ## Rebuild and load the Node.js default worker Docker image into local Docker daemon

rebuild-node-teraorm: build-node-teraorm load-node-teraorm ## Rebuild and load the Node.js TeraORM worker Docker image into local Docker daemon

rebuild-nestjs: build-nestjs load-nestjs ## Rebuild and load the Nest.js default worker Docker image into local Docker daemon

rebuild-bootstrap: build-bootstrap load-bootstrap ## Rebuild and load the worker-bootstrap Docker image into local Docker daemon

clean: ## Remove Docker images from local Docker daemon
	@echo "Cleaning up Docker images..."
	-docker rmi $(IMAGE_PREFIX)$(REACT_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NEXTJS_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NODE_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NODE_TERAORM_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NESTJS_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG) || true
	@echo "Docker images cleaned up."

clean-minikube: ## Remove Docker images from minikube
	@echo "Removing Docker images from minikube..."
	-minikube image rm $(IMAGE_PREFIX)$(REACT_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NEXTJS_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NODE_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NODE_TERAORM_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NESTJS_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG) || true
	@echo "Docker images removed from minikube."