(function () {
  const processedMessages = new Set();

  function getActiveChatId() {
    const headerTitle =
      document.querySelector('[data-testid="conversation-info-header"] span[title]') ||
      document.querySelector('header span[title]');
    return headerTitle?.getAttribute("title") || "unknown-chat";
  }

  function extractIncomingText(messageNode) {
    const textNodes = messageNode.querySelectorAll(".selectable-text span");
    const text = Array.from(textNodes)
      .map((el) => el.textContent?.trim() || "")
      .filter(Boolean)
      .join(" ")
      .trim();
    return text;
  }

  function postIncoming(text) {
    const chatId = getActiveChatId();
    window.postMessage(
      {
        source: "CRMDECISAO_INJECT",
        type: "CRMDECISAO_INCOMING_MESSAGE",
        payload: {
          chatId,
          text,
          receivedAt: Date.now()
        }
      },
      "*"
    );
  }

  function observeIncoming() {
    const target = document.querySelector("#main") || document.body;
    if (!target) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          const incoming =
            node.matches?.(".message-in") ? node : node.querySelector?.(".message-in");
          if (!incoming) return;

          const msgId =
            incoming.getAttribute("data-id") ||
            incoming.dataset?.id ||
            `${getActiveChatId()}-${incoming.innerText.slice(0, 80)}`;

          if (processedMessages.has(msgId)) return;
          processedMessages.add(msgId);

          const text = extractIncomingText(incoming);
          if (!text) return;
          postIncoming(text);
        });
      });
    });

    observer.observe(target, { childList: true, subtree: true });
  }

  async function sendViaWpp(chatId, text) {
    try {
      if (window.WAPLUS_WPP?.chat?.sendTextMessage) {
        await window.WAPLUS_WPP.chat.sendTextMessage(chatId, text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function sendViaDom(text) {
    const input =
      document.querySelector('[data-testid="conversation-compose-box-input"] p') ||
      document.querySelector('footer [contenteditable="true"]');
    if (!input) return false;

    input.focus();
    document.execCommand("insertText", false, text);

    const sendButton =
      document.querySelector('[data-testid="send"]') ||
      document.querySelector('button span[data-icon="send"]')?.closest("button");

    if (!sendButton) return false;
    sendButton.click();
    return true;
  }

  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "CRMDECISAO_CONTENT") return;
    if (data.type !== "CRMDECISAO_SEND_REPLY") return;

    const { chatId, text } = data.payload || {};
    if (!text) return;

    const sentByApi = await sendViaWpp(chatId, text);
    if (!sentByApi) sendViaDom(text);
  });

  observeIncoming();
})();
