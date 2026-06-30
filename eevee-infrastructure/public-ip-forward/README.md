# BACKUP STRATEGY - Public DB Debug Proxy (Server -> Local Postgres)

This backup strategy exposes your local PostgreSQL through the public server
`136.248.94.172` on port `80` for temporary debugging sessions.
It uses Dockerized Nginx in TCP stream mode on the VM.

## 1) Local database source

- Local PostgreSQL endpoint: `127.0.0.1:5432`

## 2) VM Docker proxy (Nginx container)

Copy this folder to the server and run Docker Compose from it:

- [docker-compose.yml](./docker-compose.yml)
- [nginx-eevee-public-ip.conf](./nginx-eevee-public-ip.conf)

On the VM at `136.248.94.172`:

```bash
docker compose up -d
```

Notes:

- This compose uses `network_mode: host` so the container can reach
  `127.0.0.1:45432` on the VM.
- If host Nginx is already bound to port `80`, stop/disable it first.
- This file is mounted as `/etc/nginx/nginx.conf` because TCP stream proxying
  requires top-level `stream {}` configuration.

## 3) Start reverse SSH DB tunnel from your local machine

Run this from your local machine (replace `SERVER_USER`):

```bash
ssh -i "C:\\Users\\João Vitor Coimbra\\.ssh\\id_personal" -N \
  -R 127.0.0.1:45432:127.0.0.1:5432 \
  SERVER_USER@136.248.94.172
```

Meaning:

- VM `127.0.0.1:45432` forwards to local PostgreSQL `127.0.0.1:5432`

## 4) Access

Connect from your external client to:

```text
Host: 136.248.94.172
Port: 80
```

Nginx forwards this TCP connection to VM `127.0.0.1:45432`, which the SSH
tunnel forwards to your local PostgreSQL.

## Optional hardening

- Restrict server firewall to trusted source IPs.
- Use `autossh` or a systemd user service to keep tunnel alive.
- Use this only for temporary debugging windows.

## Quick validation

On server:

```bash
docker compose ps
docker compose logs --tail=100
```

From a PostgreSQL client:

```text
136.248.94.172:80
```
