# CRM Decisão (branch `crmdecisao`)

Interface nova no estilo do layout de referência (tema escuro + sidebar à esquerda).

## Ordem das abas (como no design)
1. Dashboard
2. WhatsApp
3. Funil
4. Follow-Up
5. Notificações
6. Membros
7. Administrador

## WhatsApp
- Exibido somente na aba **WhatsApp**.
- Categorias: **GERAL, COMERCIAL, FINANCEIRO, TEÓRICO, PRÁTICO**.
- Visão: **TODAS, MINHAS, NÃO LIDAS**.
- IA ativa por padrão em cada conversa e switch individual por chat.

## IA
Requisição `POST` para:
`https://lkoutxybaupxjoggxayb.supabase.co/functions/v1/groq-chat`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`
- `apikey: <token>`
