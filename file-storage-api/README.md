# File Storage API

This Node.js HTTP service stores workspace drafts and immutable execution snapshots.
The `source-storage` Deployment is the single writer to the student-source PVC.
Browsers and other services access files over HTTP using scoped, signed grants.

## Local development

After `make setup`, start Minikube and run `make up-file-storage-api` from the
repository root with `platform-api/.env` in place. The command compiles the
service, provisions local storage when needed, and opens the port-forward
after the service is ready.
See the [local development guide](../docs/local-development.md#iniciar-a-file-storage-api).

For standalone testing on Linux with Node.js 22, copy [`.env.example`](./.env.example)
to `.env` and set `EEVEE_STORAGE_SIGNING_SECRET`. Run these commands from the
service directory.

```bash
npm ci
npm run build
node --env-file=.env dist/server.js
```

This uses a local directory. Use the Minikube setup above to test with the PVC.

## HTTP API

Platform API issues browser grants through
`GET /v1/assignment-storage/:assignmentId/workspace/grant`. Staff use
`GET /v1/assignment-storage/:assignmentId/answer-key/grant` for the reference
solution draft. Assignment Runner issues a read grant scoped to one snapshot
for the worker bootstrap.
Send these grants as `Authorization: Bearer <grant>` on `/v1` requests.

| Request | Behavior |
| --- | --- |
| `GET /health` | Reports service readiness. |
| `GET /v1/:scope/workspace` | Returns the current draft manifest, revision, and byte quotas for new saves. |
| `PUT /v1/:scope/workspace` | Commits a JSON `files` map from paths to `{ digest, size }` references. Send the expected revision in `If-Match`. |
| `PUT /v1/:scope/blobs/:digest` | Stores file bytes under their SHA-256 digest. |
| `GET` or `HEAD /v1/:scope/blobs/:digest` | Reads a stored blob or its headers. |
| `POST /v1/:scope/snapshots` | Captures the current draft using JSON `{ revision, kind }`. Regular workspaces accept `preview` and `submission`. Instructor answer-key drafts accept `answer-key`. |
| `GET /v1/:scope/snapshots/:id` or `GET /v1/:scope/snapshots/:id/manifest` | Reads a snapshot manifest. The `/manifest` endpoint validates metadata without reading file bytes. |
| `GET /v1/:scope/snapshots/:id/files` | Returns the manifest and base64-encoded files to the worker bootstrap. Requires a snapshot-scoped grant. |

The service returns `409` when a draft or snapshot request uses a stale revision.
The production gateway exposes browser endpoints under `/storage` and keeps
the worker bundle endpoint internal.

Regular drafts, blobs and snapshots live under `scopes/eevee-u<userId>-a<assignmentId>/`.
The answer-key editor uses `scopes/eevee-u<userId>-a<assignmentId>-answer-key/`
for the instructor's draft, blobs and test runs. Platform API issues grants for
that scope only to staff who manage the assignment. Publishing a reference
solution uses the assignment's existing answer-key record.

## Build and test

The service is written in strict TypeScript and uses Node's HTTP server.
Start with [src/server.ts](./src/server.ts) for configuration and process lifecycle,
[src/http-api.ts](./src/http-api.ts) for routes and request validation, and
[src/store.ts](./src/store.ts) for revision checks and persistence.
The snapshot manifest extends the shared
execution contract used by Platform API and Assignment Runner.

Install and test on Linux from the repository root:

```bash
npm --prefix file-storage-api ci
npm --prefix file-storage-api test
docker build -f file-storage-api/Dockerfile -t eevee-file-storage-api:local .
```

The image runs as UID/GID `1001` and listens on port `3020`. Mount writable
storage at `/var/lib/eevee` and provide `EEVEE_STORAGE_SIGNING_SECRET` from a
Secret. The service stores data under `/var/lib/eevee/source` by default in
the image. The compiled backup CLI is available at `dist/backup.js`.

The [production rollout guide](../docs/file-storage-rollout/SOURCE-STORAGE.md)
covers the image and Helm provisioning. See the
[infrastructure guide](../infrastructure/file-storage/README.md) for Minikube
setup and the backup procedure.
