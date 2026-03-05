(function () {
  const seenMessageIds = new Set();

  function getChatTitle() {
    const titleNode =
      document.querySelector('[data-testid="conversation-info-header"] span[title]') ||
      document.querySelector('header span[title]');
    return titleNode?.getAttribute("title") || "unknown-chat";
  }

  function extractChatIdFromDataId(dataId = "") {
    const match = dataId.match(/_([^_]+@(?:c|g)\.us)_/);
    return match?.[1] || null;
  }

  function getRawDataId(node) {
    return (
      node.getAttribute("data-id") ||
      node.dataset?.id ||
      node.getAttribute("data-message-id") ||
      node.querySelector("[data-id]")?.getAttribute("data-id") ||
      ""
    );
  }

  function getMessageId(node) {
    const rawId = getRawDataId(node);
    if (rawId) return rawId;
    return `${getChatTitle()}-${(node.innerText || "").slice(0, 100)}`;
  }

  function extractIncomingText(messageNode) {
    const textNodes = messageNode.querySelectorAll(".selectable-text span");
    const text = Array.from(textNodes)
      .map((item) => item.textContent?.trim() || "")
      .filter(Boolean)
      .join(" ")
      .trim();

    if (text) return text;
    return messageNode.innerText?.trim() || "";
  }

  function postIncomingMessage({ text, messageId, chatId }) {
    if (!text) return;

    window.postMessage(
      {
        source: "CRMDECISAO_INJECT",
        type: "CRMDECISAO_INCOMING_MESSAGE",
        payload: {
          chatId,
          chatLabel: getChatTitle(),
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
      seenMessageIds.add(getMessageId(node));
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
          incomingNodes.push(...(addedNode.querySelectorAll?.(".message-in") || []));

          for (const incomingNode of incomingNodes) {
            const messageId = getMessageId(incomingNode);
            if (seenMessageIds.has(messageId)) continue;

            seenMessageIds.add(messageId);
            const rawDataId = getRawDataId(incomingNode);
            const chatId = extractChatIdFromDataId(rawDataId) || getChatTitle();
            const text = extractIncomingText(incomingNode);
            postIncomingMessage({ text, messageId, chatId });
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
    input.textContent = text;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));

    const sendButton =
      document.querySelector('[data-testid="send"]') ||
      document.querySelector('button span[data-icon="send"]')?.closest("button");

    if (sendButton) {
      sendButton.click();
      return true;
    }

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", which: 13, keyCode: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", which: 13, keyCode: 13, bubbles: true }));
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

    const sentByApi = chatId ? await sendViaInternalApi(chatId, text) : false;
    if (!sentByApi) sendViaDom(text);
  });

  markExistingAsSeen();
  observeIncomingMessages();
})();
