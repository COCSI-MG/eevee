import { PythonExample, seedPythonModule } from './seed-python-examples';

const DEFAULT_CLASS_NAME = 'Ciência de Dados com Python e pandas';
const DEFAULT_CLASS_DESCRIPTION =
  'Exercícios de pandas com dados reais de vendas de uma papelaria (pedidos, itens e produtos), executados pelo worker Python + pytest do EEVEE.';

const DATA_FILE_CONTENT = `pedidos = {
    "id_nfce": [20246, 20264, 20269, 20335, 20941, 21182, 24468, 24941, 29502, 29550, 33539, 33552],
    "aberto_em": ["2023-01-02", "2023-01-03", "2023-01-04", "2023-01-09", "2023-02-27", "2023-03-15", "2024-01-03", "2024-02-24", "2025-05-05", "2025-05-08", "2026-05-16", "2026-05-18"],
    "fechado_em": ["2023-01-02", "2023-01-04", None, "2023-01-09", None, "2023-03-15", "2024-01-03", "2024-02-24", "2025-05-05", "2025-05-08", "2026-05-16", "2026-05-18"],
    "pagamento": ["Cartao de Debito", "Dinheiro", "Nao informado", "Cartao de Credito", "Nao informado", "Cartao de Debito", "Dinheiro", "PIX", "Cartao de Credito", "PIX", "Cartao de Debito", "Dinheiro"],
    "vr_total": [53.8, 18.5, None, 144.4, None, 0.0, 21.9, 19.4, 4.8, 54.9, 9.7, 21.75],
    "cancelado": [False, False, False, False, False, True, False, False, False, False, False, False],
}

itens = {
    "id_item": [32187, 32188, 32213, 32214, 32215, 32362, 32363, 33504, 33505, 34021, 34022, 40174, 40175, 41440, 41441, 41442, 49612, 49613, 49614, 49679, 49680, 56635, 56636, 56650, 56651],
    "id_nfce": [20246, 20246, 20264, 20264, 20264, 20335, 20335, 20941, 20941, 21182, 21182, 24468, 24468, 24941, 24941, 24941, 29502, 29502, 29502, 29550, 29550, 33539, 33539, 33552, 33552],
    "cProd": ["resma a4 report", "PLAST. POLLASIL - XGG", "porta-retrato", "folha impressao", "folha acesso", "caderno 160 fls pro", "lapis 24 cores faber", "folha impressao", "folha impressao", "folha plast pollassil a3", "folha plast pollassil a4", "fita durex md", "porta-durex gr", "bolas de gas", "folha impressao", "folha impressao", "folha impressao", "folha acesso", "envelope a4 pt", "lamina estilete larga", "grafite tilibra", "cartolina dupla face", "folha copia", "folha copia  pb a4", "envelope a4 pt"],
    "cEAN": ["000000024600", "000000042260", "000000024723", "000000039826", "000000040198", "000000030298", "000000030908", "000000041096", "000000040488", "000000036351", "000000036290", "000000031851", "000000042697", "000000028844", "000000040686", "000000040204", "000000040488", "000000040198", "000000026635", "000000034975", "000000027212", "000000036085", "000000029148", "000000029704", "000000026635"],
    "xProd": ["resma a4 report", "a3", "porta-retrato", "folha impressao", "folha acesso", "caderno 160 fls pro", "lapis 24 cores faber", "folha impressao", "folha impressao", "folha plast pollassil a3", "folha plast pollassil a4", "fita durex md", "porta-durex gr", "bolas de gas", "folha impressao", "folha impressao", "folha impressao", "folha acesso", "envelope a4 pt", "lamina estilete larga", "grafite tilibra", "cartolina dupla face", "folha copia", "folha copia pb a4", "envelope a4 pt"],
    "uCom": ["UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN"],
    "qCom": [2.0, 1.0, 1.0, 1.0, 1.0, 5.0, 1.0, 13.0, 12.0, 4.0, 2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 6.0, 1.0, 1.0, 1.0, 1.0, 1.0, 20.0, 63.0, 10.0],
    "vUnCom": [21.9, 10.0, 15.0, 3.0, 0.5, 19.9, 44.9, 1.5, 0.6, 10.0, 4.0, 2.0, 19.9, 12.9, 3.5, 3.0, 0.6, 0.5, 0.7, 50.0, 4.9, 1.7, 0.4, 0.25, 0.6],
    "vDesc": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
}

produtos = {
    "id_produto": [2455, 2458, 2460, 2472, 2663, 2721, 2884, 2914, 2970, 3029, 3090, 3185, 3497, 3608, 3629, 3635, 3982, 4019, 4020, 4048, 4068, 4109, 4226, 4269],
    "cProd": ["contra-cheque pt.", "Grampo", "resma a4 report", "porta-retrato", "envelope a4 pt", "grafite tilibra", "bolas de gas n 8", "folha copia", "folha copia  pb a4", "caderno 10 materia", "lapis 24 cores faber", "fita durex md", "lamina estilete larga", "cartolina dupla face", "folha plast pollassil a4", "folha plast pollassil a3", "folha impressao coll", "folha acesso", "folha impressao", "folha impressao", "folha impressao", "folha impressao", "folha pollasil", "porta-durex gr"],
    "cEAN": ["000000024556", "000000024587", "000000024600", "000000024723", "000000026635", "000000027212", "000000028844", "000000029148", "000000029704", "000000030298", "000000030908", "000000031851", "000000034975", "000000036085", "000000036290", "000000036351", "000000039826", "000000040198", "000000040204", "000000040488", "000000040686", "000000041096", "000000042260", "000000042697"],
    "xProd": ["contra-cheque pt.", "grampo pra grampeador cx c 1000", "resma a4 report", "porta-retrato", "envelope a4 pt", "grafite tilibra", "bolas de gas n 8", "folha copia", "folha copia pb a4", "caderno 10 materia", "lapis 24 cores faber", "fita durex md", "lamina estilete larga", "cartolina dupla face", "folha plast pollassil a4", "folha plast pollassil a3", "folha impressao", "folha acesso", "folha impressao", "folha impressao", "folha impressao", "folha impressao fotografico", "folha pollasil", "porta-durex gr"],
    "uCom": ["UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN", "UN"],
    "vUnCom": [44.9, 3.5, 27.9, 20.0, 0.6, 4.0, 13.9, 0.4, 0.3, 20.0, 44.9, 2.0, 50.0, 1.7, 4.0, 10.0, 1.25, 0.5, 0.7, 0.3, 0.18, 3.0, 4.0, 9.9],
    "custo": [2.0, 8.0, 9.0, 4.0, 0.4, 4.0, None, None, 1.0, 12.9, 24.9, 1.0, 1.0, 1.2, None, None, None, 0.1, 0.1, 0.25, 0.1, None, None, 4.0],
    "qt_estoque": [-83.0, -134.0, -7407.0, -42.0, -1289.0, 64.0, -224.0, -1179.0, -41463.0, -559.0, -2.0, -726.0, -270.0, -917.0, -960.0, 125.0, -5961.0, 2492.999, -1212.88, -12142.0, -404.0, -5127.0, -58.0, -12.0],
    "qt_minima": [None, 2.0, 2.0, 2.0, 2.0, 2.0, 1.0, 10.0, 2.0, 1.0, 1.0, 1.0, 1.0, 3.0, 3.0, 3.0, 1.0, 1.0, 1.0, 2.0, 1.0, 1.0, 3.0, 2.0],
    "qt_maxima": [None, 10.0, 5.0, 5.0, 5.0, 5.0, 200.0, 200.0, 5.0, 200.0, 200.0, 200.0, 200.0, 5.0, 5.0, 5.0, 200.0, 200.0, 200.0, 5.0, 200.0, 200.0, 5.0, 5.0],
}
`;

const SUPPORT_FILES = { 'src/dados.py': DATA_FILE_CONTENT };

