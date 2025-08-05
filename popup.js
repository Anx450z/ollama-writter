document.addEventListener("DOMContentLoaded", () => {
    const tabResult = document.getElementById("tab-result");
    const tabHistory = document.getElementById("tab-history");
    const viewResult = document.getElementById("view-result");
    const viewHistory = document.getElementById("view-history");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

    // Tab switching logic
    tabResult.addEventListener("click", () => {
        showView("result");
    });

    tabHistory.addEventListener("click", () => {
        showView("history");
    });

    clearHistoryBtn.addEventListener("click", () => {
        chrome.storage.local.set({ history: [], latestResult: null }, () => {
            loadHistory();
            loadResult();
            // Optional: notify user
        });
    });

    function showView(viewName) {
        if (viewName === "result") {
            tabResult.classList.add("active");
            tabHistory.classList.remove("active");
            viewResult.classList.add("active");
            viewHistory.classList.remove("active");
        } else {
            tabResult.classList.remove("active");
            tabHistory.classList.add("active");
            viewResult.classList.remove("active");
            viewHistory.classList.add("active");
        }
    }

    function createCopyButton(textToCopy) {
        const button = document.createElement("button");
        button.className = "copy-btn";
        button.textContent = "Copy";
        button.addEventListener("click", (e) => {
            navigator.clipboard.writeText(textToCopy).then(() => {
                e.target.textContent = "Copied!";
                setTimeout(() => {
                    e.target.textContent = "Copy";
                }, 2000);
            });
        });
        return button;
    }

    function loadResult() {
        const resultContent = document.getElementById("result-content");
        const placeholder = document.getElementById("result-placeholder");
        resultContent.innerHTML = "";

        chrome.storage.local.get("latestResult", (data) => {
            if (data.latestResult) {
                placeholder.style.display = "none";
                const { original, rewritten, status } = data.latestResult;

                const card = document.createElement("div");
                card.className = "result-card";

                if (status === "loading") {
                    card.innerHTML =
                        "<h3>Processing...</h3><p>Your text is being rewritten.</p>";
                } else {
                    card.innerHTML = `
                        <h3>Rewritten Text</h3>
                        <pre>${rewritten}</pre>
                        <h3>Original Text</h3>
                        <pre>${original}</pre>
                    `;
                    const actions = document.createElement("div");
                    actions.className = "actions";
                    actions.appendChild(createCopyButton(rewritten));
                    card.appendChild(actions);
                }
                resultContent.appendChild(card);
            } else {
                placeholder.style.display = "block";
            }
        });
    }

    function loadHistory() {
        const historyList = document.getElementById("history-list");
        const placeholder = document.getElementById("history-placeholder");
        historyList.innerHTML = "";
        chrome.storage.local.get("history", (data) => {
            if (data.history && data.history.length > 0) {
                placeholder.style.display = "none";
                data.history.forEach((item) => {
                    const historyItem = document.createElement("div");
                    historyItem.className = "history-item";
                    historyItem.innerHTML = `
                        <h3>Rewritten:</h3>
                        <pre>${item.rewritten}</pre>
                    `;
                    const actions = document.createElement("div");
                    actions.className = "actions";
                    actions.appendChild(createCopyButton(item.rewritten));
                    historyItem.appendChild(actions);

                    historyList.appendChild(historyItem);
                });
            } else {
                placeholder.style.display = "block";
            }
        });
    }

    // Load data when popup opens
    loadResult();
    loadHistory();

    // Listen for storage changes to update UI in real-time
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && (changes.latestResult || changes.history)) {
            loadResult();
            loadHistory();
        }
    });

    // Clear the badge when the popup is opened
    chrome.action.setBadgeText({ text: "" });
});
