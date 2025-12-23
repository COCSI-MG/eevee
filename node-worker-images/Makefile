.PHONY: help build-all build-react build-nextjs build-node build-nestjs

DOCKER_REGISTRY ?= docker.io/library
IMAGE_TAG ?= latest

CEFET_EEVEE_BASE_IMAGE = cefet-eevee-base-worker
CEFET_CYPRESS_BASE_IMAGE = cefet-eevee-cypress-base
REACT_IMAGE = worker-react-cypress
NEXTJS_IMAGE = worker-nextjs-cypress
NODE_IMAGE = worker-node-default
NESTJS_IMAGE = worker-nestjs-default

help:
	@echo "CEFET EEVEE - Worker Build Commands"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## " }; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Variables:"
	@echo "  DOCKER_REGISTRY - Docker registry to push images (default: docker.io/library)"
	@echo "  IMAGE_TAG       - Tag for the Docker images (default: latest)"

build-cefet-eevee-base: ## Build the CEFET EEVEE Base Docker image
	@echo "Building CEFET EEVEE Base Docker image..."
	docker build -t $(DOCKER_REGISTRY)/$(CEFET_EEVEE_BASE_IMAGE):$(IMAGE_TAG) -f ./worker-bootstrap/Dockerfile ./worker-bootstrap
	echo "CEFET EEVEE Base Docker image built successfully."

build-cefet-cypress-base: ## Build the CEFET EEVEE Cypress Base Docker image
	@echo "Building CEFET EEVEE Cypress Base Docker image..."
	docker build -t $(DOCKER_REGISTRY)/$(CEFET_CYPRESS_BASE_IMAGE):$(IMAGE_TAG) -f ./cypress/Dockerfile ./cypress
	echo "CEFET EEVEE Cypress Base Docker image built successfully."

build-all: build-cefet-eevee-base build-react build-nextjs build-node build-nestjs ## Build all worker Docker images

build-react: ## Build the React Cypress worker Docker image
	@echo "Building React Cypress worker Docker image..."
	docker buildx build -t $(DOCKER_REGISTRY)/$(REACT_IMAGE):$(IMAGE_TAG) -f ./reactjs-cypress/Dockerfile ./
	echo "React Cypress worker Docker image built successfully."

build-nextjs: ## Build the Next.js Cypress worker Docker image
	@echo "Building Next.js Cypress worker Docker image..."
	docker buildx build -t $(DOCKER_REGISTRY)/$(NEXTJS_IMAGE):$(IMAGE_TAG) -f ./nextjs-cypress/Dockerfile ./
	echo "Next.js Cypress worker Docker image built successfully."

build-node: ## Build the Node.js default worker Docker image
	@echo "Building Node.js default worker Docker image..."
	docker buildx build -t $(DOCKER_REGISTRY)/$(NODE_IMAGE):$(IMAGE_TAG) -f ./node/Dockerfile ./
	echo "Node.js default worker Docker image built successfully."

build-nestjs: ## Build the Nest.js default worker Docker image
	@echo "Building Nest.js default worker Docker image..."
	docker buildx build -t $(DOCKER_REGISTRY)/$(NESTJS_IMAGE):$(IMAGE_TAG) -f ./nest.js/Dockerfile --target nestjs ./nest.js
	echo "Nest.js default worker Docker image built successfully."

load-all: load-react load-nextjs load-node load-nestjs ## Load all worker Docker images into local Docker daemon

load-react: ## Load the React Cypress worker Docker image into local Docker daemon
	@echo "Loading React Cypress Worker Docker Image into minikube..."
	minikube image load $(DOCKER_REGISTRY)/$(REACT_IMAGE):$(IMAGE_TAG)
	@echo "React Cypress Worker Docker Image loaded successfully."

load-nextjs: ## Load the Next.js Cypress worker Docker image into local Docker daemon
	@echo "Loading Next.js Cypress Worker Docker Image into minikube..."
	minikube image load $(DOCKER_REGISTRY)/$(NEXTJS_IMAGE):$(IMAGE_TAG)
	@echo "Next.js Cypress Worker Docker Image loaded successfully."

load-node: ## Load the Node.js default worker Docker image into local Docker daemon
	@echo "Loading Node.js Default Worker Docker Image into minikube..."
	minikube image load $(DOCKER_REGISTRY)/$(NODE_IMAGE):$(IMAGE_TAG)
	@echo "Node.js Default Worker Docker Image loaded successfully."

load-nestjs: ## Load the Nest.js default worker Docker image into local Docker daemon
	@echo "Loading Nest.js Default Worker Docker Image into minikube..."
	minikube image load $(DOCKER_REGISTRY)/$(NESTJS_IMAGE):$(IMAGE_TAG)
	@echo "Nest.js Default Worker Docker Image loaded successfully."	

rebuild-all: build-all load-all ## Rebuild and load all worker Docker images into local Docker daemon

rebuild-react: build-react load-react ## Rebuild and load the React Cypress worker Docker image into local Docker daemon

rebuild-nextjs: build-nextjs load-nextjs ## Rebuild and load the Next.js Cypress worker Docker image into local Docker daemon

rebuild-node: build-node load-node ## Rebuild and load the Node.js default worker Docker image into local Docker daemon

rebuild-nestjs: build-nestjs load-nestjs ## Rebuild and load the Nest.js default worker Docker image into local Docker daemon

clean: ## Remove Docker images from local Docker daemon
	@echo "Cleaning up Docker images..."
	-docker rmi $(DOCKER_REGISTRY)/$(REACT_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(DOCKER_REGISTRY)/$(NEXTJS_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(DOCKER_REGISTRY)/$(NODE_IMAGE):$(IMAGE_TAG) || true
	-docker rmi $(DOCKER_REGISTRY)/$(NESTJS_IMAGE):$(IMAGE_TAG) || true
	@echo "Docker images cleaned up."

clean-minikube: ## Remove Docker images from minikube
	@echo "Removing Docker images from minikube..."
	-minikube image rm $(DOCKER_REGISTRY)/$(REACT_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(DOCKER_REGISTRY)/$(NEXTJS_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(DOCKER_REGISTRY)/$(NODE_IMAGE):$(IMAGE_TAG) || true
	-minikube image rm $(DOCKER_REGISTRY)/$(NESTJS_IMAGE):$(IMAGE_TAG) || true
	@echo "Docker images removed from minikube."

test-reactjs:
	@echo "Running examples for ReactJS Cypress worker..."
	docker run --rm \
		-v $(PWD)/reactjs-cypress/examples/inputs:/app/inputs \
		$(DOCKER_REGISTRY)/$(REACT_IMAGE):$(IMAGE_TAG)