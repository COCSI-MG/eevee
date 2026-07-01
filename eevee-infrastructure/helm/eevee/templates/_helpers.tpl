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
Standard env block used by scheduler-api and queue-worker. Both consume
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
{{- end -}}

{{/*
Worker image env vars consumed by scheduler-api and queue-worker. These
override the GHCR defaults baked into worker.constants.ts.
*/}}
{{- define "eevee.workerImageEnv" -}}
- name: WORKER_BOOTSTRAP_IMAGE
  value: {{ .Values.workerImages.bootstrap | quote }}
- name: WORKER_IMAGE_NODE_DEFAULT
  value: {{ .Values.workerImages.nodeDefault | quote }}
- name: WORKER_IMAGE_NODE_TERAORM
  value: {{ .Values.workerImages.nodeTeraorm | quote }}
- name: WORKER_IMAGE_NODE_NESTJS
  value: {{ .Values.workerImages.nodeNestjs | quote }}
- name: WORKER_IMAGE_NODE_GRPCJS
  value: {{ .Values.workerImages.nodeGrpcjs | quote }}
- name: WORKER_IMAGE_NODE_NEXTJS_CYPRESS
  value: {{ .Values.workerImages.nodeNextjsCypress | quote }}
- name: WORKER_IMAGE_NODE_REACTJS_CYPRESS
  value: {{ .Values.workerImages.nodeReactjsCypress | quote }}
- name: WORKER_IMAGE_NODE_DEFAULT_POSTGRESQL
  value: {{ .Values.workerImages.nodeDefaultPostgresql | quote }}
- name: WORKER_IMAGE_NODE_NESTJS_POSTGRESQL
  value: {{ .Values.workerImages.nodeNestjsPostgresql | quote }}
{{- end -}}

{{/*
Env vars consumed by scheduler-api / queue-worker to configure the Kubernetes
Jobs they spawn at runtime (namespace, nodeSelector, pull secrets, etc.).
*/}}
{{- define "eevee.jobRuntimeEnv" -}}
- name: K8S_NAMESPACE
  value: {{ .Release.Namespace | quote }}
- name: K8S_JOB_IMAGE_PULL_POLICY
  value: "IfNotPresent"
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
