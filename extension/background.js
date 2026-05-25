chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "SV_INSERT") return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) { sendResponse({ ok: false }); return; }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: insertContent,
        args: [message.contentHtml, message.contentPlain],
      },
      () => sendResponse({ ok: true }),
    );
  });

  return true; // keep channel open for async sendResponse
});

function insertContent(html, plain) {
  const el = document.activeElement;
  if (!el) return;

  if (el.isContentEditable || el.contentEditable === "true") {
    document.execCommand("insertHTML", false, html || plain || "");
    return;
  }

  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const text = plain || "";
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
