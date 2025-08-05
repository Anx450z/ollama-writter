// Fetches models from the user-provided Ollama API URL
async function fetchOllamaModels(savedModel = null) {
    const url = document.getElementById("ollama-url").value;
    const modelSelect = document.getElementById("model-select");
    const fetchBtn = document.getElementById("fetch-models-btn");
    const fetchStatus = document.getElementById("fetch-status");

    if (!url) {
        fetchStatus.textContent = "Please enter an Ollama API URL first.";
        fetchStatus.style.color = "red";
        return;
    }

    // Update UI to show loading state
    fetchStatus.textContent = "Fetching models...";
    fetchStatus.style.color = "#666";
    fetchBtn.disabled = true;
    modelSelect.innerHTML = "<option>Loading...</option>";

    try {
        const response = await fetch(`${url}/api/tags`);
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();

        // Clear the dropdown
        modelSelect.innerHTML = "";

        if (data.models && data.models.length > 0) {
            data.models.forEach((model) => {
                const option = document.createElement("option");
                option.value = model.name;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
            fetchStatus.textContent = "Success! Models loaded.";
            fetchStatus.style.color = "green";

            // If a previously saved model exists, try to select it
            if (savedModel) {
                modelSelect.value = savedModel;
            }
        } else {
            modelSelect.innerHTML =
                '<option value="" disabled>No models found</option>';
            fetchStatus.textContent = "No models found on the server.";
            fetchStatus.style.color = "orange";
        }
    } catch (error) {
        console.error("Failed to fetch Ollama models:", error);
        modelSelect.innerHTML =
            '<option value="" disabled>Failed to fetch</option>';
        fetchStatus.textContent =
            "Error: Could not connect to Ollama. Is it running?";
        fetchStatus.style.color = "red";
    } finally {
        // Re-enable the button and clear the status after a delay
        fetchBtn.disabled = false;
        setTimeout(() => {
            fetchStatus.textContent = "";
        }, 3000);
    }
}

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

// Restores preferences from chrome.storage and fetches models on load
function restoreOptions() {
    chrome.storage.local.get(
        {
            ollamaUrl: "http://localhost:11434",
            ollamaModel: "", // Don't default a model, let it be selected after fetch
            rewriteStyle: "professionally",
        },
        (items) => {
            document.getElementById("ollama-url").value = items.ollamaUrl;
            document.getElementById("style-select").value = items.rewriteStyle;

            // Fetch models on page load, and pass the saved model to be selected
            fetchOllamaModels(items.ollamaModel);
        },
    );
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save-btn").addEventListener("click", saveOptions);
document
    .getElementById("fetch-models-btn")
    .addEventListener("click", () => fetchOllamaModels());
