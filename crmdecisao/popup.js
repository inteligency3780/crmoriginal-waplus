const AI_ENDPOINT = "https://lkoutxybaupxjoggxayb.supabase.co/functions/v1/groq-chat";
const AI_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb3V0eHliYXVweGpvZ2d4YXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTQxMjYsImV4cCI6MjA4ODI3MDEyNn0.js0oKNSXhAhW6QE-pVqFY22S15XCukj6KNtnq0VsfLM";

const state = {
  selectedTab: "dashboard",
  category: "GERAL",
  view: "TODAS",
  selectedChatId: null,
  myUser: "vendedor-1",
  chats: [
    {
      id: "c1",
      name: "João Silva",
      category: "COMERCIAL",
      owner: "vendedor-1",
      unread: true,
      aiEnabled: true,
      messages: [
        { role: "customer", content: "Olá, quero saber preços." }
      ]
    },
    {
      id: "c2",
      name: "Maria Souza",
      category: "FINANCEIRO",
      owner: "vendedor-2",
      unread: false,
      aiEnabled: true,
      messages: [
        { role: "customer", content: "Preciso da segunda via do boleto." }
      ]
    },
    {
      id: "c3",
      name: "Carlos Lima",
      category: "GERAL",
      owner: "vendedor-1",
      unread: true,
      aiEnabled: true,
      messages: [
        { role: "customer", content: "Vocês atendem em qual horário?" }
      ]
    }
  ]
};

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedTab = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(state.selectedTab)?.classList.add("active");

      if (state.selectedTab === "whatsapp") {
        renderChats();
        renderChatPanel();
      }
    });
  });
}

function initFilters() {
  document.querySelectorAll("#category-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.category = chip.dataset.category;
      document
        .querySelectorAll("#category-chips .chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderChats();
      renderChatPanel();
    });
  });

  document.querySelectorAll("#view-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.view = chip.dataset.view;
      document
        .querySelectorAll("#view-chips .chip")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderChats();
      renderChatPanel();
    });
  });
}

function getFilteredChats() {
  return state.chats.filter((chat) => {
    const byCategory = chat.category === state.category;

    const byView =
      state.view === "TODAS" ||
      (state.view === "MINHAS" && chat.owner === state.myUser) ||
      (state.view === "NAO_LIDAS" && chat.unread);

    return byCategory && byView;
  });
}

function renderChats() {
  const container = document.getElementById("chat-list");
  const chats = getFilteredChats();

  if (!state.selectedChatId || !chats.some((c) => c.id === state.selectedChatId)) {
    state.selectedChatId = chats[0]?.id || null;
  }

  if (!chats.length) {
    container.innerHTML = "<p style='padding:12px'>Sem conversas para o filtro atual.</p>";
    return;
  }

  container.innerHTML = chats
    .map(
      (chat) => `
        <div class="chat-item ${chat.id === state.selectedChatId ? "active" : ""}" data-chat-id="${chat.id}">
          <div class="name">${chat.name}</div>
          <div class="meta">
            <span>${chat.category}</span>
            <span>${chat.unread ? "Não lida" : "Lida"}</span>
          </div>
        </div>
      `
    )
    .join("");

  container.querySelectorAll(".chat-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedChatId = item.dataset.chatId;
      renderChats();
      renderChatPanel();
    });
  });
}

function renderMessages(chat) {
  return chat.messages
    .map((m) => `<div class="msg ${m.role}">${escapeHtml(m.content)}</div>`)
    .join("");
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function requestAIReply(customerMessage) {
  const body = {
    messages: [
      { role: "system", content: "Você é um assistente útil." },
      { role: "user", content: customerMessage }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1024
  };

  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_TOKEN}`,
      apikey: AI_TOKEN
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Falha IA (${response.status})`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "Não foi possível gerar resposta.";
}

function renderChatPanel() {
  const panel = document.getElementById("chat-panel");
  const chats = getFilteredChats();
  const chat = chats.find((c) => c.id === state.selectedChatId);

  if (!chat) {
    panel.innerHTML = "<p>Selecione uma conversa para começar.</p>";
    return;
  }

  panel.innerHTML = `
    <div class="chat-head">
      <div>
        <strong>${chat.name}</strong>
        <div class="helper">Categoria: ${chat.category} • Responsável: ${chat.owner}</div>
      </div>
      <label class="switch">
        <input id="ai-switch" type="checkbox" ${chat.aiEnabled ? "checked" : ""} />
        IA ativa
      </label>
    </div>

    <div class="messages" id="messages-box">${renderMessages(chat)}</div>

    <div class="helper">Quando IA estiver ativa, mensagens do cliente podem receber resposta automática.</div>

    <div class="composer">
      <input id="customer-input" placeholder="Digite uma mensagem do cliente para simular..." />
      <button id="simulate-customer">Simular cliente</button>
      <button id="send-manual">Enviar manual</button>
    </div>
  `;

  panel.querySelector("#ai-switch").addEventListener("change", (event) => {
    chat.aiEnabled = event.target.checked;
  });

  panel.querySelector("#simulate-customer").addEventListener("click", async () => {
    const input = panel.querySelector("#customer-input");
    const text = input.value.trim();
    if (!text) return;

    chat.messages.push({ role: "customer", content: text });
    chat.unread = true;
    input.value = "";
    renderChats();
    renderChatPanel();

    if (chat.aiEnabled) {
      try {
        const aiMessage = await requestAIReply(text);
        chat.messages.push({ role: "assistant", content: aiMessage });
        chat.unread = false;
      } catch (error) {
        chat.messages.push({
          role: "assistant",
          content: `Erro ao consultar IA: ${error.message}`
        });
      }
      renderChats();
      renderChatPanel();
    }
  });

  panel.querySelector("#send-manual").addEventListener("click", () => {
    const input = panel.querySelector("#customer-input");
    const text = input.value.trim();
    if (!text) return;

    chat.messages.push({ role: "user", content: text });
    chat.unread = false;
    input.value = "";
    renderChats();
    renderChatPanel();
  });

  const box = panel.querySelector("#messages-box");
  box.scrollTop = box.scrollHeight;
}

initTabs();
initFilters();
