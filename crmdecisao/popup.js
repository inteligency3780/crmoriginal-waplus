const AI_ENDPOINT = "https://lkoutxybaupxjoggxayb.supabase.co/functions/v1/groq-chat";
const AI_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb3V0eHliYXVweGpvZ2d4YXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTQxMjYsImV4cCI6MjA4ODI3MDEyNn0.js0oKNSXhAhW6QE-pVqFY22S15XCukj6KNtnq0VsfLM";

const TAB_TITLES = {
  dashboard: ["Dashboard", "Bem-vindo ao painel de controle da AutoEscola Decisão"],
  whatsapp: ["WhatsApp", "Envie e receba mensagens dos seus alunos"],
  funil: ["Funil", "Acompanhe cada etapa das oportunidades"],
  followup: ["Follow-Up", "Organize retornos e próximos contatos"],
  notificacoes: ["Notificações", "Alertas e avisos operacionais"],
  membros: ["Membros", "Gestão da equipe e disponibilidade"],
  admin: ["Administrador", "Configurações administrativas do CRM"]
};

const state = {
  tab: "dashboard",
  category: "GERAL",
  view: "TODAS",
  selectedChatId: null,
  myUser: "Rodrigo Amaral",
  chats: [
    { id: "1", name: "553492392400", category: "GERAL", owner: "Rodrigo Amaral", unread: true, aiEnabled: true, messages: [{ role: "customer", content: "De carro ou moto são os melhores valores" }] },
    { id: "2", name: "554196971968", category: "COMERCIAL", owner: "Rodrigo Amaral", unread: true, aiEnabled: true, messages: [{ role: "customer", content: "De instrutor eu já estava acostumado" }] },
    { id: "3", name: "558181635648", category: "FINANCEIRO", owner: "Outro usuário", unread: false, aiEnabled: true, messages: [{ role: "customer", content: "Qual das opções você quer?" }] },
    { id: "4", name: "554198691537", category: "TEORICO", owner: "Rodrigo Amaral", unread: false, aiEnabled: true, messages: [{ role: "customer", content: "Vocês têm turma teórica noturna?" }] },
    { id: "5", name: "Autoescola Decisão", category: "PRATICO", owner: "Rodrigo Amaral", unread: true, aiEnabled: true, messages: [{ role: "customer", content: "Boa noite" }] }
  ]
};

function setHeader(tab) {
  const [title, subtitle] = TAB_TITLES[tab] || TAB_TITLES.dashboard;
  document.getElementById("page-title").textContent = title;
  document.getElementById("page-subtitle").textContent = subtitle;
}

function initTabs() {
  const buttons = document.querySelectorAll(".menu-item");
  const panels = document.querySelectorAll(".panel");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      buttons.forEach((item) => item.classList.remove("active"));
      panels.forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(state.tab).classList.add("active");
      setHeader(state.tab);
      if (state.tab === "whatsapp") {
        renderChatList();
        renderChatPanel();
      }
    });
  });
}

function initFilters() {
  document.querySelectorAll("#category-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.category = chip.dataset.category;
      document.querySelectorAll("#category-chips .chip").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      renderChatList();
      renderChatPanel();
    });
  });

  document.querySelectorAll("#view-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.view = chip.dataset.view;
      document.querySelectorAll("#view-chips .chip").forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      renderChatList();
      renderChatPanel();
    });
  });
}

function filteredChats() {
  return state.chats.filter((chat) => {
    const byCategory = chat.category === state.category;
    const byView =
      state.view === "TODAS" ||
      (state.view === "MINHAS" && chat.owner === state.myUser) ||
      (state.view === "NAO_LIDAS" && chat.unread);
    return byCategory && byView;
  });
}

function renderChatList() {
  const root = document.getElementById("chat-list");
  const chats = filteredChats();

  if (!state.selectedChatId || !chats.some((chat) => chat.id === state.selectedChatId)) {
    state.selectedChatId = chats[0]?.id || null;
  }

  if (!chats.length) {
    root.innerHTML = "<div class='chat-item'><div class='chat-name'>Nenhuma conversa</div></div>";
    return;
  }

  root.innerHTML = chats
    .map(
      (chat) => `
      <div class="chat-item ${chat.id === state.selectedChatId ? "active" : ""}" data-id="${chat.id}">
        <div class="chat-name">${chat.name}</div>
        <div class="chat-line"><span>${chat.owner}</span><span>${chat.unread ? "Não lida" : "Lida"}</span></div>
      </div>
    `
    )
    .join("");

  root.querySelectorAll(".chat-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.selectedChatId = item.dataset.id;
      renderChatList();
      renderChatPanel();
    });
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function requestAIReply(customerMessage) {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_TOKEN}`,
      apikey: AI_TOKEN
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "Você é um assistente útil." },
        { role: "user", content: customerMessage }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) throw new Error(`Falha IA (${response.status})`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "Não foi possível gerar resposta.";
}

function renderChatPanel() {
  const root = document.getElementById("chat-panel");
  const chat = filteredChats().find((item) => item.id === state.selectedChatId);

  if (!chat) {
    root.innerHTML = `<div class="wa-empty">AutoEscola Decisão</div>`;
    return;
  }

  root.innerHTML = `
    <div class="chat-head">
      <h3>${chat.name}</h3>
      <label class="switch"><input id="chat-ai-switch" type="checkbox" ${chat.aiEnabled ? "checked" : ""} /> IA ativa</label>
    </div>
    <div class="messages" id="messages-box">
      ${chat.messages.map((message) => `<div class="msg ${message.role}">${escapeHtml(message.content)}</div>`).join("")}
    </div>
    <div class="composer">
      <input id="chat-input" placeholder="Digite uma mensagem do cliente" />
      <button id="simulate-btn">Simular cliente</button>
      <button id="manual-btn">Enviar manual</button>
    </div>
  `;

  root.querySelector("#chat-ai-switch").addEventListener("change", (event) => {
    chat.aiEnabled = event.target.checked;
  });

  root.querySelector("#simulate-btn").addEventListener("click", async () => {
    const input = root.querySelector("#chat-input");
    const text = input.value.trim();
    if (!text) return;

    chat.messages.push({ role: "customer", content: text });
    chat.unread = true;
    input.value = "";
    renderChatList();
    renderChatPanel();

    if (chat.aiEnabled) {
      try {
        const answer = await requestAIReply(text);
        chat.messages.push({ role: "assistant", content: answer });
        chat.unread = false;
      } catch (error) {
        chat.messages.push({ role: "assistant", content: `Erro na IA: ${error.message}` });
      }
      renderChatList();
      renderChatPanel();
    }
  });

  root.querySelector("#manual-btn").addEventListener("click", () => {
    const input = root.querySelector("#chat-input");
    const text = input.value.trim();
    if (!text) return;
    chat.messages.push({ role: "user", content: text });
    chat.unread = false;
    input.value = "";
    renderChatList();
    renderChatPanel();
  });

  const messagesBox = root.querySelector("#messages-box");
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

initTabs();
initFilters();
setHeader(state.tab);
