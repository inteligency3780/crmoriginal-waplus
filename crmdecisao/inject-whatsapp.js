(function () {
  const seenMessageIds = new Set();

  function getChatTitle() {
    const titleNode =
      document.querySelector('[data-testid="conversation-info-header"] span[title]') ||
      document.querySelector('header span[title]');
    return titleNode?.getAttribute("title") || "unknown-chat";
  }

  function getMessageId(node) {
    return (
      node.getAttribute("data-id") ||
      node.dataset?.id ||
      node.getAttribute("data-message-id") ||
      node.querySelector("[data-id]")?.getAttribute("data-id") ||
      `${getChatTitle()}-${(node.innerText || "").slice(0, 100)}`
    );
  }

  function extractIncomingText(messageNode) {
    const textNodes = messageNode.querySelectorAll(".selectable-text span");
    const text = Array.from(textNodes)
      .map((item) => item.textContent?.trim() || "")
      .filter(Boolean)
      .join(" ")
      .trim();

    if (text) return text;

    const fallback = messageNode.innerText?.trim() || "";
    return fallback;
  }

  function postIncomingMessage(text, messageId) {
    if (!text) return;

    window.postMessage(
      {
        source: "CRMDECISAO_INJECT",
        type: "CRMDECISAO_INCOMING_MESSAGE",
        payload: {
          chatId: getChatTitle(),
          text,
          messageId,
          receivedAt: Date.now()
        }
      },
      "*"
    );
  }

  function markExistingAsSeen() {
    document.querySelectorAll("#main .message-in").forEach((node) => {
      const messageId = getMessageId(node);
      seenMessageIds.add(messageId);
    });
  }

  function observeIncomingMessages() {
    const target = document.querySelector("#main") || document.body;
    if (!target) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          if (!(addedNode instanceof HTMLElement)) continue;

          const incomingNodes = [];
          if (addedNode.matches?.(".message-in")) incomingNodes.push(addedNode);
          incomingNodes.push(...addedNode.querySelectorAll?.(".message-in") || []);

          for (const incomingNode of incomingNodes) {
            const messageId = getMessageId(incomingNode);
            if (seenMessageIds.has(messageId)) continue;

            seenMessageIds.add(messageId);
            const text = extractIncomingText(incomingNode);
            postIncomingMessage(text, messageId);
          }
        }
      }
    });

    observer.observe(target, { childList: true, subtree: true });
  }

  function sendViaDom(text) {
    const input =
      document.querySelector('[data-testid="conversation-compose-box-input"] p') ||
      document.querySelector('footer [contenteditable="true"]');

    if (!input) return false;

    input.focus();
    input.dispatchEvent(new Event("focus", { bubbles: true }));

    document.execCommand("selectAll", false);
    document.execCommand("insertText", false, text);

    const sendButton =
      document.querySelector('[data-testid="send"]') ||
      document.querySelector('button span[data-icon="send"]')?.closest("button");

    if (!sendButton) return false;
    sendButton.click();
    return true;
  }

  async function sendViaInternalApi(chatId, text) {
    try {
      if (window.WAPLUS_WPP?.chat?.sendTextMessage) {
        await window.WAPLUS_WPP.chat.sendTextMessage(chatId, text);
        return true;
      }

      if (window.WPP?.chat?.sendTextMessage) {
        await window.WPP.chat.sendTextMessage(chatId, text);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  window.addEventListener("message", async (event) => {
    if (event.source !== window) return;

    const data = event.data;
    if (!data || data.source !== "CRMDECISAO_CONTENT") return;
    if (data.type !== "CRMDECISAO_SEND_REPLY") return;

    const { chatId, text } = data.payload || {};
    if (!text) return;

    const sentByApi = await sendViaInternalApi(chatId, text);
    if (!sentByApi) sendViaDom(text);
  });

  markExistingAsSeen();
  observeIncomingMessages();
})();
