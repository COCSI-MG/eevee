# Convites por e-mail

Em **Usuários → Convidar alunos por e-mail**, prepare um lote de até 50 pessoas. Também é possível abrir **Convidar alunos para esta turma** na edição de uma turma, com ela já selecionada.

Informe uma pessoa por linha:

```text
Ana Silva; ana@example.com
Bruno Souza; bruno@example.com
```

Selecione as turmas que todas as pessoas desse lote devem receber, clique em **Revisar destinatários**, confira nomes, endereços e turmas e só então em **Enviar convites por e-mail**. Use lotes separados para conjuntos diferentes de turmas. O sistema não deduz e-mails a partir de nomes, não cria senhas genéricas e não cria contas antes da aceitação.

Cada pessoa recebe uma mensagem individual, sem expor os demais destinatários, com o nome das turmas e um link de uso único válido por sete dias. O aluno cria sua senha pessoal e é matriculado ao aceitar. Quem já tem conta confirma a senha atual; a senha e o nome existentes não são substituídos. Senhas novas têm pelo menos oito caracteres e no máximo 72 bytes. Contas removidas ou e-mails com contas ambíguas precisam ser revisados pelo administrador.

Após aceitar, o aluno entra normalmente na plataforma. Se já estiver conectado com outra conta, deve sair dela antes de entrar com o e-mail convidado.

## Acompanhamento

O histórico tem paginação e total de registros. Mostra convites enviados, falhas, aceitos, expirados e revogados. **Enviado ao servidor de e-mail** significa aceito pelo SMTP, não confirmação de entrega na caixa de entrada ou leitura. Não há rastreamento de abertura nem processamento de bounces.

- **Reenviar** gera um link novo, invalida o anterior e renova os sete dias. Aguarde pelo menos um minuto entre envios. Convites aceitos ou revogados não podem ser reenviados.
- **Revogar** impede a aceitação. Não remove matrículas de convites já aceitos; essas são gerenciadas na turma.
- Há somente um convite ativo por e-mail. Para mudar suas turmas antes da aceitação, revogue o anterior e crie outro.
- O lote envia sequencialmente e exibe um resultado por pessoa. Falhas de um destinatário não interrompem os demais. Não feche a página durante o envio; confira o histórico antes de repetir um lote interrompido. Não há envio automático em segundo plano.

## Configuração e implantação

Antes de publicar a API nova, aplique as migrations com **`make migration-run`**, incluindo `PlatformInvitations1790265600000`. A migration cria somente a tabela e o índice dos convites. Não envia e-mails nem cria usuários. Em `make migration-show`, `[X]` significa aplicada e `[ ]` significa pendente.

Configure `platform-api/.env` no ambiente de destino:

```dotenv
FRONT_URL=https://eevee.sua-instituicao.example
MAIL_FROM=EEVEE <convites@sua-instituicao.example>
SMTP_HOST=smtp.sua-instituicao.example
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario-smtp
SMTP_PASSWORD=senha-ou-token-smtp
```

`FRONT_URL` deve ser o endereço público real do frontend, acessível aos alunos. A página de aceitação é `/invitation`. O link transporta o token no fragmento e o navegador o envia no corpo do POST; o banco guarda apenas SHA-256 do token. Use HTTPS em produção e mantenha os corpos dessas requisições fora de logs de aplicação/proxy.

O SMTP existente do Gmail continua funcionando com `GMAIL_USER` e `GMAIL_APP_PASSWORD` se as variáveis `SMTP_*` não estiverem configuradas. `MAIL_FROM` pode ser omitido nessa configuração; usa-se `GMAIL_USER`. Na porta 465, use `SMTP_SECURE=true`. Para servidor local de captura sem autenticação, configure host/porta e `MAIL_FROM`, sem usuário/senha. Ajuste o remetente e a autenticação conforme as exigências do provedor. Não coloque credenciais no frontend.

Reinicie a API após configurar. Faça um convite de teste para um endereço sob seu controle antes do lote real. O desenvolvimento não enviou e-mails reais nem aplicou a migration permanentemente.

## Validação técnica

`make test-invitations` compila a API e executa testes de integração no banco configurado em `platform-api/.env`. O transporte de e-mail é substituído por um mock. A migration, quando necessária ao teste, e todos os registros de teste ficam em transação revertida ao final. Sequências PostgreSQL podem avançar mesmo com rollback. Use um banco de desenvolvimento.

Os testes cobrem autorização administrativa, existência das turmas, armazenamento de hash, aceitação, matrícula, reuso de conta/senha, links expirados/revogados/reutilizados, reenvio, falha de transporte e paginação. Há testes unitários de validação, aceitação no frontend, parsing de listas e resultado SMTP.
