# Análise técnica do repositório WAPlus CRM (build compilada)

## Escopo e limitações

Este repositório contém majoritariamente artefatos compilados/minificados de uma extensão Chrome (não o código-fonte Vue original), então a análise abaixo é baseada em:

- Manifesto da extensão.
- Strings internas dos bundles (`background.js`, `content-script.js`, `inject-script.js`).
- Estrutura de permissões e pontos de injeção.

## Arquitetura principal

1. **Service Worker (`background.js`)**
   - Orquestra estado global, menus, eventos e textos de funcionalidades CRM.
   - Há evidências de módulos/labels para abas e classificação de conversas: **Awaiting Reply**, **Needs Reply**, **Auto Replied**, **Broadcast Lists**.

2. **Content scripts no WhatsApp Web**
   - `content-script.js` e `js/document_start.js` rodam em `https://web.whatsapp.com/*`.
   - `content-script.js` injeta o script principal da automação para executar no contexto da página.

3. **Script injetado na página (`inject-script.js`)**
   - É onde fica a integração direta com objetos internos do WhatsApp Web via namespace `window.WAPLUS_WPP`.
   - Implementa leitura de chats/mensagens, envio de texto, envio de arquivo, marcação de não lida, arquivamento, busca/listagem de chats e patch de busca.

4. **Popup (`popup.js` + `chunk-vendors.js`)**
   - O popup só valida/abre o WhatsApp Web; a lógica de produto está concentrada nos bundles principais.

## Como os filtros principais parecem funcionar

### 1) Filtros de caixa/atendimento (nível de produto)

No `background.js`, aparecem rótulos que sugerem uma classificação de conversas por estado operacional:

- `Awaiting Reply`
- `Needs Reply`
- `Auto Replied`
- `Broadcast Lists`

Além disso, surgem chaves relacionadas a ordenação e abas de conversa (`sortChats`, `chatTabs`, `addChatToTab` em outros bundles), indicando que o produto mantém **listas filtradas/segmentadas** por critérios de resposta e campanha.

### 2) Filtros por palavra-chave (auto resposta)

Ainda no `background.js`, existem labels específicas da funcionalidade de auto resposta:

- `autoReplyTableExpectedKeywords`
- `keywordIsEmpty`
- `keywordWithExtraSpace`
- Texto indicando múltiplas keywords separadas por delimitador (campo de template de palavras-chave)

Isso indica fluxo de regra semelhante a:

- Definição de template de resposta.
- Lista de palavras-chave gatilho.
- Opções adicionais (dias específicos, grupos, arquivar após responder, não responder chats ativos etc.).

## Como IA / resposta automática parecem ser feitas

### 1) Execução no contexto do WhatsApp Web

No `inject-script.js`, a extensão usa wrappers sobre `window.WAPLUS_WPP.chat.*` para operações reais:

- `sendTextMessage`
- `sendFileMessage`
- `getMessages`
- `getMessageById`

Também aparecem rotinas como `getChatMessagesBetween`, `safeGetChatStoreModels` e serialização/normalização de chats.

**Leitura:** regras de automação (e possivelmente IA) geram payloads e delegam o envio para os métodos internos do WhatsApp via `WAPLUS_WPP`.

### 2) Pipeline comum “auto reply ou IA”

Há marcador explícito de telemetria/categoria `autoReplyOrAI` em logs de envio no `inject-script.js`, o que sugere que:

- Auto resposta por regra e respostas sugeridas por IA compartilham parte da mesma infraestrutura de envio.
- A distinção entre “regra fixa” e “IA” provavelmente acontece antes do envio final (em camada de decisão/payload).

### 3) Evidência de posicionamento IA no produto

O texto oficial da extensão (`_locales/en/messages.json`) descreve “**AI-Powered Messaging CRM**” e cita chatbot **DeepSeek AI**.

## Fluxo provável de “resposta automática”

1. Usuário configura regra/template no painel (keywords, escopo, restrições).
2. Eventos/mensagens no WhatsApp são capturados por scripts da extensão.
3. Regra é avaliada (keyword + contexto/escopo).
4. Mensagem final é enviada por `WAPLUS_WPP.chat.sendTextMessage` (ou arquivo, quando aplicável).
5. Estado da conversa pode ser atualizado (ex.: auto replied, arquivar, marcar não lida) e refletido nos filtros de caixa.

## Observação importante

Como é build minificada, não dá para afirmar com 100% de precisão o algoritmo interno de matching/score da IA apenas por inspeção estática. Mas os pontos acima têm suporte textual/estrutural claro nos artefatos.
