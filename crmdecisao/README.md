# CRM Decisão (branch `crmdecisao`)

Interface no estilo dark com sidebar à esquerda, inspirada no main.

## Versão
- `3.0.5`

## Ordem das abas
1. Dashboard
2. WhatsApp
3. Funil
4. Follow-Up
5. Notificações
6. Membros
7. Administrador

## Pipeline da IA (replicando o padrão do main)
A automação de IA foi estruturada em **3 etapas**:

1. **Recebimento** (lado WhatsApp Web)
   - `inject-whatsapp.js` observa `message-in` novas no DOM e envia evento estruturado para o content script.
2. **Processamento** (seu backend)
   - `content-script.js` chama o endpoint Supabase informado com o payload da mensagem do cliente.
3. **Resposta** (lado WhatsApp Web)
   - `inject-whatsapp.js` envia resposta usando API interna (`WAPLUS_WPP`/`WPP`) com fallback para envio por DOM.

## IA por conversa
- IA ativa por padrão.
- Switch por conversa no popup.
- Preferências por chat ficam salvas em `chrome.storage.local` e são propagadas para abas abertas do WhatsApp.

## Endpoint de processamento
`POST https://lkoutxybaupxjoggxayb.supabase.co/functions/v1/groq-chat`
