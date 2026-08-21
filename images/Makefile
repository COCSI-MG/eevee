.PHONY: build-all build-node build-node-teraorm build-nestjs build-javascript-default build-grpc build-bootstrap build-python-default build-react build-nextjs load-all load-react load-nextjs load-node load-node-teraorm load-nestjs load-grpc load-bootstrap load-python-default rebuild-all rebuild-react rebuild-nextjs rebuild-node rebuild-node-teraorm rebuild-nestjs rebuild-bootstrap rebuild-python-default help clean clean-minikube

DOCKER_REGISTRY ?=
IMAGE_TAG ?= latest

# Produces "name:tag" when REGISTRY is empty, or "registry/name:tag" otherwise
IMAGE_PREFIX = $(if $(DOCKER_REGISTRY),$(DOCKER_REGISTRY)/,)

REACT_IMAGE    = worker-react-cypress-img
NEXTJS_IMAGE   = worker-nextjs-cypress-img
NODE_IMAGE     = worker-node-default-img
JAVASCRIPT_DEFAULT_IMAGE = worker-node-javascript-default-img
NODE_TERAORM_IMAGE = worker-node-teraorm-img
NESTJS_IMAGE   = worker-nestjs-default-img
GRPC_IMAGE     = worker-grpc-img
PYTHON_IMAGE   = worker-python-default-img
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

build-all: build-react build-nextjs build-node build-javascript-default build-node-teraorm build-nestjs build-grpc build-python-default build-bootstrap ## Build all worker Docker images (legacy)

build-react: ## Build the React Cypress worker Docker image
	@echo "Building React Cypress worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(REACT_IMAGE):$(IMAGE_TAG) -f ./node/reactjs-cypress/Dockerfile ./node/reactjs-cypress
	echo "React Cypress worker Docker image built successfully."

build-nextjs: ## Build the Next.js Cypress worker Docker image
	@echo "Building Next.js Cypress worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NEXTJS_IMAGE):$(IMAGE_TAG) -f ./node/next.js-cypress/Dockerfile ./node/next.js-cypress
	echo "Next.js Cypress worker Docker image built successfully."

build-node: ## Build the Node.js default worker Docker image
	@echo "Building Node.js default worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NODE_IMAGE):$(IMAGE_TAG) -f ./node/node-default/Dockerfile ./node/node-default
	echo "Node.js default worker Docker image built successfully."

build-javascript-default: ## Build the JavaScript default worker Docker image
	@echo "Building JavaScript default worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(JAVASCRIPT_DEFAULT_IMAGE):$(IMAGE_TAG) -f ./javascript-default/Dockerfile ./javascript-default
	echo "JavaScript default worker Docker image built successfully."

build-node-teraorm: ## Build the Node.js TeraORM worker Docker image
	@echo "Building Node.js TeraORM worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NODE_TERAORM_IMAGE):$(IMAGE_TAG) -f ./node/node-teraorm/Dockerfile ./node/node-teraorm
	echo "Node.js TeraORM worker Docker image built successfully."

build-nestjs: ## Build the Nest.js default worker Docker image
	@echo "Building Nest.js default worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(NESTJS_IMAGE):$(IMAGE_TAG) -f ./node/nest.js/Dockerfile ./node/nest.js
	echo "Nest.js default worker Docker image built successfully."

build-grpc: ## Build the gRPC worker Docker image
	@echo "Building gRPC worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(GRPC_IMAGE):$(IMAGE_TAG) -f ./node/grpc/Dockerfile ./node/grpc
	echo "gRPC worker Docker image built successfully."

build-python-default: ## Build the Python pytest worker Docker image
	@echo "Building Python pytest worker Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(PYTHON_IMAGE):$(IMAGE_TAG) -f ./python-default/Dockerfile ./python-default
	echo "Python pytest worker Docker image built successfully."

build-bootstrap: ## Build the worker-bootstrap Docker image
	@echo "Building worker-bootstrap Docker image..."
	docker buildx build -t $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG) -f ./worker-bootstrap/Dockerfile ./worker-bootstrap
	echo "worker-bootstrap Docker image built successfully."

load-all: load-react load-nextjs load-node load-javascript-default load-node-teraorm load-nestjs load-grpc load-python-default load-bootstrap ## Load all worker Docker images into local Docker daemon

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

load-javascript-default: ## Load the JavaScript default worker Docker image into minikube
	@echo "Loading JavaScript Default Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(JAVASCRIPT_DEFAULT_IMAGE):$(IMAGE_TAG)
	@echo "JavaScript Default Worker Docker Image loaded successfully."

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

load-python-default: ## Load the Python pytest worker Docker image into local Docker daemon
	@echo "Loading Python pytest Worker Docker Image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(PYTHON_IMAGE):$(IMAGE_TAG)
	@echo "Python pytest Worker Docker Image loaded successfully."

load-bootstrap: ## Load the worker-bootstrap Docker image into local Docker daemon
	@echo "Loading worker-bootstrap Docker image into minikube..."
	minikube image load $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG)
	@echo "worker-bootstrap Docker image loaded successfully."

rebuild-all: build-all load-all ## Rebuild and load all worker Docker images into local Docker daemon

rebuild-react: build-react load-react ## Rebuild and load the React Cypress worker Docker image into local Docker daemon

rebuild-nextjs: build-nextjs load-nextjs ## Rebuild and load the Next.js Cypress worker Docker image into local Docker daemon

rebuild-node: build-node load-node ## Rebuild and load the Node.js default worker Docker image into local Docker daemon

rebuild-javascript-default: build-javascript-default load-javascript-default ## Rebuild and load the JavaScript default worker Docker image into minikube

rebuild-node-teraorm: build-node-teraorm load-node-teraorm ## Rebuild and load the Node.js TeraORM worker Docker image into local Docker daemon

rebuild-nestjs: build-nestjs load-nestjs ## Rebuild and load the Nest.js default worker Docker image into local Docker daemon

rebuild-python-default: build-python-default load-python-default ## Rebuild and load the Python pytest worker Docker image into local Docker daemon

rebuild-bootstrap: build-bootstrap load-bootstrap ## Rebuild and load the worker-bootstrap Docker image into local Docker daemon

clean: ## Remove Docker images from local Docker daemon
	@echo "Cleaning up Docker images..."
	-docker rmi $(IMAGE_PREFIX)$(REACT_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NEXTJS_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NODE_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(JAVASCRIPT_DEFAULT_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NODE_TERAORM_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(NESTJS_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(GRPC_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(PYTHON_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG) || true
	@echo "Docker images cleaned up."

clean-minikube: ## Remove Docker images from minikube
	@echo "Removing Docker images from minikube..."
	-minikube image rm $(IMAGE_PREFIX)$(REACT_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NEXTJS_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NODE_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(JAVASCRIPT_DEFAULT_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NODE_TERAORM_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(NESTJS_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(GRPC_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(PYTHON_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(IMAGE_PREFIX)$(BOOTSTRAP_IMAGE):$(IMAGE_TAG) || true
	@echo "Docker images removed from minikube."
