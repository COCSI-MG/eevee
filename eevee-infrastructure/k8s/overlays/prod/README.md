Use este overlay para materializar os valores de producao sem hardcode na base.

Exemplos:

- Validar: `kubectl kustomize eevee-infrastructure/k8s/overlays/prod`
- Aplicar: `kubectl apply -k eevee-infrastructure/k8s/overlays/prod`
- Definir imagem no CI:
  `cd eevee-infrastructure/k8s/overlays/prod && kustomize edit set image scheduler-api=ghcr.io/guilhermepereira25/scheduler-api:${GITHUB_SHA} && kustomize edit set image eevee-front=ghcr.io/guilhermepereira25/eevee-front:${GITHUB_SHA}`
- Definir e-mails e hosts no CI:
  substitua `change-me@example.com`, `frontend.change-me.example.com`, `www.change-me.example.com` e `api.change-me.example.com` por secrets/vars do GitHub antes do `kubectl apply -k`
