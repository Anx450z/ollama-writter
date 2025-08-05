let lastActiveElement;

// Keep track of the last active element to know where to paste the text.
document.addEventListener("mousedown", (event) => {
    if (
        event.target.isContentEditable ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "INPUT"
    ) {
        lastActiveElement = event.target;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "replaceText") {
        const newText = request.text;

        // Best effort: Try to replace text in an editable field.
        // This is the most common use case (e.g., writing an email).
        if (
            lastActiveElement &&
            (lastActiveElement.isContentEditable ||
                lastActiveElement.tagName === "TEXTAREA" ||
                lastActiveElement.tagName === "INPUT")
        ) {
            // Check if the element still has focus or is the same one.
            if (document.activeElement === lastActiveElement) {
                document.execCommand("insertText", false, newText);
            } else {
                // If focus was lost, we can try to restore it and insert.
                // This is less reliable.
                lastActiveElement.focus();
                // A small delay might be needed for focus to register
                setTimeout(() => {
                    document.execCommand("insertText", false, newText);
                }, 10);
            }
        }

        // As a reliable fallback, always copy the text to the clipboard.
        navigator.clipboard
            .writeText(newText)
            .then(() => {
                console.log("Ollama Rewriter: Text copied to clipboard.");
            })
            .catch((err) => {
                console.error(
                    "Ollama Rewriter: Failed to copy text to clipboard.",
                    err,
                );
            });

        // The background script already shows a notification, so we don't need another one here.
    }
});
