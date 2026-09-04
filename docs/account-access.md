# Conta e acesso

O EEVEE permite criar uma conta de estudante, entrar com uma conta existente e recuperar uma senha esquecida. Contas administrativas são criadas ou promovidas por outra pessoa administradora.

## Criar uma conta

Na página de login, escolha **Crie uma agora**, informe nome, e-mail e senha e conclua o cadastro. A nova conta é criada como estudante.

!!! note "A matrícula é separada"
    Criar uma conta não adiciona o estudante a uma turma. Uma pessoa administradora precisa fazer essa associação antes que atividades e provas apareçam.

## Entrar e sair

Informe o e-mail e a senha na tela de login. Depois da autenticação, estudantes são direcionados para suas turmas e administradores para o painel de gestão.

A sessão dura por padrão 12 horas, mas pode ser alterada por quem mantém a instalação. Use **Sair** ao terminar, especialmente em computadores compartilhados.

## Recuperar a senha

1. Na tela de login, escolha **Esqueceu a senha?**.
2. Informe o e-mail da conta.
3. Abra o link enviado por e-mail.
4. Informe e confirme a nova senha, com pelo menos seis caracteres.

O link é válido por uma hora e só pode ser usado uma vez. Por segurança, a tela apresenta a mesma confirmação mesmo quando não existe uma conta com o e-mail informado.

Se o e-mail não chegar, verifique a caixa de spam e peça à equipe responsável pela instalação para confirmar a configuração de envio. Administradores também podem definir uma nova senha ao editar uma conta, nesse fluxo, a senha deve ter pelo menos oito caracteres.

!!! info "Instalação própria"
    O envio depende das variáveis SMTP descritas em [Ambiente local e Docker](local-development.md#recuperacao-de-senha-e-smtp).

