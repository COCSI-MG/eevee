# Ciência de Dados com Python e pandas

Módulo de exercícios de pandas (`PD01` a `PD09`) com uma amostra real das vendas
de uma papelaria. São três análises para cada tabela (pedidos, itens e
produtos), cada uma sobre um único DataFrame, com as funções básicas do pandas
(`count`, `sum`, `mean`, `median`, `min`, `max`, `std`, `cov`, `corr`,
`groupby`...).

As atividades, os enunciados, os testes, o gabarito e os dados ficam todos em
`platform-api/scripts/seed-pandas-examples.ts` e são cadastrados no EEVEE com
`npm run seed:pandas-examples` (veja `platform-api/README.md`). O gabarito fica
só na atividade, oculto para os alunos até o professor liberar.

## Como os exercícios usam os dados

Os dados chegam ao aluno em `src/dados.py`, com três dicionários: `pedidos`,
`itens` e `produtos` (cada chave é uma coluna). O código inicial importa a
tabela do exercício, e o `main` monta o DataFrame antes de chamar a função de
análise:

```python
from dados import pedidos


def main(pedidos):
    df = pd.DataFrame(pedidos)
    return resumo_valores(df)
```

O `dados.py` não aparece no workspace do aluno: ele fica salvo na atividade
(`assignment.supportFiles`) e o servidor grava o arquivo em `src/dados.py` a
cada execução (Executar, Enviar para Correção e o Executar do gabarito),
sobrescrevendo um `dados.py` que o aluno tenha criado. Os testes importam o
mesmo arquivo, então aluno e correção usam sempre os mesmos dados.

## Tabelas

As tabelas se ligam por `itens.id_nfce → pedidos.id_nfce` e
`itens.cEAN → produtos.cEAN`.

- `pedidos` (uma venda por linha): `id_nfce`, `aberto_em`, `fechado_em`,
  `pagamento`, `vr_total` e `cancelado`.
- `itens` (os produtos de cada venda): `id_item`, `id_nfce`, `cProd`, `cEAN`,
  `xProd`, `uCom`, `qCom` (quantidade), `vUnCom` (preço unitário) e `vDesc`
  (desconto).
- `produtos` (cadastro): `id_produto`, `cProd`, `cEAN`, `xProd`, `uCom`,
  `vUnCom` (preço de venda), `custo`, `qt_estoque`, `qt_minima` e `qt_maxima`.

A amostra mantém de propósito problemas reais dos dados, porque aparecem nos
exercícios: `vr_total` vazio e pedidos cancelados (PD01 a PD03), custo vazio e
custo maior que o preço (PD08) e estoques negativos (PD09).
