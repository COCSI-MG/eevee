# Workspace do aluno

O workspace é o ambiente em que você lê o enunciado, organiza os arquivos e desenvolve a solução da atividade.

## Aceitar o termo de uso

No primeiro acesso à atividade neste navegador, o EEVEE apresenta as regras de conduta. Marque a confirmação de leitura e escolha **Continuar** para abrir o editor. A opção **Recusar** retorna à página anterior.

A aceitação fica registrada no navegador para aquela atividade e para a versão atual das regras. Quando o professor altera a política de alertas, o termo é apresentado novamente.

<figure markdown="span">
  ![Termo de uso exibido antes do workspace](../images/assingment-term-of-use.png){ .screenshot }
  <figcaption>Termo de uso apresentado antes do início da atividade.</figcaption>
</figure>

!!! warning "Siga as regras exibidas"
    Sair da tela, abrir ferramentas de desenvolvimento, usar a área de transferência e exceder a velocidade de digitação podem ser bloqueados. O termo informa quais desses eventos contam como alerta punitivo e quantos alertas ativos bloqueiam a atividade.

## Conhecer a interface

<figure markdown="span">
  ![Workspace utilizado pelo aluno](../images/workspace.png){ .screenshot }
  <figcaption>Workspace com explorador de arquivos, enunciado e editor de código.</figcaption>
</figure>

O workspace reúne:

- **Pergunta:** Mostra o título e a descrição da atividade e pode ser recolhida para liberar espaço;
- **Explorador:** Lista os arquivos e pastas da solução;
- **Editor:** Abre o arquivo selecionado e identifica a linguagem pela extensão;
- **Duas páginas:** Permite visualizar e editar dois arquivos lado a lado;
- **Visualização:** Abre a página desenvolvida pelo aluno nas atividades de front-end;
- **Cabeçalho:** Concentra as ações de limpar, executar, enviar e salvar.

O botão **Ver Pergunta** abre o enunciado completo em uma janela, mesmo quando o painel de pergunta está recolhido.

Em telas pequenas, o botão **Arquivos** abre e recolhe o explorador. Ao selecionar um arquivo, o explorador se fecha para liberar espaço para o código.

## Organizar os arquivos

No explorador, você pode:

- Criar arquivos e pastas;
- Renomear ou excluir itens;
- Arrastar itens para reorganizar a árvore;
- Abrir um arquivo no segundo editor pelo menu de contexto;
- Acompanhar os contadores de arquivos e profundidade.

O workspace aceita até 50 arquivos e cinco níveis de profundidade. Preserve os arquivos e caminhos fornecidos no código inicial, pois os testes podem importá-los diretamente.

!!! danger "Limpar restaura o código inicial"
    **Limpar** substitui todo o conteúdo atual pelo boilerplate (código fornecido inicialmente) definido pelo professor . A interface pede confirmação porque essa operação descarta as alterações do workspace.

## Visualizar a página

Clique em **Visualização** para abrir o resultado ao lado do editor. Em telas pequenas, use as abas **Código** e **Resultado**. Se houver mais de uma página, escolha a entrada no seletor da prévia.

A barra de endereço mostra o caminho aberto na aplicação. Digite uma rota, como `/login` ou `/produtos?categoria=livros#lista`, e pressione **Enter** para navegar. Os botões **Voltar** e **Avançar** percorrem o histórico da prévia. O endereço acompanha os links da aplicação, sem alterar a página do workspace. Pressione **Esc** para descartar uma edição no campo.

Use o seletor de tamanho abaixo da barra de endereço para testar a página em diferentes resoluções:

- **Automático:** ocupa o espaço disponível no painel e é o modo inicial;
- **Celular:** 390 × 844 pixels;
- **Tablet:** 768 × 1024 pixels;
- **Desktop:** 1440 × 900 pixels;
- **Personalizado:** informe largura e altura em pixels, com números inteiros maiores que zero, e clique em **Aplicar**.

Quando a resolução ultrapassa o espaço do painel, a prévia aparece reduzida para caber inteira. As dimensões escolhidas continuam valendo para o layout e as media queries. A indicação ao lado do seletor mostra a resolução e a escala de exibição. Trocar o tamanho mantém a página aberta e seu estado. Ao reabrir a visualização, o modo volta para **Automático**.

Nas atividades React.js + Cypress, a opção **Aplicação React** usa `src/main.tsx` como entrada. Também aceita `main.jsx`, `main.ts` e `main.js` nessa pasta. Você pode importar componentes locais, arquivos JSON, CSS e SVG. React e ReactDOM já estão disponíveis.

Para uma página HTML, selecione o arquivo `.html` ou `.htm`. Os caminhos de scripts e folhas de estilo são resolvidos a partir da pasta desse arquivo. Bibliotecas npm adicionais não são configuradas pelo `package.json` do workspace nesta versão.

A prévia usa Sandpack e precisa de conexão com os serviços do CodeSandbox para carregar o ambiente e as dependências. Se o carregamento falhar, verifique a conexão e clique em **Tentar novamente**.

A prévia atualiza após uma pausa de meio segundo na edição e mantém o último resultado visível durante a atualização. O Sandpack aplica as alterações automaticamente e pode preservar o estado dos componentes React. O botão **Atualizar prévia** reinicia a página na rota atual, contadores e outros estados da interface voltam ao valor inicial. Erros aparecem acima da página e podem ser corrigidos no editor.

A visualização roda no navegador e não consome tentativas. Para executar os testes Cypress, use o fluxo de execução da atividade. Interagir com a prévia faz parte do workspace, sair da janela continua sujeito às regras de alerta.

## Entender onde o trabalho fica salvo

As alterações no editor e na árvore de arquivos são mantidas automaticamente no armazenamento local do navegador, separadas por aluno e atividade. Ao voltar à atividade no mesmo navegador, o workspace recupera esse conteúdo.

O botão **Salvar** envia ao serviço de armazenamento apenas o arquivo que está selecionado. Ele não substitui o envio para correção e não representa uma cópia completa do workspace.

!!! warning "Use o mesmo navegador"
    O conteúdo automático do workspace é local. Limpar os dados do navegador ou mudar de navegador ou dispositivo pode impedir a recuperação dessa versão. Antes de encerrar o trabalho, confirme as orientações de armazenamento da sua instituição.

## Alertas e bloqueio

Cada ocorrência mostra um aviso. Quando o evento não está selecionado pelo professor, a ação continua bloqueada, mas não gera registro punitivo. Se a conexão falhar, um evento punitivo pendente é reenviado com o mesmo identificador, sem duplicar o alerta.

Ao atingir o limite de alertas ativos, o workspace exibe uma mensagem de bloqueio e oferece apenas o retorno à página anterior. O professor pode arquivar ocorrências específicas; o acesso é liberado quando a quantidade de alertas ativos fica abaixo do limite, e os registros arquivados continuam disponíveis no histórico.

## Continuar

- [Executar uma prévia e enviar para correção](submissions-and-results.md)
- [Voltar para turmas e atividades](classes-and-assignments.md)
