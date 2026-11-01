import { PythonExample, run } from './seed-python-examples';

const PANDAS_EXAMPLES: PythonExample[] = [
  {
    code: 'PD01',
    title: 'PD01 - Resumo estatístico dos pedidos',
    description: `## Contexto

Uma papelaria registra suas vendas em uma tabela de pedidos, com uma venda por linha. As colunas são: \`id_nfce\`, \`aberto_em\`, \`fechado_em\`, \`pagamento\`, \`vr_total\` (valor do pedido) e \`cancelado\`.

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário com o resumo estatístico da coluna \`vr_total\`, com as chaves:

- \`"quantidade"\`: quantos pedidos têm valor (os vazios não contam);
- \`"total"\`: soma dos valores;
- \`"media"\`: valor médio;
- \`"mediana"\`: valor do meio;
- \`"minimo"\`: menor valor;
- \`"maximo"\`: maior valor;
- \`"desvio_padrao"\`: desvio padrão.

## Regras

1. Valores vazios (\`NaN\`) não entram em nenhum cálculo.
2. Arredonde os números com casas decimais para 2 casas, com \`round(valor, 2)\`.

## Exemplo

Para esta tabela:

| \`vr_total\` |
|---|
| 10.0 |
| 20.0 |
|  |
| 30.0 |

a função deve retornar:

\`\`\`python
{'quantidade': 3,
 'total': 60.0,
 'media': 20.0,
 'mediana': 20.0,
 'minimo': 10.0,
 'maximo': 30.0,
 'desvio_padrao': 10.0}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD01 - Testes de resumo estatístico dos pedidos',
    templateDescription:
      'Testes do exercício PD01 - Resumo estatístico dos pedidos.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "vr_total": [53.8, 18.5, None, 144.4, None, 0.0, 21.9, 19.4, 4.8, 54.9, 9.7, 21.75],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_quantidade():
    assert resultado()["quantidade"] == 10, "quantidade: use count(), que não conta os vazios."


def test_total():
    assert resultado()["total"] == 349.15, "total: use sum() e arredonde para 2 casas."


def test_media():
    assert resultado()["media"] == 34.91, "media: use mean() e arredonde para 2 casas."


def test_mediana():
    assert resultado()["mediana"] == 20.57, "mediana: use median(), não mean()."


def test_minimo():
    assert resultado()["minimo"] == 0.0, "minimo: use min()."


def test_maximo():
    assert resultado()["maximo"] == 144.4, "maximo: use max()."


def test_desvio_padrao():
    assert resultado()["desvio_padrao"] == 42.63, "desvio_padrao: use std() do pandas e arredonde para 2 casas."


def test_tabela_pequena():
    df = pd.DataFrame({
        "vr_total": [10.0, 20.0, None, 30.0],
    })
    assert main(df) == {'quantidade': 3, 'total': 60.0, 'media': 20.0, 'mediana': 20.0, 'minimo': 10.0, 'maximo': 30.0, 'desvio_padrao': 10.0}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD02',
    title: 'PD02 - Análise das formas de pagamento',
    description: `## Contexto

Uma papelaria registra suas vendas em uma tabela de pedidos, com uma venda por linha. As colunas são: \`id_nfce\`, \`aberto_em\`, \`fechado_em\`, \`pagamento\`, \`vr_total\` (valor do pedido) e \`cancelado\`.

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário em que cada chave é uma forma de pagamento e o valor é outro dicionário com \`pedidos\`, \`total\`, \`media\` e \`percentual\`.

## Regras

1. Considere só os pedidos não cancelados (\`cancelado\` igual a \`False\`) que têm \`vr_total\`.
2. \`pedidos\` é a quantidade de pedidos da forma de pagamento, \`total\` é a soma de \`vr_total\`, \`media\` é o valor médio e \`percentual\` é quanto a forma representa do total vendido (\`total da forma / total geral * 100\`).
3. Arredonde os números para 2 casas.
4. As formas de pagamento devem aparecer da maior para a menor \`total\`.

## Exemplo

Para esta tabela:

| \`pagamento\` | \`vr_total\` | \`cancelado\` |
|---|---|---|
| PIX | 10.0 | False |
| PIX | 30.0 | False |
| Dinheiro | 5.0 | False |
| PIX |  | False |
| Dinheiro | 100.0 | True |

a função deve retornar:

\`\`\`python
{'PIX': {'pedidos': 2,
         'total': 40.0,
         'media': 20.0,
         'percentual': 88.89},
 'Dinheiro': {'pedidos': 1,
              'total': 5.0,
              'media': 5.0,
              'percentual': 11.11}}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD02 - Testes de análise das formas de pagamento',
    templateDescription:
      'Testes do exercício PD02 - Análise das formas de pagamento.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "pagamento": ['Cartao de Debito', 'Dinheiro', 'Nao informado', 'Cartao de Credito', 'Nao informado', 'Cartao de Debito', 'Dinheiro', 'PIX', 'Cartao de Credito', 'PIX', 'Cartao de Debito', 'Dinheiro'],
    "vr_total": [53.8, 18.5, None, 144.4, None, 0.0, 21.9, 19.4, 4.8, 54.9, 9.7, 21.75],
    "cancelado": [False, False, False, False, False, True, False, False, False, False, False, False],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_cartao_de_credito():
    assert resultado()["Cartao de Credito"] == {'pedidos': 2, 'total': 149.2, 'media': 74.6, 'percentual': 42.73}, "Cartao de Credito: filtre os cancelados e os sem valor, agrupe com groupby(\\"pagamento\\") e use size(), sum() e mean()."


def test_pix():
    assert resultado()["PIX"] == {'pedidos': 2, 'total': 74.3, 'media': 37.15, 'percentual': 21.28}, "PIX: filtre os cancelados e os sem valor, agrupe com groupby(\\"pagamento\\") e use size(), sum() e mean()."


def test_cartao_de_debito():
    assert resultado()["Cartao de Debito"] == {'pedidos': 2, 'total': 63.5, 'media': 31.75, 'percentual': 18.19}, "Cartao de Debito: filtre os cancelados e os sem valor, agrupe com groupby(\\"pagamento\\") e use size(), sum() e mean()."


def test_dinheiro():
    assert resultado()["Dinheiro"] == {'pedidos': 3, 'total': 62.15, 'media': 20.72, 'percentual': 17.8}, "Dinheiro: filtre os cancelados e os sem valor, agrupe com groupby(\\"pagamento\\") e use size(), sum() e mean()."


def test_ordem_do_maior_para_o_menor_total():
    assert list(resultado()) == ['Cartao de Credito', 'PIX', 'Cartao de Debito', 'Dinheiro'], "As formas de pagamento devem vir da maior para a menor total."


def test_tabela_pequena():
    df = pd.DataFrame({
        "pagamento": ['PIX', 'PIX', 'Dinheiro', 'PIX', 'Dinheiro'],
        "vr_total": [10.0, 30.0, 5.0, None, 100.0],
        "cancelado": [False, False, False, False, True],
    })
    assert main(df) == {'PIX': {'pedidos': 2, 'total': 40.0, 'media': 20.0, 'percentual': 88.89}, 'Dinheiro': {'pedidos': 1, 'total': 5.0, 'media': 5.0, 'percentual': 11.11}}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD03',
    title: 'PD03 - Qualidade dos dados dos pedidos',
    description: `## Contexto

Uma papelaria registra suas vendas em uma tabela de pedidos, com uma venda por linha. As colunas são: \`id_nfce\`, \`aberto_em\`, \`fechado_em\`, \`pagamento\`, \`vr_total\` (valor do pedido) e \`cancelado\`.

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário que mostra o quanto a tabela de pedidos está completa, com as chaves:

- \`"pedidos"\`: total de linhas da tabela;
- \`"cancelados"\`: quantos pedidos foram cancelados;
- \`"percentual_cancelados"\`: \`cancelados / pedidos * 100\`;
- \`"sem_valor"\`: quantos pedidos não têm \`vr_total\`;
- \`"percentual_sem_valor"\`: \`sem_valor / pedidos * 100\`;
- \`"sem_fechamento"\`: quantos pedidos não têm \`fechado_em\`.

## Regras

1. As contagens devem ser números inteiros.
2. Arredonde os percentuais para 2 casas.

## Exemplo

Para esta tabela:

| \`id_nfce\` | \`fechado_em\` | \`vr_total\` | \`cancelado\` |
|---|---|---|---|
| 1 | 2024-01-01 | 10.0 | False |
| 2 |  |  | True |
| 3 | 2024-01-02 | 5.0 | False |
| 4 | 2024-01-03 |  | False |

a função deve retornar:

\`\`\`python
{'pedidos': 4,
 'cancelados': 1,
 'percentual_cancelados': 25.0,
 'sem_valor': 2,
 'percentual_sem_valor': 50.0,
 'sem_fechamento': 1}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD03 - Testes de qualidade dos dados dos pedidos',
    templateDescription:
      'Testes do exercício PD03 - Qualidade dos dados dos pedidos.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "id_nfce": [20246, 20264, 20269, 20335, 20941, 21182, 24468, 24941, 29502, 29550, 33539, 33552],
    "fechado_em": ['2023-01-02', '2023-01-04', None, '2023-01-09', None, '2023-03-15', '2024-01-03', '2024-02-24', '2025-05-05', '2025-05-08', '2026-05-16', '2026-05-18'],
    "vr_total": [53.8, 18.5, None, 144.4, None, 0.0, 21.9, 19.4, 4.8, 54.9, 9.7, 21.75],
    "cancelado": [False, False, False, False, False, True, False, False, False, False, False, False],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_pedidos():
    assert resultado()["pedidos"] == 12, "pedidos: use len(df)."


def test_cancelados():
    assert resultado()["cancelados"] == 1, "cancelados: some a coluna cancelado: cada True vale 1."


def test_percentual_cancelados():
    assert resultado()["percentual_cancelados"] == 8.33, "percentual_cancelados: divida cancelados por pedidos, multiplique por 100 e arredonde."


def test_sem_valor():
    assert resultado()["sem_valor"] == 2, "sem_valor: use isna().sum() em vr_total."


def test_percentual_sem_valor():
    assert resultado()["percentual_sem_valor"] == 16.67, "percentual_sem_valor: divida sem_valor por pedidos, multiplique por 100 e arredonde."


def test_sem_fechamento():
    assert resultado()["sem_fechamento"] == 2, "sem_fechamento: use isna().sum() em fechado_em."


def test_tabela_pequena():
    df = pd.DataFrame({
        "id_nfce": [1, 2, 3, 4],
        "fechado_em": ['2024-01-01', None, '2024-01-02', '2024-01-03'],
        "vr_total": [10.0, None, 5.0, None],
        "cancelado": [False, True, False, False],
    })
    assert main(df) == {'pedidos': 4, 'cancelados': 1, 'percentual_cancelados': 25.0, 'sem_valor': 2, 'percentual_sem_valor': 50.0, 'sem_fechamento': 1}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD04',
    title: 'PD04 - Resumo das vendas dos itens',
    description: `## Contexto

Uma papelaria registra os produtos de cada venda em uma tabela de itens, com um produto vendido por linha. As colunas são: \`id_item\`, \`id_nfce\` (pedido), \`xProd\` (nome do produto), \`qCom\` (quantidade), \`vUnCom\` (preço unitário) e \`vDesc\` (desconto).

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário com o resumo das vendas, em que o valor de cada linha é \`qCom * vUnCom - vDesc\`, com as chaves:

- \`"itens"\`: quantidade de linhas;
- \`"unidades"\`: soma de \`qCom\`;
- \`"faturamento"\`: soma dos valores das linhas;
- \`"valor_medio"\`: média dos valores das linhas;
- \`"maior_item"\`: maior valor de uma linha;
- \`"menor_item"\`: menor valor de uma linha;
- \`"pedidos"\`: quantidade de pedidos diferentes (\`id_nfce\` distintos);
- \`"itens_por_pedido"\`: \`itens / pedidos\`.

## Regras

1. \`itens\` e \`pedidos\` devem ser números inteiros.
2. Arredonde os demais números para 2 casas.

## Exemplo

Para esta tabela:

| \`id_item\` | \`id_nfce\` | \`qCom\` | \`vUnCom\` | \`vDesc\` |
|---|---|---|---|---|
| 1 | 10 | 2.0 | 10.0 | 1.0 |
| 2 | 10 | 1.0 | 5.0 | 0.0 |
| 3 | 11 | 3.0 | 1.0 | 0.0 |

a função deve retornar:

\`\`\`python
{'itens': 3,
 'unidades': 6.0,
 'faturamento': 27.0,
 'valor_medio': 9.0,
 'maior_item': 19.0,
 'menor_item': 3.0,
 'pedidos': 2,
 'itens_por_pedido': 1.5}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD04 - Testes de resumo das vendas dos itens',
    templateDescription:
      'Testes do exercício PD04 - Resumo das vendas dos itens.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "id_item": [32187, 32188, 32213, 32214, 32215, 32362, 32363, 33504, 33505, 34021, 34022, 40174, 40175, 41440, 41441, 41442, 49612, 49613, 49614, 49679, 49680, 56635, 56636, 56650, 56651],
    "id_nfce": [20246, 20246, 20264, 20264, 20264, 20335, 20335, 20941, 20941, 21182, 21182, 24468, 24468, 24941, 24941, 24941, 29502, 29502, 29502, 29550, 29550, 33539, 33539, 33552, 33552],
    "qCom": [2.0, 1.0, 1.0, 1.0, 1.0, 5.0, 1.0, 13.0, 12.0, 4.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 6.0, 1.0, 1.0, 1.0, 1.0, 1.0, 20.0, 63.0, 10.0],
    "vUnCom": [21.9, 10.0, 15.0, 3.0, 0.5, 19.9, 44.9, 1.5, 0.6, 10.0, 4.0, 2.0, 19.9, 12.9, 3.5, 3.0, 0.6, 0.5, 0.7, 50.0, 4.9, 1.7, 0.4, 0.25, 0.6],
    "vDesc": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_itens():
    assert resultado()["itens"] == 25, "itens: use len(df)."


def test_unidades():
    assert resultado()["unidades"] == 152.0, "unidades: some a coluna qCom."


def test_faturamento():
    assert resultado()["faturamento"] == 423.85, "faturamento: calcule qCom * vUnCom - vDesc e some."


def test_valor_medio():
    assert resultado()["valor_medio"] == 16.95, "valor_medio: use mean() na coluna calculada."


def test_maior_item():
    assert resultado()["maior_item"] == 99.5, "maior_item: use max() na coluna calculada."


def test_menor_item():
    assert resultado()["menor_item"] == 0.5, "menor_item: use min() na coluna calculada."


def test_pedidos():
    assert resultado()["pedidos"] == 11, "pedidos: use nunique() em id_nfce."


def test_itens_por_pedido():
    assert resultado()["itens_por_pedido"] == 2.27, "itens_por_pedido: divida itens por pedidos e arredonde."


def test_tabela_pequena():
    df = pd.DataFrame({
        "id_item": [1, 2, 3],
        "id_nfce": [10, 10, 11],
        "qCom": [2.0, 1.0, 3.0],
        "vUnCom": [10.0, 5.0, 1.0],
        "vDesc": [1.0, 0.0, 0.0],
    })
    assert main(df) == {'itens': 3, 'unidades': 6.0, 'faturamento': 27.0, 'valor_medio': 9.0, 'maior_item': 19.0, 'menor_item': 3.0, 'pedidos': 2, 'itens_por_pedido': 1.5}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD05',
    title: 'PD05 - Produtos mais e menos vendidos',
    description: `## Contexto

Uma papelaria registra os produtos de cada venda em uma tabela de itens, com um produto vendido por linha. As colunas são: \`id_item\`, \`id_nfce\` (pedido), \`xProd\` (nome do produto), \`qCom\` (quantidade), \`vUnCom\` (preço unitário) e \`vDesc\` (desconto).

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário com os produtos mais e menos vendidos, somando as unidades (\`qCom\`) de cada produto (\`xProd\`), com as chaves:

- \`"produtos_distintos"\`: quantos produtos diferentes foram vendidos;
- \`"mais_vendido"\`: nome do produto com mais unidades;
- \`"unidades_mais_vendido"\`: unidades desse produto;
- \`"menos_vendido"\`: nome do produto com menos unidades;
- \`"unidades_menos_vendido"\`: unidades desse produto;
- \`"media_por_produto"\`: média de unidades por produto, arredondada para 2 casas.

## Regras

1. Some as unidades de cada produto antes de comparar: o mesmo produto pode aparecer em várias linhas.
2. Em caso de empate, vale o primeiro nome em ordem alfabética.

## Exemplo

Para esta tabela:

| \`xProd\` | \`qCom\` |
|---|---|
| caneta | 2.0 |
| lapis | 5.0 |
| caneta | 4.0 |
| borracha | 1.0 |

a função deve retornar:

\`\`\`python
{'produtos_distintos': 3,
 'mais_vendido': 'caneta',
 'unidades_mais_vendido': 6.0,
 'menos_vendido': 'borracha',
 'unidades_menos_vendido': 1.0,
 'media_por_produto': 4.0}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD05 - Testes de produtos mais e menos vendidos',
    templateDescription:
      'Testes do exercício PD05 - Produtos mais e menos vendidos.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "xProd": ['resma a4 report', 'a3', 'porta-retrato', 'folha impressao', 'folha acesso', 'caderno 160 fls pro', 'lapis 24 cores faber', 'folha impressao', 'folha impressao', 'folha plast pollassil a3', 'folha plast pollassil a4', 'fita durex md', 'porta-durex gr', 'bolas de gas', 'folha impressao', 'folha impressao', 'folha impressao', 'folha acesso', 'envelope a4 pt', 'lamina estilete larga', 'grafite tilibra', 'cartolina dupla face', 'folha copia', 'folha copia pb a4', 'envelope a4 pt'],
    "qCom": [2.0, 1.0, 1.0, 1.0, 1.0, 5.0, 1.0, 13.0, 12.0, 4.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 6.0, 1.0, 1.0, 1.0, 1.0, 1.0, 20.0, 63.0, 10.0],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_produtos_distintos():
    assert resultado()["produtos_distintos"] == 18, "produtos_distintos: use nunique() em xProd."


def test_mais_vendido():
    assert resultado()["mais_vendido"] == 'folha copia pb a4', "mais_vendido: agrupe com groupby(\\"xProd\\")[\\"qCom\\"].sum() e use idxmax()."


def test_unidades_mais_vendido():
    assert resultado()["unidades_mais_vendido"] == 63.0, "unidades_mais_vendido: use max() nas unidades agrupadas."


def test_menos_vendido():
    assert resultado()["menos_vendido"] == 'a3', "menos_vendido: use idxmin() nas unidades agrupadas."


def test_unidades_menos_vendido():
    assert resultado()["unidades_menos_vendido"] == 1.0, "unidades_menos_vendido: use min() nas unidades agrupadas."


def test_media_por_produto():
    assert resultado()["media_por_produto"] == 8.44, "media_por_produto: use mean() nas unidades agrupadas e arredonde."


def test_tabela_pequena():
    df = pd.DataFrame({
        "xProd": ['caneta', 'lapis', 'caneta', 'borracha'],
        "qCom": [2.0, 5.0, 4.0, 1.0],
    })
    assert main(df) == {'produtos_distintos': 3, 'mais_vendido': 'caneta', 'unidades_mais_vendido': 6.0, 'menos_vendido': 'borracha', 'unidades_menos_vendido': 1.0, 'media_por_produto': 4.0}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD06',
    title: 'PD06 - Relação entre preço e quantidade',
    description: `## Contexto

Uma papelaria registra os produtos de cada venda em uma tabela de itens, com um produto vendido por linha. As colunas são: \`id_item\`, \`id_nfce\` (pedido), \`xProd\` (nome do produto), \`qCom\` (quantidade), \`vUnCom\` (preço unitário) e \`vDesc\` (desconto).

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário que mostra se os clientes compram mais unidades dos produtos baratos, com as chaves:

- \`"covariancia"\`: covariância entre \`qCom\` e \`vUnCom\`;
- \`"correlacao"\`: correlação entre \`qCom\` e \`vUnCom\` (de -1 a 1);
- \`"quantidade_media_baratos"\`: média de \`qCom\` dos itens com \`vUnCom\` até 5 (inclusive);
- \`"quantidade_media_caros"\`: média de \`qCom\` dos itens com \`vUnCom\` acima de 5.

## Regras

1. Arredonde tudo para 2 casas.
2. Covariância e correlação negativas indicam que, quando o preço sobe, a quantidade tende a cair.

## Exemplo

Para esta tabela:

| \`qCom\` | \`vUnCom\` |
|---|---|
| 10.0 | 1.0 |
| 8.0 | 5.0 |
| 1.0 | 20.0 |
| 2.0 | 30.0 |

a função deve retornar:

\`\`\`python
{'covariancia': -54.67,
 'correlacao': -0.92,
 'quantidade_media_baratos': 9.0,
 'quantidade_media_caros': 1.5}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD06 - Testes de relação entre preço e quantidade',
    templateDescription:
      'Testes do exercício PD06 - Relação entre preço e quantidade.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "qCom": [2.0, 1.0, 1.0, 1.0, 1.0, 5.0, 1.0, 13.0, 12.0, 4.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 6.0, 1.0, 1.0, 1.0, 1.0, 1.0, 20.0, 63.0, 10.0],
    "vUnCom": [21.9, 10.0, 15.0, 3.0, 0.5, 19.9, 44.9, 1.5, 0.6, 10.0, 4.0, 2.0, 19.9, 12.9, 3.5, 3.0, 0.6, 0.5, 0.7, 50.0, 4.9, 1.7, 0.4, 0.25, 0.6],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_covariancia():
    assert resultado()["covariancia"] == -41.18, "covariancia: use df[\\"qCom\\"].cov(df[\\"vUnCom\\"])."


def test_correlacao():
    assert resultado()["correlacao"] == -0.24, "correlacao: use df[\\"qCom\\"].corr(df[\\"vUnCom\\"])."


def test_quantidade_media_baratos():
    assert resultado()["quantidade_media_baratos"] == 8.44, "quantidade_media_baratos: filtre vUnCom <= 5 e tire a média de qCom."


def test_quantidade_media_caros():
    assert resultado()["quantidade_media_caros"] == 1.89, "quantidade_media_caros: filtre vUnCom > 5 e tire a média de qCom."


def test_tabela_pequena():
    df = pd.DataFrame({
        "qCom": [10.0, 8.0, 1.0, 2.0],
        "vUnCom": [1.0, 5.0, 20.0, 30.0],
    })
    assert main(df) == {'covariancia': -54.67, 'correlacao': -0.92, 'quantidade_media_baratos': 9.0, 'quantidade_media_caros': 1.5}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD07',
    title: 'PD07 - Análise de preços do cadastro',
    description: `## Contexto

Uma papelaria mantém o cadastro dos seus produtos em uma tabela, com um produto por linha. As colunas são: \`id_produto\`, \`xProd\` (nome do produto), \`vUnCom\` (preço de venda), \`custo\`, \`qt_estoque\`, \`qt_minima\` e \`qt_maxima\`.

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário com a análise dos preços de venda (\`vUnCom\`), com as chaves:

- \`"produtos"\`: quantos produtos têm preço;
- \`"preco_medio"\`: média dos preços;
- \`"preco_mediano"\`: mediana dos preços;
- \`"desvio_padrao"\`: desvio padrão dos preços;
- \`"amplitude"\`: diferença entre o maior e o menor preço;
- \`"mais_barato"\`: nome (\`xProd\`) do produto mais barato;
- \`"mais_caro"\`: nome (\`xProd\`) do produto mais caro.

## Regras

1. \`produtos\` deve ser um número inteiro.
2. Arredonde os demais números para 2 casas.

## Exemplo

Para esta tabela:

| \`xProd\` | \`vUnCom\` |
|---|---|
| caneta | 2.5 |
| lapis | 1.0 |
| caderno | 15.0 |
| borracha | 0.5 |

a função deve retornar:

\`\`\`python
{'produtos': 4,
 'preco_medio': 4.75,
 'preco_mediano': 1.75,
 'desvio_padrao': 6.89,
 'amplitude': 14.5,
 'mais_barato': 'borracha',
 'mais_caro': 'caderno'}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD07 - Testes de análise de preços do cadastro',
    templateDescription:
      'Testes do exercício PD07 - Análise de preços do cadastro.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "xProd": ['contra-cheque pt.', 'grampo pra grampeador cx c 1000', 'resma a4 report', 'porta-retrato', 'envelope a4 pt', 'grafite tilibra', 'bolas de gas n 8', 'folha copia', 'folha copia pb a4', 'caderno 10 materia', 'lapis 24 cores faber', 'fita durex md', 'lamina estilete larga', 'cartolina dupla face', 'folha plast pollassil a4', 'folha plast pollassil a3', 'folha impressao', 'folha acesso', 'folha impressao', 'folha impressao', 'folha impressao', 'folha impressao fotografico', 'folha pollasil', 'porta-durex gr'],
    "vUnCom": [44.9, 3.5, 27.9, 20.0, 0.6, 4.0, 13.9, 0.4, 0.3, 20.0, 44.9, 2.0, 50.0, 1.7, 4.0, 10.0, 1.25, 0.5, 0.7, 0.3, 0.18, 3.0, 4.0, 9.9],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_produtos():
    assert resultado()["produtos"] == 24, "produtos: use count() em vUnCom."


def test_preco_medio():
    assert resultado()["preco_medio"] == 11.16, "preco_medio: use mean() e arredonde."


def test_preco_mediano():
    assert resultado()["preco_mediano"] == 3.75, "preco_mediano: use median(), não mean()."


def test_desvio_padrao():
    assert resultado()["desvio_padrao"] == 15.59, "desvio_padrao: use std() do pandas e arredonde."


def test_amplitude():
    assert resultado()["amplitude"] == 49.82, "amplitude: subtraia o min() do max()."


def test_mais_barato():
    assert resultado()["mais_barato"] == 'folha impressao', "mais_barato: use idxmin() para achar a linha e pegue o nome com df.loc[linha, \\"xProd\\"]."


def test_mais_caro():
    assert resultado()["mais_caro"] == 'lamina estilete larga', "mais_caro: use idxmax() para achar a linha e pegue o nome com df.loc[linha, \\"xProd\\"]."


def test_tabela_pequena():
    df = pd.DataFrame({
        "xProd": ['caneta', 'lapis', 'caderno', 'borracha'],
        "vUnCom": [2.5, 1.0, 15.0, 0.5],
    })
    assert main(df) == {'produtos': 4, 'preco_medio': 4.75, 'preco_mediano': 1.75, 'desvio_padrao': 6.89, 'amplitude': 14.5, 'mais_barato': 'borracha', 'mais_caro': 'caderno'}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD08',
    title: 'PD08 - Margem de lucro dos produtos',
    description: `## Contexto

Uma papelaria mantém o cadastro dos seus produtos em uma tabela, com um produto por linha. As colunas são: \`id_produto\`, \`xProd\` (nome do produto), \`vUnCom\` (preço de venda), \`custo\`, \`qt_estoque\`, \`qt_minima\` e \`qt_maxima\`.

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário com a análise da margem de cada produto, em que \`margem = vUnCom - custo\`, com as chaves:

- \`"com_custo"\`: quantos produtos têm custo;
- \`"sem_custo"\`: quantos produtos não têm custo;
- \`"margem_media"\`: média das margens, arredondada para 2 casas;
- \`"maior_margem"\`: nome (\`xProd\`) do produto com a maior margem;
- \`"menor_margem"\`: nome (\`xProd\`) do produto com a menor margem;
- \`"com_prejuizo"\`: quantos produtos têm margem negativa.

## Regras

1. Produtos sem \`custo\` ficam fora do cálculo da margem, mas entram na contagem de \`sem_custo\`.
2. As contagens devem ser números inteiros.

## Exemplo

Para esta tabela:

| \`xProd\` | \`vUnCom\` | \`custo\` |
|---|---|---|
| caneta | 2.5 | 1.0 |
| lapis | 1.0 |  |
| caderno | 15.0 | 9.0 |
| borracha | 0.5 | 0.8 |

a função deve retornar:

\`\`\`python
{'com_custo': 3,
 'sem_custo': 1,
 'margem_media': 2.4,
 'maior_margem': 'caderno',
 'menor_margem': 'borracha',
 'com_prejuizo': 1}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD08 - Testes de margem de lucro dos produtos',
    templateDescription:
      'Testes do exercício PD08 - Margem de lucro dos produtos.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "xProd": ['contra-cheque pt.', 'grampo pra grampeador cx c 1000', 'resma a4 report', 'porta-retrato', 'envelope a4 pt', 'grafite tilibra', 'bolas de gas n 8', 'folha copia', 'folha copia pb a4', 'caderno 10 materia', 'lapis 24 cores faber', 'fita durex md', 'lamina estilete larga', 'cartolina dupla face', 'folha plast pollassil a4', 'folha plast pollassil a3', 'folha impressao', 'folha acesso', 'folha impressao', 'folha impressao', 'folha impressao', 'folha impressao fotografico', 'folha pollasil', 'porta-durex gr'],
    "vUnCom": [44.9, 3.5, 27.9, 20.0, 0.6, 4.0, 13.9, 0.4, 0.3, 20.0, 44.9, 2.0, 50.0, 1.7, 4.0, 10.0, 1.25, 0.5, 0.7, 0.3, 0.18, 3.0, 4.0, 9.9],
    "custo": [2.0, 8.0, 9.0, 4.0, 0.4, 4.0, None, None, 1.0, 12.9, 24.9, 1.0, 1.0, 1.2, None, None, None, 0.1, 0.1, 0.25, 0.1, None, None, 4.0],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_com_custo():
    assert resultado()["com_custo"] == 17, "com_custo: remova os sem custo com dropna(subset=[\\"custo\\"]) e conte as linhas."


def test_sem_custo():
    assert resultado()["sem_custo"] == 7, "sem_custo: use isna().sum() em custo."


def test_margem_media():
    assert resultado()["margem_media"] == 9.26, "margem_media: calcule vUnCom - custo só nos produtos com custo e use mean()."


def test_maior_margem():
    assert resultado()["maior_margem"] == 'lamina estilete larga', "maior_margem: use idxmax() na margem e pegue o nome com .loc."


def test_menor_margem():
    assert resultado()["menor_margem"] == 'grampo pra grampeador cx c 1000', "menor_margem: use idxmin() na margem e pegue o nome com .loc."


def test_com_prejuizo():
    assert resultado()["com_prejuizo"] == 2, "com_prejuizo: conte as margens menores que 0."


def test_tabela_pequena():
    df = pd.DataFrame({
        "xProd": ['caneta', 'lapis', 'caderno', 'borracha'],
        "vUnCom": [2.5, 1.0, 15.0, 0.5],
        "custo": [1.0, None, 9.0, 0.8],
    })
    assert main(df) == {'com_custo': 3, 'sem_custo': 1, 'margem_media': 2.4, 'maior_margem': 'caderno', 'menor_margem': 'borracha', 'com_prejuizo': 1}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
  {
    code: 'PD09',
    title: 'PD09 - Situação do estoque',
    description: `## Contexto

Uma papelaria mantém o cadastro dos seus produtos em uma tabela, com um produto por linha. As colunas são: \`id_produto\`, \`xProd\` (nome do produto), \`vUnCom\` (preço de venda), \`custo\`, \`qt_estoque\`, \`qt_minima\` e \`qt_maxima\`.

## Objetivo

Implemente no arquivo \`app.py\` a função \`main(df)\`, que recebe a tabela como um DataFrame do pandas e retorna um dicionário com a situação do estoque (\`qt_estoque\`) em relação aos limites \`qt_minima\` e \`qt_maxima\`, com as chaves:

- \`"estoque_negativo"\`: quantos produtos têm estoque menor que 0;
- \`"abaixo_do_minimo"\`: quantos produtos têm estoque menor que \`qt_minima\`;
- \`"acima_do_maximo"\`: quantos produtos têm estoque maior que \`qt_maxima\`;
- \`"menor_estoque"\`: o menor estoque;
- \`"produto_menor_estoque"\`: nome (\`xProd\`) do produto com o menor estoque;
- \`"maior_estoque"\`: o maior estoque.

## Regras

1. Produtos sem limite cadastrado não contam como abaixo do mínimo nem acima do máximo.
2. As contagens devem ser números inteiros, e os estoques, arredondados para 2 casas.

## Exemplo

Para esta tabela:

| \`xProd\` | \`qt_estoque\` | \`qt_minima\` | \`qt_maxima\` |
|---|---|---|---|
| a | -5.0 | 2.0 | 10.0 |
| b | 7.0 | 5.0 | 10.0 |
| c | 50.0 | 1.0 | 20.0 |
| d | 0.0 |  |  |

a função deve retornar:

\`\`\`python
{'estoque_negativo': 1,
 'abaixo_do_minimo': 1,
 'acima_do_maximo': 1,
 'menor_estoque': -5.0,
 'produto_menor_estoque': 'a',
 'maior_estoque': 50.0}
\`\`\``,
    maxAttempts: 10,
    boilerplateContent: `
# PLEASE DONT RENAME THIS FUNCTION, THE TEST MAY FAIL
def main(df):
    # Escreva sua solução aqui.
`,
    templateTitle: 'PD09 - Testes de situação do estoque',
    templateDescription: 'Testes do exercício PD09 - Situação do estoque.',
    testContent: `import pandas as pd

from app import main

TABELA = {
    "xProd": ['contra-cheque pt.', 'grampo pra grampeador cx c 1000', 'resma a4 report', 'porta-retrato', 'envelope a4 pt', 'grafite tilibra', 'bolas de gas n 8', 'folha copia', 'folha copia pb a4', 'caderno 10 materia', 'lapis 24 cores faber', 'fita durex md', 'lamina estilete larga', 'cartolina dupla face', 'folha plast pollassil a4', 'folha plast pollassil a3', 'folha impressao', 'folha acesso', 'folha impressao', 'folha impressao', 'folha impressao', 'folha impressao fotografico', 'folha pollasil', 'porta-durex gr'],
    "qt_estoque": [-83.0, -134.0, -7407.0, -42.0, -1289.0, 64.0, -224.0, -1179.0, -41463.0, -559.0, -2.0, -726.0, -270.0, -917.0, -960.0, 125.0, -5961.0, 2492.999, -1212.88, -12142.0, -404.0, -5127.0, -58.0, -12.0],
    "qt_minima": [None, 2.0, 2.0, 2.0, 2.0, 2.0, 1.0, 10.0, 2.0, 1.0, 1.0, 1.0, 1.0, 3.0, 3.0, 3.0, 1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 3.0, 2.0],
    "qt_maxima": [None, 10.0, 5.0, 5.0, 5.0, 5.0, 200.0, 200.0, 5.0, 200.0, 200.0, 200.0, 200.0, 5.0, 5.0, 5.0, 200.0, 200.0, 200.0, 5.0, 200.0, 200.0, 5.0, 5.0],
}


def resultado():
    return main(pd.DataFrame(TABELA))


def test_retorna_um_dicionario():
    assert isinstance(resultado(), dict), "main(df) deve retornar um dicionário."


def test_estoque_negativo():
    assert resultado()["estoque_negativo"] == 21, "estoque_negativo: conte os estoques menores que 0."


def test_abaixo_do_minimo():
    assert resultado()["abaixo_do_minimo"] == 20, "abaixo_do_minimo: compare qt_estoque < qt_minima linha a linha e conte os True."


def test_acima_do_maximo():
    assert resultado()["acima_do_maximo"] == 3, "acima_do_maximo: compare qt_estoque > qt_maxima linha a linha e conte os True."


def test_menor_estoque():
    assert resultado()["menor_estoque"] == -41463.0, "menor_estoque: use min() em qt_estoque."


def test_produto_menor_estoque():
    assert resultado()["produto_menor_estoque"] == 'folha copia pb a4', "produto_menor_estoque: use idxmin() e pegue o nome com .loc."


def test_maior_estoque():
    assert resultado()["maior_estoque"] == 2493.0, "maior_estoque: use max() em qt_estoque e arredonde."


def test_tabela_pequena():
    df = pd.DataFrame({
        "xProd": ['a', 'b', 'c', 'd'],
        "qt_estoque": [-5.0, 7.0, 50.0, 0.0],
        "qt_minima": [2.0, 5.0, 1.0, None],
        "qt_maxima": [10.0, 10.0, 20.0, None],
    })
    assert main(df) == {'estoque_negativo': 1, 'abaixo_do_minimo': 1, 'acima_do_maximo': 1, 'menor_estoque': -5.0, 'produto_menor_estoque': 'a', 'maior_estoque': 50.0}, "Com uma tabela pequena o resultado não confere. Refaça as contas à mão."
`,
  },
];

if (require.main === module) {
  run({
    examples: PANDAS_EXAMPLES,
    defaultClassName: 'Ciência de Dados',
    defaultClassDescription:
      'Exercícios de análise de dados com Python e pandas, corrigidos pelo worker Python + pytest do EEVEE.',
    envPrefix: 'PANDAS_SEED',
  }).catch((error) => {
    console.error('Pandas examples seed failed:', error);
    process.exit(1);
  });
}
