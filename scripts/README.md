# Scripts para automatizar tarefas

Esse documento auxilia no entendimento e execução dos script presentes nessa pasta, que tem como objetivo automatizar algumas tarefas.

## Carregar imagens docker para o cluster do k3s

Esse script é útil para carregar imagens docker diretamente para o cluster do k3s, evitando a necessidade de fazer push para um registry externo. Serve muito bem para o caso das imagens do worker, que não são publicadas em um registry e tem necessidade de serem carregadas offline para economizar tempo de pull e inicio do job no cluster.

### Uso

Ele espera que o k3s esteja rodando em uma vps, então precisa passar alguns parâmetros para o script, esses abaixo como variáveis de ambiente:

- `VPS_USER`: O usuário para acessar a vps (ex: `root` ou `ubuntu`) - opcional, padrão é `root`
- `VPS_HOST`: O endereço IP ou hostname da vps onde o k3s está rodando - obrigatório
- `VPS_PORT`: A porta SSH para acessar a vps - opcional, padrão é `22`

Um parametro obrigatório é a imagem que deseja carregar para o cluster, que deve ser passada como argumento para o script:

```bash
./load-image.sh <nome-da-imagem:tag>
```

### Processo

O script via `scp` a imagem docker para a vps, e depois executa o comando `k3s ctr images import` para importar a imagem para o cluster do k3s. Após isso, a imagem estará disponível para ser usada nos pods do cluster.