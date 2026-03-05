# CRM Decisão (branch crmdecisao)

Nova extensão inspirada no comportamento do projeto principal, com interface lateral e foco em operação de atendimento.

## Abas no sidebar esquerdo
- DASHBOARD
- FUNIL
- FOLLOWUP
- NOTIFICAÇÕES
- MEMBROS
- ADMIN
- WHATSAPP

## WhatsApp
- Visível apenas na aba **WHATSAPP**.
- Categorias: **GERAL, COMERCIAL, FINANCEIRO, TEÓRICO, PRÁTICO**.
- Filtros: **TODAS, MINHAS, NÃO LIDAS**.
- IA ativa por padrão e switch individual por conversa.

## Integração de IA
A aba WhatsApp usa o endpoint Supabase informado para gerar resposta automática quando o switch da conversa está ativo.

### Endpoint
`POST https://lkoutxybaupxjoggxayb.supabase.co/functions/v1/groq-chat`

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`
- `apikey: <token>`

Body:
```json
{
  "messages": [
    { "role": "system", "content": "Você é um assistente útil." },
    { "role": "user", "content": "Olá, como vai?" }
  ],
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.7,
  "max_tokens": 1024
}
```
