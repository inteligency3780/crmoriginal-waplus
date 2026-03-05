const AI_ENDPOINT = "https://lkoutxybaupxjoggxayb.supabase.co/functions/v1/groq-chat";
const AI_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb3V0eHliYXVweGpvZ2d4YXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTQxMjYsImV4cCI6MjA4ODI3MDEyNn0.js0oKNSXhAhW6QE-pVqFY22S15XCukj6KNtnq0VsfLM";

function injectBridge() {
  if (document.getElementById("crmdecisao-inject")) return;
  const script = document.createElement("script");
  script.id = "crmdecisao-inject";
  script.src = chrome.runtime.getURL("inject-whatsapp.js");
  (document.head || document.documentElement).appendChild(script);
}

async function loadRules() {
  const { crmDecisaoAiRules } = await chrome.storage.local.get("crmDecisaoAiRules");
  return crmDecisaoAiRules || { globalEnabled: true, chatEnabled: {} };
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
  return data?.choices?.[0]?.message?.content || "";
}

async function processIncoming(payload) {
  const rules = await loadRules();
  if (!rules.globalEnabled) return;

  const enabledForChat = rules.chatEnabled[payload.chatId] ?? true;
  if (!enabledForChat) return;

  const reply = await requestAIReply(payload.text);
  if (!reply) return;

  window.postMessage(
    {
      source: "CRMDECISAO_CONTENT",
      type: "CRMDECISAO_SEND_REPLY",
      payload: {
        chatId: payload.chatId,
        text: reply
      }
    },
    "*"
  );
}

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== "CRMDECISAO_INJECT") return;

  if (data.type === "CRMDECISAO_INCOMING_MESSAGE") {
    try {
      await processIncoming(data.payload);
    } catch (error) {
      console.warn("[CRM Decisão] erro no processamento IA:", error.message);
    }
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CRMDECISAO_UPDATE_CHAT_AI") {
    loadRules()
      .then((rules) => {
        rules.chatEnabled[message.chatId] = message.enabled;
        return chrome.storage.local.set({ crmDecisaoAiRules: rules });
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "CRMDECISAO_SET_GLOBAL_AI") {
    loadRules()
      .then((rules) => {
        rules.globalEnabled = message.enabled;
        return chrome.storage.local.set({ crmDecisaoAiRules: rules });
      })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

injectBridge();
