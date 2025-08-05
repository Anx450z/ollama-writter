// Saves options to chrome.storage
function saveOptions() {
    const url = document.getElementById("ollama-url").value;
    const model = document.getElementById("model-select").value;
    const style = document.getElementById("style-select").value;

    chrome.storage.local.set(
        {
            ollamaUrl: url,
            ollamaModel: model,
            rewriteStyle: style,
        },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById("status");
            status.textContent = "Options saved.";
            setTimeout(() => {
                status.textContent = "";
            }, 1500);
        },
    );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    // Default values
    chrome.storage.local.get(
        {
            ollamaUrl: "http://localhost:11434",
            ollamaModel: "llama3",
            rewriteStyle: "professionally",
        },
        (items) => {
            document.getElementById("ollama-url").value = items.ollamaUrl;
            document.getElementById("model-select").value = items.ollamaModel;
            document.getElementById("style-select").value = items.rewriteStyle;
        },
    );
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save-btn").addEventListener("click", saveOptions);
