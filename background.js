// Create the context menu item upon installation.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "ollama-rewrite",
        title: "Rewrite with Ollama",
        contexts: ["selection"],
    });
});

// Listener for the context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "ollama-rewrite" && info.selectionText) {
        // Get settings from storage
        chrome.storage.local.get(
            ["ollamaUrl", "ollamaModel", "rewriteStyle"],
            async (settings) => {
                const { ollamaUrl, ollamaModel, rewriteStyle } = settings;

                if (!ollamaUrl || !ollamaModel) {
                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: "icons/icon48.png",
                        title: "Ollama Rewriter Error",
                        message:
                            "API URL or model not configured. Please set them in the extension options.",
                    });
                    return;
                }

                // Show a "loading" notification
                const notificationId = `rewriting-${Date.now()}`;
                chrome.notifications.create(notificationId, {
                    type: "basic",
                    iconUrl: "icons/icon48.png",
                    title: "Ollama Rewriter",
                    message: "Processing your text...",
                    priority: 1,
                });

                await callOllamaAPI(
                    info.selectionText,
                    tab.id,
                    ollamaUrl,
                    ollamaModel,
                    rewriteStyle,
                    notificationId,
                );
            },
        );
    }
});

// Function to call the Ollama API
async function callOllamaAPI(
    text,
    tabId,
    apiUrl,
    model,
    style,
    notificationId,
) {
    const prompt = `Rewrite the following text to sound more ${style}. Respond with only the rewritten text, without any introductory phrases: "${text}"`;

    try {
        const response = await fetch(`${apiUrl}/api/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false, // We want the full response at once
            }),
        });

        if (!response.ok) {
            throw new Error(
                `API Error: ${response.status} ${response.statusText}`,
            );
        }

        const data = await response.json();
        const rewrittenText = data.response.trim();

        // Send the rewritten text to the content script
        chrome.tabs.sendMessage(tabId, {
            action: "replaceText",
            text: rewrittenText,
        });

        // Update notification to show success
        chrome.notifications.update(notificationId, {
            title: "Ollama Rewriter",
            message: "Text successfully rewritten and copied to clipboard!",
        });
    } catch (error) {
        console.error("Ollama API Error:", error);
        // Update notification to show error
        chrome.notifications.update(notificationId, {
            title: "Ollama Rewriter Error",
            message: `Failed to connect to Ollama. Make sure it's running and the URL is correct. Error: ${error.message}`,
        });
    }
}
