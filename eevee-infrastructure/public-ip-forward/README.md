# ALTERNATIVE DEPLOYMENT STRATEGY - Public IP Forward Setup for the VM (Server -> Local Eeeve)

This is the setup used by the virtual machine: it exposes your local Eeeve instance through the public server `136.248.94.172` without changing local ports.
It uses Dockerized Nginx on the public VM (no host Nginx install needed).

## 1) Keep local ports as-is

- Frontend: `localhost:3000`
- Scheduler API: `localhost:3010`

## 2) Frontend env on your local machine

Use [front/.env.public-ip.example](../../front/.env.public-ip.example) as reference and set:

```env
NEXT_PUBLIC_API_URL=http://136.248.94.172/v1
```

## 3) Scheduler API CORS env on your local machine

In your local Scheduler API env, add:

```env
CORS_ALLOWED_ORIGINS=http://136.248.94.172
```

This is supported by [scheduler-api/src/main.ts](../../scheduler-api/src/main.ts).

## 4) VM Docker proxy (Nginx container)

Copy this folder to the server and run Docker Compose from it:

- [docker-compose.yml](./docker-compose.yml)
- [nginx-eevee-public-ip.conf](./nginx-eevee-public-ip.conf)

On the VM at `136.248.94.172`:

```bash
docker compose up -d
```

Notes:

- This compose uses `network_mode: host` so the container can reach `127.0.0.1:43080` on the VM.
- If host Nginx is already bound to port 80, stop/disable it first.

## 5) Start reverse SSH tunnel from your local machine

Run this from your local machine (replace `SERVER_USER`):

```bash
ssh -i "C:\\Users\\João Vitor Coimbra\\.ssh\\id_personal" -N \
  -R 127.0.0.1:43080:127.0.0.1:18080 \
  SERVER_USER@136.248.94.172
```

Meaning:

- VM `127.0.0.1:43080` forwards to the local ingress controller port `127.0.0.1:18080`

## 6) Access

Open:

```text
http://136.248.94.172
```

Nginx forwards frontend traffic to the ingress controller using the correct `Host` header for each route, and the ingress controller sends the request to the frontend or API service inside the cluster.

## Optional hardening

- Put this behind HTTPS on the server.
- Use `autossh` or a systemd user service to keep tunnel alive.
- Restrict server firewall to your expected source IPs.

## Quick validation

On server:

```bash
docker compose ps
docker compose logs --tail=100
```

From any browser:

```text
http://136.248.94.172
```