const DATA_SECTION = `### Dados

O arquivo \`dados.py\`, que o EEVEE adiciona quando o seu código roda, tem três dicionários com uma amostra real das vendas de uma papelaria: \`pedidos\`, \`itens\` e \`produtos\`. Cada chave é uma coluna. O código inicial já importa a tabela do exercício, e o \`main\` monta o DataFrame com \`df = pd.DataFrame(...)\` antes de chamar a sua função.

- \`pedidos\`: \`id_nfce\`, \`aberto_em\`, \`fechado_em\`, \`pagamento\`, \`vr_total\`, \`cancelado\`;
- \`itens\`: \`id_item\`, \`id_nfce\`, \`cProd\`, \`cEAN\`, \`xProd\`, \`uCom\`, \`qCom\` (quantidade), \`vUnCom\` (preço unitário), \`vDesc\` (desconto);
- \`produtos\`: \`id_produto\`, \`cProd\`, \`cEAN\`, \`xProd\`, \`uCom\`, \`vUnCom\` (preço de venda), \`custo\`, \`qt_estoque\`, \`qt_minima\`, \`qt_maxima\`.

Clique em **Executar** para ver no console o que o seu \`main\` devolve (é o bloco \`if __name__ == "__main__":\` do código inicial). Para conferir um valor, coloque um \`print(...)\` nesse bloco.`;

function mainNote(call: string): string {
  const params = call.slice(call.indexOf('('));
  const name = call.slice(0, call.indexOf('('));
  return `> **Atenção:** não remova a função \`main${params}\`. Ela é o ponto de entrada do EEVEE: monta o \`df = pd.DataFrame${params}\` e chama \`${name}(df)\`.`;
}

function pandasTest(functionName: string, tests: string): string {
  return `import traceback

import pandas as pd
import pytest

import dados
from app import ${functionName}, main


@pytest.fixture
def pedidos():
    return pd.DataFrame(dados.pedidos)


@pytest.fixture
def itens():
    return pd.DataFrame(dados.itens)


@pytest.fixture
def produtos():
    return pd.DataFrame(dados.produtos)


def chamar(funcao, *args):
    falha = None
    try:
        resultado = funcao(*args)
    except Exception as erro:
        quadros = [q for q in traceback.extract_tb(erro.__traceback__) if q.filename.endswith("app.py")]
        onde = f" na função {quadros[-1].name}, linha {quadros[-1].lineno} do app.py" if quadros else ""
        falha = f"{funcao.__name__}() deu erro{onde}: {type(erro).__name__}: {erro}"
    if falha:
        pytest.fail(falha, pytrace=False)
    if resultado is None:
        pytest.fail(
            f"{funcao.__name__}() devolveu None. Troque o pass por um return com o resultado.",
            pytrace=False,
        )
    return resultado


def diferenca(rotulo, obtido, esperado, dica):
    if isinstance(esperado, float):
        if isinstance(obtido, bool) or not isinstance(obtido, (int, float)):
            return f"{rotulo}: era esperado o número {esperado!r}, mas veio {obtido!r} ({type(obtido).__name__})."
        if obtido == pytest.approx(esperado):
            return None
        if abs(obtido - esperado) < 0.01:
            return f"{rotulo}: quase! Veio {obtido!r} e o esperado é {esperado!r}. Faltou arredondar com round(valor, 2)."
    elif isinstance(esperado, int) and not isinstance(esperado, bool):
        if obtido == esperado and type(obtido) is not int:
            return f"{rotulo}: o valor {obtido!r} está certo, mas é {type(obtido).__name__}. Converta com int(...)."
        if obtido == esperado:
            return None
    elif obtido == esperado:
        return None
    return f"{rotulo}: era esperado {esperado!r}, mas sua função devolveu {obtido!r}. Dica: {dica}"


def exigir_dicionario(resultado):
    if not isinstance(resultado, dict):
        pytest.fail(
            f"Era esperado um dicionário, mas a função devolveu {type(resultado).__name__}: {resultado!r}",
            pytrace=False,
        )


def conferir(resultado, chave, esperado, dica, rotulo=None):
    exigir_dicionario(resultado)
    if chave not in resultado:
        pytest.fail(
            f'Falta a chave "{chave}" no dicionário. Chaves que sua função devolveu: {list(resultado)}',
            pytrace=False,
        )
    erro = diferenca(rotulo or f'"{chave}"', resultado[chave], esperado, dica)
    if erro:
        pytest.fail(erro, pytrace=False)


def conferir_chaves(resultado, esperadas):
    exigir_dicionario(resultado)
    faltando = [chave for chave in esperadas if chave not in resultado]
    sobrando = [chave for chave in resultado if chave not in esperadas]
    if faltando or sobrando:
        pytest.fail(
            f"Chaves que faltam: {faltando or 'nenhuma'}. Chaves a mais: {sobrando or 'nenhuma'}. "
            f"O enunciado pede: {list(esperadas)}",
            pytrace=False,
        )


def conferir_tudo(funcao, entrada, esperados):
    resultado = chamar(funcao, entrada)
    exigir_dicionario(resultado)
    erros = []
    for chave, esperado in esperados.items():
        if chave not in resultado:
            erros.append(f'Falta a chave "{chave}".')
            continue
        erro = diferenca(f'"{chave}"', resultado[chave], esperado, "refaça a conta à mão com a tabela acima.")
        if erro:
            erros.append(erro)
    if erros:
        pytest.fail(
            "Com esta tabela pequena:\\n" + entrada.to_string() + "\\n\\n" + "\\n".join(erros),
            pytrace=False,
        )


def casos(esperados):
    return [pytest.param(chave, valor, dica, id=chave) for chave, (valor, dica) in esperados.items()]


${tests}`;
}

