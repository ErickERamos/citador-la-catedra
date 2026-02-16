/**
 * Background Service Worker.
 * Bridges the popup and the content script.
 * Injects extractor on-demand using chrome.scripting.executeScript.
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "extract-metadata") {
    handleExtraction()
      .then((result) => sendResponse(result))
      .catch((err) =>
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : String(err),
        })
      );
    // Return true to indicate async response
    return true;
  }
});

async function handleExtraction() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id) {
    return { success: false, error: "No se pudo acceder a la pestaña activa." };
  }

  // Check if we can inject into this tab
  if (
    tab.url?.startsWith("chrome://") ||
    tab.url?.startsWith("chrome-extension://") ||
    tab.url?.startsWith("about:")
  ) {
    return {
      success: false,
      error: "No se puede extraer metadatos de páginas internas del navegador.",
    };
  }

  try {
    // Step 1: Inject the extractor script (stores result on window.__citadorResult)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/extractor.js"],
    });

    // Step 2: Read the stored result
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const w = window as unknown as Record<string, unknown>;
        const result = w.__citadorResult;
        delete w.__citadorResult;
        return result;
      },
    });

    if (results && results[0]?.result) {
      return { success: true, data: results[0].result };
    }

    return {
      success: false,
      error: "No se pudieron extraer los metadatos de esta página.",
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Error al inyectar el script de extracción.",
    };
  }
}
