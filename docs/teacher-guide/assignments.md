# Criar uma atividade

A interface administrativa usa um assistente em etapas. Uma atividade representa um exercício de programação associado a exatamente uma turma.

<figure markdown="span">
  ![Formulário de editar turma](/images/steps-by-assingment.png){ .screenshot }
  <figcaption>Etapas para criar uma atividade</figcaption>
</figure>

Caso esteja usando um worker com banco de dados, aparecerá um novo campo para preencher o script de sql inicial.

<figure markdown="span">
  ![Formulário de editar turma](/images/steps-by-assingment-sql.png){ .screenshot }
  <figcaption>Etapas para criar uma atividade com banco de dados</figcaption>
</figure>

## 1. Configuração básica

Informe:

- título;
- descrição;
- turma;
- tipo de executor;
- número máximo de tentativas.

O tipo escolhido controla os templates exibidos nas etapas seguintes. A descrição deve conter todas as informações que o estudante precisa para compreender e realizar a atividade

<figure markdown="span">
  ![Formulário de editar turma](/images/form-basic-settings-assingment.png){ .screenshot }
  <figcaption>Formulário de configuração básica de atividade</figcaption>
</figure>

## 2. Templates e parâmetros

Selecione os templates compatíveis. Para cada um, preencha todos os parâmetros exibidos.

<figure markdown="span">
  ![Formulário de editar turma](/images/form-template-assingment.png){ .screenshot }
  <figcaption>Formulário de configuração dos templates na atividade</figcaption>
</figure>

<figure markdown="span">
  ![Formulário de editar turma](/images/form-template-params-assingment.png){ .screenshot }
  <figcaption>Formulário de configuração dos parâmetros do template na atividade</figcaption>
</figure>

## 3. Código inicial

O boilerplate é a base apresentada no workspace que o aluno efetuará a prova. A interface sugere um conteúdo por executor. Mantenha os caminhos exigidos pela pré-validação:

<figure markdown="span">
  ![Formulário de editar turma](/images/form-start-code-assingment.png){ .screenshot }
  <figcaption>Formulário de configuração do código inicial na atividade</figcaption>
</figure>

## 4. Script SQL

Para workers que se utilizam de banco de dados, a interface apresenta um campo opcional de inicialização SQL.

<figure markdown="span">
  ![Formulário de editar turma](/images/form-sql-script-assingment.png){ .screenshot }
  <figcaption>Formulário de configuração do script de sql inicial na atividade</figcaption>
</figure>

## 5. Revisão e salvamento

Revise os valores e salve. ASsim que publicada a atividade salva pode ser consultada pelos estudantes matriculados na turma.

## Editar uma atividade

Na edição, a interface que aparece é a mesma, basta se utilizar dela e editar os itens que deseja.