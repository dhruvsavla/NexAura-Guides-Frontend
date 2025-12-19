// popup.js — auto-open the chatbot panel on click
(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.startsWith("http")) {
      alert("This extension only works on regular websites.");
      window.close();
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_IFRAME" }, { frameId: 0 });
  } catch (e) {
    console.warn("Popup failed to open panel", e);
  } finally {
    // Wake background service worker and close
    chrome.runtime.sendMessage({ type: "PING" }, () => {});
    setTimeout(() => window.close(), 100);
  }
})();
