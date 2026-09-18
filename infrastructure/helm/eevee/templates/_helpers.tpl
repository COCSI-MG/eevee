{{/*
Common labels shared across resources.
*/}}
{{- define "eevee.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{/*
Standard imagePullSecrets snippet — emits the block only when a name is set.
*/}}
{{- define "eevee.imagePullSecrets" -}}
{{- if .Values.imagePullSecret.name }}
imagePullSecrets:
  - name: {{ .Values.imagePullSecret.name }}
{{- end }}
{{- end -}}

{{/*
Entrypoint gateway nginx config. Kept as its own named template (rather than
inlined in entrypoint-gateway.yaml) so the Deployment's checksum/config
annotation can include it without recursively including the whole file.
*/}}
{{- define "eevee.entrypointNginxConf" -}}
# Only send "Connection: upgrade" for actual WebSocket upgrade requests;
# forcing it on every request breaks keep-alive on plain REST polling.
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

server {
  listen {{ .Values.entrypointGateway.containerPort }};
  server_name _;

  location /api/v1/ {
    proxy_pass http://platform-api-service:{{ .Values.platformApi.containerPort }}/v1/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }

  # Socket.IO's handshake path is fixed at /socket.io/ regardless of
  # namespace, so it needs its own route straight to platform-api — it does
  # NOT live under /api/v1/ and must not fall through to the front-end.
  location /socket.io/ {
    proxy_pass http://platform-api-service:{{ .Values.platformApi.containerPort }}/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }

  location / {
    proxy_pass http://eevee-front-service:80;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }
}
{{- end -}}

{{/*
Standard application env block used by Platform API workloads and Assignment Runner.
DB_* values from the ConfigMap but expose them to the app as PG_*.
*/}}
{{- define "eevee.appEnv" -}}
- name: PG_HOST
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: DB_HOST
- name: PG_PORT
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: DB_PORT
- name: PG_USERNAME
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: DB_USERNAME
- name: PG_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: DB_PASSWORD
- name: PG_DATABASE
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: DB_DATABASE
- name: REDIS_HOST
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: REDIS_HOST
- name: REDIS_PORT
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: REDIS_PORT
- name: GROQ_API_KEY
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: GROQ_API_KEY
- name: GMAIL_APP_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.secrets.name }}
      key: GMAIL_APP_PASSWORD
- name: GMAIL_USER
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: GMAIL_USER
- name: CORS_ALLOWED_ORIGINS
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: CORS_ALLOWED_ORIGINS
- name: AUTH_COOKIE_DOMAIN
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: AUTH_COOKIE_DOMAIN
- name: FRONT_URL
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: FRONT_URL
- name: FRONT_ROUTE_RESET_PASSWORD
  valueFrom:
    configMapKeyRef:
      name: eevee-config
      key: FRONT_ROUTE_RESET_PASSWORD
{{- end -}}

{{/*
Worker image env vars consumed by Assignment Runner. These
override the local defaults baked into worker.constants.ts.
*/}}
{{/* Preserve repository and registry port; discard legacy tags and digests. */}}
{{- define "eevee.latestWorkerImage" -}}
{{- $repository := regexReplaceAll ":[^/:]+$" (first (splitList "@" .)) "" -}}
{{- printf "%s:latest" $repository -}}
{{- end -}}

{{- define "eevee.workerImageEnv" -}}
- name: WORKER_BOOTSTRAP_IMAGE
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.bootstrap | quote }}
- name: WORKER_IMAGE_NODE_DEFAULT
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeDefault | quote }}
- name: WORKER_IMAGE_JAVASCRIPT_DEFAULT
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.javascriptDefault | quote }}
- name: WORKER_IMAGE_NODE_TERAORM
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeTeraorm | quote }}
- name: WORKER_IMAGE_NODE_NESTJS
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeNestjs | quote }}
- name: WORKER_IMAGE_NODE_GRPCJS
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeGrpcjs | quote }}
- name: WORKER_IMAGE_NODE_NEXTJS_CYPRESS
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeNextjsCypress | quote }}
- name: WORKER_IMAGE_NODE_REACTJS_CYPRESS
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeReactjsCypress | quote }}
- name: WORKER_IMAGE_PYTHON_DEFAULT
  value: {{ include "eevee.latestWorkerImage" (.Values.workerImages.pythonDefault | default "ghcr.io/cocsi-mg/worker-python-default-img:latest") | quote }}
- name: WORKER_IMAGE_NODE_DEFAULT_POSTGRESQL
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeDefaultPostgresql | quote }}
- name: WORKER_IMAGE_NODE_NESTJS_POSTGRESQL
  value: {{ include "eevee.latestWorkerImage" .Values.workerImages.nodeNestjsPostgresql | quote }}
{{- end -}}

{{/*
Env vars consumed by Assignment Runner to configure the Kubernetes
Jobs they spawn at runtime (namespace, nodeSelector, pull secrets, etc.).
*/}}
{{- define "eevee.jobRuntimeEnv" -}}
- name: K8S_NAMESPACE
  value: {{ .Release.Namespace | quote }}
- name: K8S_JOB_IMAGE_PULL_POLICY
  value: "Always"
{{- if .Values.imagePullSecret.name }}
- name: K8S_JOB_IMAGE_PULL_SECRETS
  value: {{ .Values.imagePullSecret.name | quote }}
{{- end }}
{{- if .Values.nodeSelector }}
- name: K8S_JOB_NODE_SELECTOR
  value: {{ .Values.nodeSelector | toJson | quote }}
{{- end }}
{{- end -}}

{{/*
nodeSelector block for pod specs.
*/}}
{{- define "eevee.nodeSelector" -}}
{{- if .Values.nodeSelector }}
nodeSelector:
  {{- toYaml .Values.nodeSelector | nindent 2 }}
{{- end }}
{{- end -}}
