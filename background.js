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
            [
                "ollamaUrl",
                "ollamaModel",
                "rewriteStyle",
                "history",
                "historyLimit",
            ],
            async (settings) => {
                const {
                    ollamaUrl,
                    ollamaModel,
                    rewriteStyle,
                    history = [],
                    historyLimit = 10,
                } = settings;

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

                // Set a "loading" state in storage so the popup can show it
                const loadingState = {
                    status: "loading",
                    original: info.selectionText,
                    rewritten: "...",
                };
                await chrome.storage.local.set({ latestResult: loadingState });

                // Set badge to indicate processing
                chrome.action.setBadgeText({ text: "..." });
                chrome.action.setBadgeBackgroundColor({ color: "#FFA500" }); // Orange

                // Call the API
                await callOllamaAPI(
                    info.selectionText,
                    ollamaUrl,
                    ollamaModel,
                    rewriteStyle,
                    history,
                    historyLimit,
                );
            },
        );
    }
});

// Function to call the Ollama API
async function callOllamaAPI(text, apiUrl, model, style, history, limit) {
    const prompt = `Rewrite the following text to sound more ${style}. Respond with only the rewritten text, without any introductory phrases: "${text}"`;

    try {
        const response = await fetch(`${apiUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(
                `API Error: ${response.status} ${response.statusText}`,
            );
        }

        const data = await response.json();
        const rewrittenText = data.response.trim();

        // Create the new history entry
        const newEntry = {
            original: text,
            rewritten: rewrittenText,
            timestamp: new Date().toISOString(),
        };

        // Update history
        const newHistory = [newEntry, ...history].slice(0, limit);

        // Save the final result and updated history
        await chrome.storage.local.set({
            latestResult: { ...newEntry, status: "complete" },
            history: newHistory,
        });

        // Set badge to indicate success
        chrome.action.setBadgeText({ text: "✓" });
        chrome.action.setBadgeBackgroundColor({ color: "#28a745" }); // Green
    } catch (error) {
        console.error("Ollama API Error:", error);

        // Save an error state
        await chrome.storage.local.set({
            latestResult: {
                status: "error",
                original: text,
                rewritten: `Error: ${error.message}`,
            },
        });

        // Set badge to indicate error
        chrome.action.setBadgeText({ text: "!" });
        chrome.action.setBadgeBackgroundColor({ color: "#dc3545" }); // Red
    }
}
