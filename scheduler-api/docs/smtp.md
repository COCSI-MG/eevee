# Configuração do SMTP do Gmail

Este documento descreve o passo a passo para configurar o envio de e-mails via SMTP do Gmail nesta aplicação.

## Pré-requisitos

- Uma conta Gmail (pessoal ou Google Workspace)
- Acesso ao arquivo `.env` do projeto

---

## 1. Ativar a verificação em duas etapas

O Google exige a verificação em duas etapas ativada para permitir a geração de senhas de app.

1. Acesse [myaccount.google.com/security](https://myaccount.google.com/security)
2. Na seção **"Como você faz login no Google"**, clique em **"Verificação em duas etapas"**
3. Siga o processo de confirmação (normalmente via celular/SMS)
4. Ative a opção

---

## 2. Gerar a senha de app

1. Acesse diretamente: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Caso o link não funcione, vá em **Segurança** → role até **"Verificação em duas etapas"** → no final da página encontre **"Senhas de app"**
2. Em **"Nome do app"**, digite um nome identificável (ex: `minha-aplicacao-smtp`)
3. Clique em **"Criar"**
4. O Google vai gerar uma senha de **16 caracteres** (formato: `abcd efgh ijkl mnop`)
5. **Copie a senha imediatamente** — ela é exibida apenas uma vez. Se perdê-la, será necessário revogar e gerar outra.

> ⚠️ **Nunca use a senha normal da conta Google.** Desde 2022 ela não funciona mais para SMTP, e mesmo que funcionasse, seria um risco expor a senha principal da conta em uma aplicação.

---

## 3. Credenciais a serem utilizadas

| Variável | Valor |
|---|---|
| `GMAIL_USER` | E-mail completo da conta (ex: `seuemail@gmail.com`) |
| `GMAIL_APP_PASSWORD` | Senha de app de 16 caracteres gerada no passo 2 (remova os espaços) |

---

## 4. Configurar o `.env` do projeto

Adicione as variáveis no arquivo `.env`:

```env
GMAIL_USER=seuemail@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```