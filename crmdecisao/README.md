# CRM Decisão (branch `crmdecisao`)

Interface no estilo dark com sidebar à esquerda, inspirada no main.

## Ordem das abas
1. Dashboard
2. WhatsApp
3. Funil
4. Follow-Up
5. Notificações
6. Membros
7. Administrador

## Pipeline da IA (igual conceito do main)
A automação de IA foi estruturada em **3 etapas**:

1. **Recebimento** (no WhatsApp Web)
   - `inject-whatsapp.js` observa mensagens novas recebidas (`message-in`) e envia evento para o `content-script.js`.
2. **Processamento** (no seu backend)
   - `content-script.js` chama o endpoint Supabase informado com o payload de mensagens.
3. **Resposta** (de volta no WhatsApp)
   - `inject-whatsapp.js` tenta responder com API interna (`WAPLUS_WPP.chat.sendTextMessage`) e usa fallback por DOM quando necessário.

## IA por conversa
- IA ativa por padrão.
- Switch por conversa no popup.
- Preferências por chat ficam salvas em `chrome.storage.local` e são enviadas para a aba do WhatsApp.

## Endpoint de processamento
`POST https://lkoutxybaupxjoggxayb.supabase.co/functions/v1/groq-chat`
