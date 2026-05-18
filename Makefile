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