export const PANDAS_EXAMPLES: PythonExample[] = [
  {
    code: 'PD01',
    title: 'PD01 - Resumo estatístico dos pedidos',
    description: `Implemente a função resumo_valores(df), que faz o resumo estatístico do valor dos pedidos.

### O que a função deve devolver

Um dicionário calculado sobre a coluna \`vr_total\` (valor de cada pedido), com as chaves:

- \`"quantidade"\` (int): quantos pedidos têm valor (os vazios não contam);
- \`"total"\`: soma dos valores;
- \`"media"\`: valor médio;
- \`"mediana"\`: valor do meio, com metade dos pedidos abaixo e metade acima;
- \`"minimo"\` e \`"maximo"\`: menor e maior valor;
- \`"desvio_padrao"\`: desvio padrão (o quanto os valores se espalham em torno da média).

Arredonde para 2 casas decimais, com \`round(valor, 2)\`, os valores que não são inteiros.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(pedidos)
>>> df[["id_nfce", "vr_total"]].head()
   id_nfce  vr_total
0    20246      53.8
1    20264      18.5
2    20269       NaN
3    20335     144.4
4    20941       NaN
>>> df["vr_total"].describe()
count     10.000000
mean      34.915000
std       42.632343
min        0.000000
25%       11.900000
50%       20.575000
75%       45.825000
max      144.400000
Name: vr_total, dtype: float64
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(pedidos)
{'quantidade': 10,
 'total': 349.15,
 'media': 34.91,
 'mediana': 20.57,
 'minimo': 0.0,
 'maximo': 144.4,
 'desvio_padrao': 42.63}
\`\`\`

### Dicas

- **Funções do pandas:** \`count\`, \`sum\`, \`mean\`, \`median\`, \`min\`, \`max\` e \`std\`. Todas ignoram os valores vazios (\`NaN\`).
- **Como conferir:** \`df["vr_total"].describe()\` mostra count, mean, std, min, 50% (a mediana) e max de uma vez. Compare com o seu resultado.

${DATA_SECTION}

${mainNote('resumo_valores(pedidos)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import pedidos


def resumo_valores(df):
    """Retorne quantidade, total, media, mediana, minimo, maximo e desvio_padrao de vr_total."""
    pass


def main(pedidos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(pedidos)
    return resumo_valores(df)


if __name__ == "__main__":
    print(main(pedidos))
`,
    templateTitle: 'PD01 - Testes de resumo estatístico dos pedidos',
    templateDescription:
      'Valida count, sum, mean, median, min, max e std de uma coluna, comparando com o describe.',
    testContent: pandasTest(
      'resumo_valores',
      `ESPERADO = {
    "quantidade": (10, 'use df["vr_total"].count(): o len() conta também os vazios (NaN), o count() não.'),
    "total": (349.15, "some a coluna com .sum() e arredonde com round(..., 2)."),
    "media": (34.91, "use .mean() na coluna vr_total."),
    "mediana": (20.57, "use .median(): a mediana é o valor do meio, não a média."),
    "minimo": (0.0, "use .min() na coluna vr_total."),
    "maximo": (144.4, "use .max() na coluna vr_total."),
    "desvio_padrao": (42.63, "use .std() do pandas (desvio amostral); o numpy.std dá outro valor."),
}


def test_chaves_do_resultado(pedidos):
    conferir_chaves(chamar(resumo_valores, pedidos), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(pedidos, chave, esperado, dica):
    conferir(chamar(resumo_valores, pedidos), chave, esperado, dica)


def test_tabela_pequena_com_valor_vazio():
    conferir_tudo(
        resumo_valores,
        pd.DataFrame({"vr_total": [10.0, 20.0, None, 30.0]}),
        {"quantidade": 3, "total": 60.0, "media": 20.0, "mediana": 20.0, "minimo": 10.0, "maximo": 30.0, "desvio_padrao": 10.0},
    )


def test_bate_com_o_describe(pedidos):
    resumo = chamar(resumo_valores, pedidos)
    describe = pedidos["vr_total"].describe()
    conferir(resumo, "quantidade", int(describe["count"]), 'compare com df["vr_total"].describe(), linha count.')
    conferir(resumo, "mediana", round(float(describe["50%"]), 2), "compare com a linha 50% do describe().")


def test_main_delega_para_resumo(pedidos):
    if repr(main(dados.pedidos)) != repr(chamar(resumo_valores, pedidos)):
        pytest.fail("main(pedidos) deve montar o DataFrame e devolver resumo_valores(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import pedidos


def resumo_valores(df):
    valores = df["vr_total"]
    return {
        "quantidade": int(valores.count()),
        "total": round(float(valores.sum()), 2),
        "media": round(float(valores.mean()), 2),
        "mediana": round(float(valores.median()), 2),
        "minimo": round(float(valores.min()), 2),
        "maximo": round(float(valores.max()), 2),
        "desvio_padrao": round(float(valores.std()), 2),
    }


def main(pedidos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(pedidos)
    return resumo_valores(df)


if __name__ == "__main__":
    print(main(pedidos))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD02',
    title: 'PD02 - Análise das formas de pagamento',
    description: `Implemente a função analise_pagamentos(df), que mostra quanto a papelaria vendeu em cada forma de pagamento.

### O que a função deve devolver

Considere só os pedidos **não cancelados** (\`cancelado == False\`) que **têm** \`vr_total\`. Agrupe por \`pagamento\` e devolva um dicionário em que cada chave é uma forma de pagamento e o valor é outro dicionário com:

- \`"pedidos"\` (int): quantidade de pedidos;
- \`"total"\`: soma de \`vr_total\`;
- \`"media"\`: valor médio por pedido;
- \`"percentual"\`: quanto essa forma representa do total vendido, em %: \`total da forma / total geral * 100\`.

Arredonde os números para 2 casas e coloque as formas de pagamento do maior para o menor \`"total"\` (o dicionário guarda a ordem em que as chaves entram).

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(pedidos)
>>> df[["pagamento", "vr_total", "cancelado"]].head()
           pagamento  vr_total  cancelado
0   Cartao de Debito      53.8      False
1           Dinheiro      18.5      False
2      Nao informado       NaN      False
3  Cartao de Credito     144.4      False
4      Nao informado       NaN      False
>>> df["pagamento"].value_counts()
pagamento
Cartao de Debito     3
Dinheiro             3
Nao informado        2
Cartao de Credito    2
PIX                  2
Name: count, dtype: int64
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(pedidos)
{'Cartao de Credito': {'pedidos': 2,
                       'total': 149.2,
                       'media': 74.6,
                       'percentual': 42.73},
 'PIX': {'pedidos': 2,
         'total': 74.3,
         'media': 37.15,
         'percentual': 21.28},
 'Cartao de Debito': {'pedidos': 2,
                      'total': 63.5,
                      'media': 31.75,
                      'percentual': 18.19},
 'Dinheiro': {'pedidos': 3,
              'total': 62.15,
              'media': 20.72,
              'percentual': 17.8}}
\`\`\`

Repare que \`"Nao informado"\` não aparece no resultado: esses pedidos estão sem \`vr_total\`.

### Dicas

- **Funções do pandas:** filtro booleano, \`dropna\`, \`groupby("pagamento")["vr_total"]\` com \`size\`, \`sum\` e \`mean\`, e \`sort_values\`.
- **Como conferir:** \`df["pagamento"].value_counts()\` mostra quantos pedidos usaram cada forma (antes do filtro). A soma dos percentuais deve dar 100.

${DATA_SECTION}

${mainNote('analise_pagamentos(pedidos)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import pedidos


def analise_pagamentos(df):
    """Retorne pedidos, total, media e percentual de cada forma de pagamento."""
    pass


def main(pedidos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(pedidos)
    return analise_pagamentos(df)


if __name__ == "__main__":
    print(main(pedidos))
`,
    templateTitle: 'PD02 - Testes de análise das formas de pagamento',
    templateDescription:
      'Valida filtro, groupby com size, sum e mean, percentuais e ordenação.',
    testContent: pandasTest(
      'analise_pagamentos',
      `ESPERADO = {
    "Cartao de Credito": {"pedidos": 2, "total": 149.2, "media": 74.6, "percentual": 42.73},
    "PIX": {"pedidos": 2, "total": 74.3, "media": 37.15, "percentual": 21.28},
    "Cartao de Debito": {"pedidos": 2, "total": 63.5, "media": 31.75, "percentual": 18.19},
    "Dinheiro": {"pedidos": 3, "total": 62.15, "media": 20.72, "percentual": 17.8},
}
DICAS = {
    "pedidos": 'conte os pedidos de cada grupo com groupby("pagamento")["vr_total"].size().',
    "total": "some vr_total de cada grupo com .sum().",
    "media": "tire a média de vr_total de cada grupo com .mean().",
    "percentual": "divida o total da forma pelo total geral (de todas as formas) e multiplique por 100.",
}


def test_formas_de_pagamento(pedidos):
    resultado = chamar(analise_pagamentos, pedidos)
    exigir_dicionario(resultado)
    if "Nao informado" in resultado:
        pytest.fail(
            '"Nao informado" não deveria aparecer: esses pedidos não têm vr_total. '
            'Remova os sem valor com dropna(subset=["vr_total"]) antes de agrupar.',
            pytrace=False,
        )
    conferir_chaves(resultado, ESPERADO)


@pytest.mark.parametrize("forma", list(ESPERADO))
def test_valores_da_forma(pedidos, forma):
    resultado = chamar(analise_pagamentos, pedidos)
    exigir_dicionario(resultado)
    if forma not in resultado:
        pytest.fail(f'Falta a forma de pagamento "{forma}". Formas que sua função devolveu: {list(resultado)}', pytrace=False)
    for campo, esperado in ESPERADO[forma].items():
        conferir(resultado[forma], campo, esperado, DICAS[campo], rotulo=f'{forma} → "{campo}"')


def test_ignora_pedidos_cancelados(pedidos):
    resultado = chamar(analise_pagamentos, pedidos)
    exigir_dicionario(resultado)
    if "Cartao de Debito" in resultado and isinstance(resultado["Cartao de Debito"], dict):
        conferir(
            resultado["Cartao de Debito"],
            "pedidos",
            2,
            'o pedido 21182 foi cancelado e não pode contar. Filtre com df[~df["cancelado"]].',
            rotulo='Cartao de Debito → "pedidos"',
        )


def test_ordem_do_maior_para_o_menor_total(pedidos):
    ordem = list(chamar(analise_pagamentos, pedidos))
    esperada = list(ESPERADO)
    if ordem != esperada:
        pytest.fail(
            f"Ordem esperada (maior total primeiro): {esperada}. Sua ordem: {ordem}. "
            "Dica: ordene os totais com sort_values(ascending=False).",
            pytrace=False,
        )


def test_tabela_pequena():
    pedidos = pd.DataFrame(
        {
            "pagamento": ["PIX", "PIX", "Dinheiro", "PIX", "Dinheiro"],
            "vr_total": [10.0, 30.0, 5.0, None, 100.0],
            "cancelado": [False, False, False, False, True],
        }
    )
    resultado = chamar(analise_pagamentos, pedidos)
    esperado = {
        "PIX": {"pedidos": 2, "total": 40.0, "media": 20.0, "percentual": 88.89},
        "Dinheiro": {"pedidos": 1, "total": 5.0, "media": 5.0, "percentual": 11.11},
    }
    erros = []
    for forma, campos in esperado.items():
        for campo, valor in campos.items():
            obtido = resultado.get(forma, {}).get(campo) if isinstance(resultado, dict) else None
            erro = diferenca(f'{forma} → "{campo}"', obtido, valor, DICAS[campo])
            if erro:
                erros.append(erro)
    if erros:
        pytest.fail("Com esta tabela pequena:\\n" + pedidos.to_string() + "\\n\\n" + "\\n".join(erros), pytrace=False)


def test_main_delega_para_analise(pedidos):
    if repr(main(dados.pedidos)) != repr(chamar(analise_pagamentos, pedidos)):
        pytest.fail("main(pedidos) deve montar o DataFrame e devolver analise_pagamentos(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import pedidos


def analise_pagamentos(df):
    validos = df[~df["cancelado"]].dropna(subset=["vr_total"])
    grupos = validos.groupby("pagamento")["vr_total"]
    totais = grupos.sum().sort_values(ascending=False)
    quantidades = grupos.size()
    medias = grupos.mean()
    total_geral = totais.sum()
    return {
        pagamento: {
            "pedidos": int(quantidades[pagamento]),
            "total": round(float(total), 2),
            "media": round(float(medias[pagamento]), 2),
            "percentual": round(float(total / total_geral * 100), 2),
        }
        for pagamento, total in totais.items()
    }


def main(pedidos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(pedidos)
    return analise_pagamentos(df)


if __name__ == "__main__":
    print(main(pedidos))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD03',
    title: 'PD03 - Qualidade dos dados dos pedidos',
    description: `Implemente a função qualidade_pedidos(df), que mede o quanto dá para confiar na tabela de pedidos antes de analisá-la.

### O que a função deve devolver

Um dicionário com:

- \`"pedidos"\` (int): total de linhas da tabela;
- \`"cancelados"\` (int): quantos pedidos foram cancelados (\`cancelado\` é \`True\`);
- \`"percentual_cancelados"\`: \`cancelados / pedidos * 100\`;
- \`"sem_valor"\` (int): quantos pedidos não têm \`vr_total\`;
- \`"percentual_sem_valor"\`: \`sem_valor / pedidos * 100\`;
- \`"sem_fechamento"\` (int): quantos pedidos não têm \`fechado_em\`.

Arredonde os percentuais para 2 casas.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(pedidos)
>>> df.isna().sum()
id_nfce       0
aberto_em     0
fechado_em    2
pagamento     0
vr_total      2
cancelado     0
dtype: int64
>>> df["cancelado"].value_counts()
cancelado
False    11
True      1
Name: count, dtype: int64
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(pedidos)
{'pedidos': 12,
 'cancelados': 1,
 'percentual_cancelados': 8.33,
 'sem_valor': 2,
 'percentual_sem_valor': 16.67,
 'sem_fechamento': 2}
\`\`\`

### Dicas

- **Funções do pandas:** \`len\`, \`sum\` em uma coluna de \`True\`/\`False\` (cada \`True\` vale 1) e \`isna().sum()\` para contar vazios.
- **Como conferir:** \`df.info()\` mostra quantos valores preenchidos (non-null) cada coluna tem, e \`df["cancelado"].value_counts()\` mostra quantos \`True\` e \`False\` existem.

${DATA_SECTION}

${mainNote('qualidade_pedidos(pedidos)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import pedidos


def qualidade_pedidos(df):
    """Conte pedidos, cancelados, sem valor e sem fechamento, com os percentuais."""
    pass


def main(pedidos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(pedidos)
    return qualidade_pedidos(df)


if __name__ == "__main__":
    print(main(pedidos))
`,
    templateTitle: 'PD03 - Testes de qualidade dos dados dos pedidos',
    templateDescription:
      'Valida len, soma de booleanos e contagem de valores vazios com isna.',
    testContent: pandasTest(
      'qualidade_pedidos',
      `ESPERADO = {
    "pedidos": (12, "use len(pedidos): conta todas as linhas da tabela."),
    "cancelados": (1, 'some a coluna cancelado: cada True vale 1 (df["cancelado"].sum()).'),
    "percentual_cancelados": (8.33, "calcule cancelados / pedidos * 100 e arredonde com round(..., 2)."),
    "sem_valor": (2, 'conte os vazios de vr_total com df["vr_total"].isna().sum().'),
    "percentual_sem_valor": (16.67, "calcule sem_valor / pedidos * 100 e arredonde com round(..., 2)."),
    "sem_fechamento": (2, 'conte os vazios de fechado_em com df["fechado_em"].isna().sum().'),
}


def test_chaves_do_resultado(pedidos):
    conferir_chaves(chamar(qualidade_pedidos, pedidos), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(pedidos, chave, esperado, dica):
    conferir(chamar(qualidade_pedidos, pedidos), chave, esperado, dica)


def test_tabela_pequena():
    conferir_tudo(
        qualidade_pedidos,
        pd.DataFrame(
            {
                "fechado_em": ["2024-01-01", None, None, "2024-01-03"],
                "vr_total": [10.0, None, 5.0, 8.0],
                "cancelado": [False, False, True, False],
            }
        ),
        {
            "pedidos": 4,
            "cancelados": 1,
            "percentual_cancelados": 25.0,
            "sem_valor": 1,
            "percentual_sem_valor": 25.0,
            "sem_fechamento": 2,
        },
    )


def test_tabela_sem_problemas():
    conferir_tudo(
        qualidade_pedidos,
        pd.DataFrame({"fechado_em": ["2024-01-01"], "vr_total": [10.0], "cancelado": [False]}),
        {"pedidos": 1, "cancelados": 0, "percentual_cancelados": 0.0, "sem_valor": 0, "percentual_sem_valor": 0.0, "sem_fechamento": 0},
    )


def test_main_delega_para_qualidade(pedidos):
    if repr(main(dados.pedidos)) != repr(chamar(qualidade_pedidos, pedidos)):
        pytest.fail("main(pedidos) deve montar o DataFrame e devolver qualidade_pedidos(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import pedidos


def qualidade_pedidos(df):
    total = len(df)
    cancelados = int(df["cancelado"].sum())
    sem_valor = int(df["vr_total"].isna().sum())
    return {
        "pedidos": total,
        "cancelados": cancelados,
        "percentual_cancelados": round(cancelados / total * 100, 2),
        "sem_valor": sem_valor,
        "percentual_sem_valor": round(sem_valor / total * 100, 2),
        "sem_fechamento": int(df["fechado_em"].isna().sum()),
    }


def main(pedidos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(pedidos)
    return qualidade_pedidos(df)


if __name__ == "__main__":
    print(main(pedidos))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD04',
    title: 'PD04 - Resumo das vendas dos itens',
    description: `Implemente a função resumo_vendas_itens(df), que resume as vendas a partir dos itens vendidos.

### O que a função deve devolver

Cada linha de \`itens\` é um produto vendido em um pedido. O valor de uma linha é:

\`\`\`
valor = qCom * vUnCom - vDesc
\`\`\`

Devolva um dicionário com:

- \`"itens"\` (int): quantidade de linhas;
- \`"unidades"\`: soma de \`qCom\`;
- \`"faturamento"\`: soma dos valores;
- \`"valor_medio"\`: média dos valores;
- \`"maior_item"\` e \`"menor_item"\`: maior e menor valor de uma linha;
- \`"pedidos"\` (int): quantidade de pedidos diferentes (valores distintos de \`id_nfce\`);
- \`"itens_por_pedido"\`: \`itens / pedidos\`.

Arredonde para 2 casas decimais, com \`round(valor, 2)\`, os valores que não são inteiros.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(itens)
>>> df[["id_nfce", "xProd", "qCom", "vUnCom", "vDesc"]].head()
   id_nfce            xProd  qCom  vUnCom  vDesc
0    20246  resma a4 report   2.0    21.9    0.0
1    20246               a3   1.0    10.0    0.0
2    20264    porta-retrato   1.0    15.0    0.0
3    20264  folha impressao   1.0     3.0    0.0
4    20264     folha acesso   1.0     0.5    0.0
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(itens)
{'itens': 25,
 'unidades': 152.0,
 'faturamento': 423.85,
 'valor_medio': 16.95,
 'maior_item': 99.5,
 'menor_item': 0.5,
 'pedidos': 11,
 'itens_por_pedido': 2.27}
\`\`\`

### Dicas

- **Funções do pandas:** operação entre colunas (gera uma Series), \`sum\`, \`mean\`, \`max\`, \`min\` e \`nunique\`.
- **Como conferir:** crie a Series \`valor\` e rode \`valor.describe()\`; \`df["id_nfce"].value_counts()\` mostra quantos itens cada pedido tem.

${DATA_SECTION}

${mainNote('resumo_vendas_itens(itens)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import itens


def resumo_vendas_itens(df):
    """Retorne itens, unidades, faturamento, valor_medio, maior_item, menor_item, pedidos e itens_por_pedido."""
    pass


def main(itens):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(itens)
    return resumo_vendas_itens(df)


if __name__ == "__main__":
    print(main(itens))
`,
    templateTitle: 'PD04 - Testes de resumo das vendas dos itens',
    templateDescription:
      'Valida coluna calculada, sum, mean, max, min e nunique.',
    testContent: pandasTest(
      'resumo_vendas_itens',
      `ESPERADO = {
    "itens": (25, "use len(itens): uma linha por item vendido."),
    "unidades": (152.0, 'some a coluna qCom com df["qCom"].sum().'),
    "faturamento": (423.85, "crie a Series valor = qCom * vUnCom - vDesc e some com .sum()."),
    "valor_medio": (16.95, "tire a média da Series valor com .mean()."),
    "maior_item": (99.5, "use .max() na Series valor (não em vUnCom)."),
    "menor_item": (0.5, "use .min() na Series valor (não em vUnCom)."),
    "pedidos": (11, 'conte os pedidos diferentes com df["id_nfce"].nunique().'),
    "itens_por_pedido": (2.27, "divida a quantidade de itens pela de pedidos e arredonde com round(..., 2)."),
}


def test_chaves_do_resultado(itens):
    conferir_chaves(chamar(resumo_vendas_itens, itens), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(itens, chave, esperado, dica):
    conferir(chamar(resumo_vendas_itens, itens), chave, esperado, dica)


def test_tabela_pequena_com_desconto():
    conferir_tudo(
        resumo_vendas_itens,
        pd.DataFrame({"id_nfce": [1, 1, 2], "qCom": [2.0, 1.0, 3.0], "vUnCom": [5.0, 10.0, 1.0], "vDesc": [0.0, 1.0, 0.0]}),
        {
            "itens": 3,
            "unidades": 6.0,
            "faturamento": 22.0,
            "valor_medio": 7.33,
            "maior_item": 10.0,
            "menor_item": 3.0,
            "pedidos": 2,
            "itens_por_pedido": 1.5,
        },
    )


def test_nao_altera_a_tabela(itens):
    colunas = list(itens.columns)
    chamar(resumo_vendas_itens, itens)
    if list(itens.columns) != colunas:
        pytest.fail(
            "A função criou uma coluna nova na tabela recebida. Guarde o valor em uma variável "
            "(valor = df[...] * ...) em vez de df[\\"valor\\"] = ...",
            pytrace=False,
        )


def test_main_delega_para_resumo(itens):
    if repr(main(dados.itens)) != repr(chamar(resumo_vendas_itens, itens)):
        pytest.fail("main(itens) deve montar o DataFrame e devolver resumo_vendas_itens(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import itens


def resumo_vendas_itens(df):
    valor = df["qCom"] * df["vUnCom"] - df["vDesc"]
    pedidos = int(df["id_nfce"].nunique())
    return {
        "itens": len(df),
        "unidades": round(float(df["qCom"].sum()), 2),
        "faturamento": round(float(valor.sum()), 2),
        "valor_medio": round(float(valor.mean()), 2),
        "maior_item": round(float(valor.max()), 2),
        "menor_item": round(float(valor.min()), 2),
        "pedidos": pedidos,
        "itens_por_pedido": round(len(df) / pedidos, 2),
    }


def main(itens):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(itens)
    return resumo_vendas_itens(df)


if __name__ == "__main__":
    print(main(itens))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD05',
    title: 'PD05 - Produtos mais e menos vendidos',
    description: `Implemente a função analise_produtos_vendidos(df), que descobre os produtos mais e menos vendidos.

### O que a função deve devolver

Some as unidades vendidas (\`qCom\`) de cada produto, agrupando pelo nome (\`xProd\`), e devolva um dicionário com:

- \`"produtos_distintos"\` (int): quantos produtos diferentes foram vendidos;
- \`"mais_vendido"\`: nome do produto com mais unidades;
- \`"unidades_mais_vendido"\`: unidades desse produto;
- \`"menos_vendido"\`: nome do produto com menos unidades;
- \`"unidades_menos_vendido"\`: unidades desse produto;
- \`"media_por_produto"\`: média de unidades por produto, arredondada para 2 casas.

Em caso de empate, vale o primeiro nome em ordem alfabética. É o que \`idxmax\` e \`idxmin\` fazem depois de um \`groupby\`, porque o \`groupby\` já ordena os nomes.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(itens)
>>> df[["xProd", "qCom"]].head()
             xProd  qCom
0  resma a4 report   2.0
1               a3   1.0
2    porta-retrato   1.0
3  folha impressao   1.0
4     folha acesso   1.0
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(itens)
{'produtos_distintos': 18,
 'mais_vendido': 'folha copia pb a4',
 'unidades_mais_vendido': 63.0,
 'menos_vendido': 'a3',
 'unidades_menos_vendido': 1.0,
 'media_por_produto': 8.44}
\`\`\`

### Dicas

- **Funções do pandas:** \`groupby("xProd")["qCom"].sum()\`, \`idxmax\`, \`idxmin\`, \`max\`, \`min\`, \`mean\` e \`nunique\`.
- **Como conferir:** \`df.groupby("xProd")["qCom"].sum().sort_values()\` mostra o ranking completo, do menos ao mais vendido.

${DATA_SECTION}

${mainNote('analise_produtos_vendidos(itens)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import itens


def analise_produtos_vendidos(df):
    """Retorne os produtos mais e menos vendidos e a média de unidades por produto."""
    pass


def main(itens):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(itens)
    return analise_produtos_vendidos(df)


if __name__ == "__main__":
    print(main(itens))
`,
    templateTitle: 'PD05 - Testes de produtos mais e menos vendidos',
    templateDescription: 'Valida groupby com sum, idxmax, idxmin e nunique.',
    testContent: pandasTest(
      'analise_produtos_vendidos',
      `ESPERADO = {
    "produtos_distintos": (18, 'conte os nomes diferentes com df["xProd"].nunique().'),
    "mais_vendido": ("folha copia pb a4", 'agrupe com df.groupby("xProd")["qCom"].sum() e use .idxmax(), que devolve o nome.'),
    "unidades_mais_vendido": (63.0, "use .max() nas unidades já agrupadas por produto."),
    "menos_vendido": ("a3", "use .idxmin() nas unidades agrupadas; no empate fica o primeiro em ordem alfabética."),
    "unidades_menos_vendido": (1.0, "use .min() nas unidades já agrupadas por produto."),
    "media_por_produto": (8.44, "tire a média das unidades agrupadas por produto, não de qCom direto."),
}


def test_chaves_do_resultado(itens):
    conferir_chaves(chamar(analise_produtos_vendidos, itens), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(itens, chave, esperado, dica):
    conferir(chamar(analise_produtos_vendidos, itens), chave, esperado, dica)


def test_soma_produtos_repetidos():
    conferir_tudo(
        analise_produtos_vendidos,
        pd.DataFrame({"xProd": ["caneta", "lapis", "caneta", "borracha"], "qCom": [2.0, 5.0, 4.0, 1.0]}),
        {
            "produtos_distintos": 3,
            "mais_vendido": "caneta",
            "unidades_mais_vendido": 6.0,
            "menos_vendido": "borracha",
            "unidades_menos_vendido": 1.0,
            "media_por_produto": 4.0,
        },
    )


def test_empate_fica_com_a_ordem_alfabetica():
    conferir_tudo(
        analise_produtos_vendidos,
        pd.DataFrame({"xProd": ["regua", "cola", "lapis"], "qCom": [3.0, 3.0, 1.0]}),
        {"mais_vendido": "cola"},
    )


def test_main_delega_para_analise(itens):
    if repr(main(dados.itens)) != repr(chamar(analise_produtos_vendidos, itens)):
        pytest.fail("main(itens) deve montar o DataFrame e devolver analise_produtos_vendidos(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import itens


def analise_produtos_vendidos(df):
    unidades = df.groupby("xProd")["qCom"].sum()
    return {
        "produtos_distintos": int(df["xProd"].nunique()),
        "mais_vendido": unidades.idxmax(),
        "unidades_mais_vendido": float(unidades.max()),
        "menos_vendido": unidades.idxmin(),
        "unidades_menos_vendido": float(unidades.min()),
        "media_por_produto": round(float(unidades.mean()), 2),
    }


def main(itens):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(itens)
    return analise_produtos_vendidos(df)


if __name__ == "__main__":
    print(main(itens))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD06',
    title: 'PD06 - Relação entre preço e quantidade',
    description: `Implemente a função relacao_preco_quantidade(df), que investiga se os clientes compram mais unidades dos produtos baratos.

### O que a função deve devolver

Analise as colunas \`qCom\` (quantidade) e \`vUnCom\` (preço unitário) e devolva um dicionário com:

- \`"covariancia"\`: covariância entre \`qCom\` e \`vUnCom\`;
- \`"correlacao"\`: correlação entre \`qCom\` e \`vUnCom\` (vai de -1 a 1);
- \`"quantidade_media_baratos"\`: média de \`qCom\` dos itens com \`vUnCom\` até 5 (inclusive);
- \`"quantidade_media_caros"\`: média de \`qCom\` dos itens com \`vUnCom\` acima de 5.

Arredonde tudo para 2 casas.

**Como ler o resultado:**

- covariância e correlação negativas: quando o preço sobe, a quantidade tende a cair;
- a correlação mostra a força da relação: perto de -1 ou 1 é forte, perto de 0 é fraca.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(itens)
>>> df[["qCom", "vUnCom"]].head()
   qCom  vUnCom
0   2.0    21.9
1   1.0    10.0
2   1.0    15.0
3   1.0     3.0
4   1.0     0.5
>>> df[["qCom", "vUnCom"]].corr()
            qCom    vUnCom
qCom    1.000000 -0.239462
vUnCom -0.239462  1.000000
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(itens)
{'covariancia': -41.18,
 'correlacao': -0.24,
 'quantidade_media_baratos': 8.44,
 'quantidade_media_caros': 1.89}
\`\`\`

### Dicas

- **Funções do pandas:** \`cov\`, \`corr\`, filtro booleano e \`mean\`.
- **Como conferir:** \`df[["qCom", "vUnCom"]].cov()\` e \`df[["qCom", "vUnCom"]].corr()\` mostram as matrizes de covariância e correlação.

${DATA_SECTION}

${mainNote('relacao_preco_quantidade(itens)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import itens


def relacao_preco_quantidade(df):
    """Retorne covariancia, correlacao e a quantidade média dos itens baratos e caros."""
    pass


def main(itens):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(itens)
    return relacao_preco_quantidade(df)


if __name__ == "__main__":
    print(main(itens))
`,
    templateTitle: 'PD06 - Testes de relação entre preço e quantidade',
    templateDescription: 'Valida cov, corr e médias de grupos filtrados.',
    testContent: pandasTest(
      'relacao_preco_quantidade',
      `ESPERADO = {
    "covariancia": (-41.18, 'use df["qCom"].cov(df["vUnCom"]).'),
    "correlacao": (-0.24, 'use df["qCom"].corr(df["vUnCom"]).'),
    "quantidade_media_baratos": (8.44, "filtre os itens com vUnCom <= 5 (o 5 entra) e tire a média de qCom."),
    "quantidade_media_caros": (1.89, "filtre os itens com vUnCom > 5 e tire a média de qCom."),
}


def test_chaves_do_resultado(itens):
    conferir_chaves(chamar(relacao_preco_quantidade, itens), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(itens, chave, esperado, dica):
    conferir(chamar(relacao_preco_quantidade, itens), chave, esperado, dica)


def test_relacao_negativa_forte():
    conferir_tudo(
        relacao_preco_quantidade,
        pd.DataFrame({"qCom": [10.0, 8.0, 2.0, 1.0], "vUnCom": [1.0, 2.0, 10.0, 20.0]}),
        {"covariancia": -35.75, "correlacao": -0.92, "quantidade_media_baratos": 9.0, "quantidade_media_caros": 1.5},
    )


def test_preco_5_conta_como_barato():
    conferir_tudo(
        relacao_preco_quantidade,
        pd.DataFrame({"qCom": [4.0, 2.0, 1.0], "vUnCom": [5.0, 5.0, 9.0]}),
        {"quantidade_media_baratos": 3.0, "quantidade_media_caros": 1.0},
    )


def test_main_delega_para_relacao(itens):
    if repr(main(dados.itens)) != repr(chamar(relacao_preco_quantidade, itens)):
        pytest.fail("main(itens) deve montar o DataFrame e devolver relacao_preco_quantidade(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import itens


def relacao_preco_quantidade(df):
    baratos = df[df["vUnCom"] <= 5]
    caros = df[df["vUnCom"] > 5]
    return {
        "covariancia": round(float(df["qCom"].cov(df["vUnCom"])), 2),
        "correlacao": round(float(df["qCom"].corr(df["vUnCom"])), 2),
        "quantidade_media_baratos": round(float(baratos["qCom"].mean()), 2),
        "quantidade_media_caros": round(float(caros["qCom"].mean()), 2),
    }


def main(itens):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(itens)
    return relacao_preco_quantidade(df)


if __name__ == "__main__":
    print(main(itens))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD07',
    title: 'PD07 - Análise de preços do cadastro',
    description: `Implemente a função analise_precos(df), que analisa os preços de venda do cadastro de produtos.

### O que a função deve devolver

Um dicionário calculado sobre a coluna \`vUnCom\` (preço de venda), com:

- \`"produtos"\` (int): quantos produtos têm preço;
- \`"preco_medio"\`: média dos preços;
- \`"preco_mediano"\`: mediana dos preços;
- \`"desvio_padrao"\`: desvio padrão dos preços;
- \`"amplitude"\`: diferença entre o maior e o menor preço;
- \`"mais_barato"\`: nome (\`xProd\`) do produto mais barato;
- \`"mais_caro"\`: nome (\`xProd\`) do produto mais caro.

Arredonde os números para 2 casas.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(produtos)
>>> df[["xProd", "vUnCom"]].head()
                             xProd  vUnCom
0                contra-cheque pt.    44.9
1  grampo pra grampeador cx c 1000     3.5
2                  resma a4 report    27.9
3                    porta-retrato    20.0
4                   envelope a4 pt     0.6
>>> df["vUnCom"].describe()
count    24.000000
mean     11.163750
std      15.589463
min       0.180000
25%       0.675000
50%       3.750000
75%      15.425000
max      50.000000
Name: vUnCom, dtype: float64
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(produtos)
{'produtos': 24,
 'preco_medio': 11.16,
 'preco_mediano': 3.75,
 'desvio_padrao': 15.59,
 'amplitude': 49.82,
 'mais_barato': 'folha impressao',
 'mais_caro': 'lamina estilete larga'}
\`\`\`

Compare média e mediana no resultado: quando a média fica bem acima da mediana, alguns produtos muito caros estão puxando a média para cima.

### Dicas

- **Funções do pandas:** \`count\`, \`mean\`, \`median\`, \`std\`, \`max\`, \`min\`, e \`idxmin\`/\`idxmax\` com \`.loc\` para achar o nome.
- **Como conferir:** \`df["vUnCom"].describe()\` mostra count, mean, std, min, 50% e max; \`df.sort_values("vUnCom")\` mostra os produtos do mais barato ao mais caro.

${DATA_SECTION}

${mainNote('analise_precos(produtos)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import produtos


def analise_precos(df):
    """Retorne as estatísticas de vUnCom e os nomes dos produtos mais barato e mais caro."""
    pass


def main(produtos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(produtos)
    return analise_precos(df)


if __name__ == "__main__":
    print(main(produtos))
`,
    templateTitle: 'PD07 - Testes de análise de preços do cadastro',
    templateDescription:
      'Valida count, mean, median, std, amplitude e idxmin/idxmax com loc.',
    testContent: pandasTest(
      'analise_precos',
      `ESPERADO = {
    "produtos": (24, 'conte os preços preenchidos com df["vUnCom"].count().'),
    "preco_medio": (11.16, "use .mean() na coluna vUnCom."),
    "preco_mediano": (3.75, "use .median() na coluna vUnCom."),
    "desvio_padrao": (15.59, "use .std() do pandas (desvio amostral) na coluna vUnCom."),
    "amplitude": (49.82, "calcule o maior preço menos o menor: .max() - .min()."),
    "mais_barato": ("folha impressao", 'ache a linha com .idxmin() e pegue o nome com df.loc[linha, "xProd"].'),
    "mais_caro": ("lamina estilete larga", 'ache a linha com .idxmax() e pegue o nome com df.loc[linha, "xProd"].'),
}


def test_chaves_do_resultado(produtos):
    conferir_chaves(chamar(analise_precos, produtos), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(produtos, chave, esperado, dica):
    conferir(chamar(analise_precos, produtos), chave, esperado, dica)


def test_cadastro_pequeno():
    conferir_tudo(
        analise_precos,
        pd.DataFrame({"xProd": ["lapis", "caderno", "cola"], "vUnCom": [2.0, 10.0, 6.0]}),
        {
            "produtos": 3,
            "preco_medio": 6.0,
            "preco_mediano": 6.0,
            "desvio_padrao": 4.0,
            "amplitude": 8.0,
            "mais_barato": "lapis",
            "mais_caro": "caderno",
        },
    )


def test_bate_com_o_describe(produtos):
    resultado = chamar(analise_precos, produtos)
    describe = produtos["vUnCom"].describe()
    conferir(resultado, "produtos", int(describe["count"]), 'compare com df["vUnCom"].describe(), linha count.')
    conferir(resultado, "preco_mediano", round(float(describe["50%"]), 2), "compare com a linha 50% do describe().")


def test_main_delega_para_analise(produtos):
    if repr(main(dados.produtos)) != repr(chamar(analise_precos, produtos)):
        pytest.fail("main(produtos) deve montar o DataFrame e devolver analise_precos(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import produtos


def analise_precos(df):
    precos = df["vUnCom"]
    return {
        "produtos": int(precos.count()),
        "preco_medio": round(float(precos.mean()), 2),
        "preco_mediano": round(float(precos.median()), 2),
        "desvio_padrao": round(float(precos.std()), 2),
        "amplitude": round(float(precos.max() - precos.min()), 2),
        "mais_barato": df.loc[precos.idxmin(), "xProd"],
        "mais_caro": df.loc[precos.idxmax(), "xProd"],
    }


def main(produtos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(produtos)
    return analise_precos(df)


if __name__ == "__main__":
    print(main(produtos))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD08',
    title: 'PD08 - Margem de lucro dos produtos',
    description: `Implemente a função analise_margem(df), que calcula quanto a papelaria ganha em cada produto.

### O que a função deve devolver

A margem de um produto é quanto sobra em cada venda:

\`\`\`
margem = vUnCom - custo
\`\`\`

Alguns produtos não têm \`custo\` cadastrado (\`NaN\`). Eles ficam fora do cálculo da margem, mas entram na contagem de \`"sem_custo"\`.

Devolva um dicionário com:

- \`"com_custo"\` (int): quantos produtos têm custo;
- \`"sem_custo"\` (int): quantos produtos não têm custo;
- \`"margem_media"\`: média das margens, arredondada para 2 casas;
- \`"maior_margem"\`: nome (\`xProd\`) do produto com a maior margem;
- \`"menor_margem"\`: nome (\`xProd\`) do produto com a menor margem;
- \`"com_prejuizo"\` (int): quantos produtos têm margem negativa.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(produtos)
>>> df[["xProd", "vUnCom", "custo"]].head()
                             xProd  vUnCom  custo
0                contra-cheque pt.    44.9    2.0
1  grampo pra grampeador cx c 1000     3.5    8.0
2                  resma a4 report    27.9    9.0
3                    porta-retrato    20.0    4.0
4                   envelope a4 pt     0.6    0.4
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(produtos)
{'com_custo': 17,
 'sem_custo': 7,
 'margem_media': 9.26,
 'maior_margem': 'lamina estilete larga',
 'menor_margem': 'grampo pra grampeador cx c 1000',
 'com_prejuizo': 2}
\`\`\`

### Dicas

- **Funções do pandas:** \`dropna(subset=["custo"])\`, operação entre colunas, \`mean\`, \`idxmax\`, \`idxmin\` e soma de uma condição (\`(margem < 0).sum()\`).
- **Como conferir:** \`df["custo"].isna().sum()\` mostra quantos estão sem custo; crie a Series \`margem\` e rode \`margem.describe()\`.

${DATA_SECTION}

${mainNote('analise_margem(produtos)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import produtos


def analise_margem(df):
    """Retorne a análise da margem (vUnCom - custo) dos produtos com custo."""
    pass


def main(produtos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(produtos)
    return analise_margem(df)


if __name__ == "__main__":
    print(main(produtos))
`,
    templateTitle: 'PD08 - Testes de margem de lucro dos produtos',
    templateDescription:
      'Valida dropna, coluna calculada, mean, idxmax/idxmin e contagem com condição.',
    testContent: pandasTest(
      'analise_margem',
      `ESPERADO = {
    "com_custo": (17, 'remova os produtos sem custo com dropna(subset=["custo"]) e conte as linhas.'),
    "sem_custo": (7, 'conte os vazios com df["custo"].isna().sum().'),
    "margem_media": (9.26, "calcule margem = vUnCom - custo (só dos produtos com custo) e use .mean()."),
    "maior_margem": ("lamina estilete larga", 'ache a linha com margem.idxmax() e pegue o nome com .loc[linha, "xProd"].'),
    "menor_margem": ("grampo pra grampeador cx c 1000", 'ache a linha com margem.idxmin() e pegue o nome com .loc[linha, "xProd"].'),
    "com_prejuizo": (2, "conte as margens negativas com (margem < 0).sum()."),
}


def test_chaves_do_resultado(produtos):
    conferir_chaves(chamar(analise_margem, produtos), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(produtos, chave, esperado, dica):
    conferir(chamar(analise_margem, produtos), chave, esperado, dica)


def test_cadastro_pequeno():
    conferir_tudo(
        analise_margem,
        pd.DataFrame({"xProd": ["a", "b", "c", "d"], "vUnCom": [10.0, 5.0, 8.0, 3.0], "custo": [4.0, 6.0, None, 1.0]}),
        {"com_custo": 3, "sem_custo": 1, "margem_media": 2.33, "maior_margem": "a", "menor_margem": "b", "com_prejuizo": 1},
    )


def test_nao_altera_o_cadastro(produtos):
    copia = produtos.copy()
    chamar(analise_margem, produtos)
    if not produtos.equals(copia):
        pytest.fail(
            "A função alterou a tabela recebida. Use dropna sem inplace=True e guarde a margem em uma variável.",
            pytrace=False,
        )


def test_main_delega_para_margem(produtos):
    if repr(main(dados.produtos)) != repr(chamar(analise_margem, produtos)):
        pytest.fail("main(produtos) deve montar o DataFrame e devolver analise_margem(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import produtos


def analise_margem(df):
    com_custo = df.dropna(subset=["custo"])
    margem = com_custo["vUnCom"] - com_custo["custo"]
    return {
        "com_custo": len(com_custo),
        "sem_custo": int(df["custo"].isna().sum()),
        "margem_media": round(float(margem.mean()), 2),
        "maior_margem": com_custo.loc[margem.idxmax(), "xProd"],
        "menor_margem": com_custo.loc[margem.idxmin(), "xProd"],
        "com_prejuizo": int((margem < 0).sum()),
    }


def main(produtos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(produtos)
    return analise_margem(df)


if __name__ == "__main__":
    print(main(produtos))
`,
    supportFiles: SUPPORT_FILES,
  },
  {
    code: 'PD09',
    title: 'PD09 - Situação do estoque',
    description: `Implemente a função situacao_estoque(df), que mostra a situação do estoque da papelaria.

### O que a função deve devolver

Cada produto tem o estoque atual (\`qt_estoque\`) e os limites \`qt_minima\` e \`qt_maxima\`. Devolva um dicionário com:

- \`"estoque_negativo"\` (int): quantos produtos têm estoque menor que 0;
- \`"abaixo_do_minimo"\` (int): quantos produtos têm estoque menor que \`qt_minima\`;
- \`"acima_do_maximo"\` (int): quantos produtos têm estoque maior que \`qt_maxima\`;
- \`"menor_estoque"\`: o menor estoque;
- \`"produto_menor_estoque"\`: nome (\`xProd\`) do produto com o menor estoque;
- \`"maior_estoque"\`: o maior estoque.

Os estoques devem ser float arredondados para 2 casas. Produtos sem limite cadastrado (\`NaN\`) não contam como abaixo do mínimo nem acima do máximo: comparar com \`NaN\` sempre dá \`False\`.

### Exemplo

Como os dados chegam:

\`\`\`python
>>> df = pd.DataFrame(produtos)
>>> df[["xProd", "qt_estoque", "qt_minima", "qt_maxima"]].head()
                             xProd  qt_estoque  qt_minima  qt_maxima
0                contra-cheque pt.       -83.0        NaN        NaN
1  grampo pra grampeador cx c 1000      -134.0        2.0       10.0
2                  resma a4 report     -7407.0        2.0        5.0
3                    porta-retrato       -42.0        2.0        5.0
4                   envelope a4 pt     -1289.0        2.0        5.0
\`\`\`

O que o \`main\` deve devolver com esses dados:

\`\`\`python
>>> main(produtos)
{'estoque_negativo': 21,
 'abaixo_do_minimo': 20,
 'acima_do_maximo': 3,
 'menor_estoque': -41463.0,
 'produto_menor_estoque': 'folha copia pb a4',
 'maior_estoque': 2493.0}
\`\`\`

Repare no resultado: o sistema da papelaria deixa o estoque ficar negativo quando vende mais do que foi cadastrado. Essa análise mostra o tamanho do problema.

### Dicas

- **Funções do pandas:** comparação entre colunas, soma de condições, \`min\`, \`max\` e \`idxmin\` com \`.loc\`.
- **Como conferir:** \`df["qt_estoque"].describe()\` mostra min e max; \`df[df["qt_estoque"] < 0]\` lista os produtos com estoque negativo.

${DATA_SECTION}

${mainNote('situacao_estoque(produtos)')}`,
    maxAttempts: 5,
    boilerplateContent: `import pandas as pd

from dados import produtos


def situacao_estoque(df):
    """Retorne contagens de estoque negativo, abaixo do mínimo e acima do máximo, e os extremos."""
    pass


def main(produtos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(produtos)
    return situacao_estoque(df)


if __name__ == "__main__":
    print(main(produtos))
`,
    templateTitle: 'PD09 - Testes de situação do estoque',
    templateDescription:
      'Valida comparações entre colunas, contagem de condições, min, max e idxmin.',
    testContent: pandasTest(
      'situacao_estoque',
      `ESPERADO = {
    "estoque_negativo": (21, 'conte com (df["qt_estoque"] < 0).sum().'),
    "abaixo_do_minimo": (20, "compare qt_estoque < qt_minima (linha a linha) e some os True."),
    "acima_do_maximo": (3, "compare qt_estoque > qt_maxima (linha a linha) e some os True."),
    "menor_estoque": (-41463.0, "use .min() em qt_estoque."),
    "produto_menor_estoque": ("folha copia pb a4", 'ache a linha com .idxmin() e pegue o nome com df.loc[linha, "xProd"].'),
    "maior_estoque": (2493.0, "use .max() em qt_estoque e arredonde com round(..., 2)."),
}


def test_chaves_do_resultado(produtos):
    conferir_chaves(chamar(situacao_estoque, produtos), ESPERADO)


@pytest.mark.parametrize("chave, esperado, dica", casos(ESPERADO))
def test_indicador(produtos, chave, esperado, dica):
    conferir(chamar(situacao_estoque, produtos), chave, esperado, dica)


def test_cadastro_pequeno_com_limite_vazio_e_estoque_zero():
    conferir_tudo(
        situacao_estoque,
        pd.DataFrame(
            {
                "xProd": ["a", "b", "c", "d"],
                "qt_estoque": [-5.0, 7.0, 50.0, 0.0],
                "qt_minima": [2.0, 5.0, 2.0, None],
                "qt_maxima": [10.0, 10.0, 20.0, None],
            }
        ),
        {
            "estoque_negativo": 1,
            "abaixo_do_minimo": 1,
            "acima_do_maximo": 1,
            "menor_estoque": -5.0,
            "produto_menor_estoque": "a",
            "maior_estoque": 50.0,
        },
    )


def test_main_delega_para_estoque(produtos):
    if repr(main(dados.produtos)) != repr(chamar(situacao_estoque, produtos)):
        pytest.fail("main(produtos) deve montar o DataFrame e devolver situacao_estoque(df).", pytrace=False)
`,
    ),
    answerKeyContent: `import pandas as pd

from dados import produtos


def situacao_estoque(df):
    estoque = df["qt_estoque"]
    return {
        "estoque_negativo": int((estoque < 0).sum()),
        "abaixo_do_minimo": int((estoque < df["qt_minima"]).sum()),
        "acima_do_maximo": int((estoque > df["qt_maxima"]).sum()),
        "menor_estoque": round(float(estoque.min()), 2),
        "produto_menor_estoque": df.loc[estoque.idxmin(), "xProd"],
        "maior_estoque": round(float(estoque.max()), 2),
    }


def main(produtos):
    """Ponto de entrada usado pelo EEVEE."""
    df = pd.DataFrame(produtos)
    return situacao_estoque(df)


if __name__ == "__main__":
    print(main(produtos))
`,
    supportFiles: SUPPORT_FILES,
  },
];

if (require.main === module) {
  seedPythonModule({
    examples: PANDAS_EXAMPLES,
    defaultClassName: DEFAULT_CLASS_NAME,
    defaultClassDescription: DEFAULT_CLASS_DESCRIPTION,
    envPrefix: 'PANDAS_SEED',
  }).catch((error) => {
    console.error('Pandas examples seed failed:', error);
    process.exit(1);
  });
}
