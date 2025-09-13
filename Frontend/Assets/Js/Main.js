document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const summarizeBtn = document.getElementById('summarize-btn');
    const textInput = document.getElementById('text-input');
    const fileInput = document.getElementById('file-input');
    const formatSelect = document.getElementById('format-select');
    const languageSelect = document.getElementById('language-select');
    const lengthSlider = document.getElementById('length-slider');
    const summaryOutput = document.getElementById('summary-output');
    const keywordsOutput = document.getElementById('keywords-output');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');

    // --- Event Listeners ---
    if (summarizeBtn) {
        summarizeBtn.addEventListener('click', handleSummarize);
    }
    if (copyBtn) {
        copyBtn.addEventListener('click', handleCopy);
    }
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownload);
    }

    // --- Main Summarize Function ---
    async function handleSummarize() {
        const text = textInput.value;
        const file = fileInput.files[0];
        const format = formatSelect.value;
        const language = languageSelect.value;
        const length = lengthSlider.value;

        if (!text && !file) {
            alert('Please provide text or upload a file to summarize.');
            return;
        }

        // Show a loading state in the UI
        summaryOutput.innerText = 'Summarizing... This may take a moment. 🧠';
        keywordsOutput.innerHTML = '';
        summarizeBtn.disabled = true;
        summarizeBtn.innerText = 'Working...';

        try {
            // Call the API function from api.js
            const response = await window.AppAPI.getSummary({ text, file, format, language, length });
            
            // Display the results
            if (response.success) {
                summaryOutput.innerText = response.summary;
                if (response.keywords) {
                    keywordsOutput.innerHTML = response.keywords.map(kw => `<span>${kw}</span>`).join('');
                }
            } else {
                summaryOutput.innerText = `An error occurred: ${response.message}`;
            }
        } catch (error) {
            console.error('Summarization Error:', error);
            summaryOutput.innerText = 'A critical error occurred while contacting the server.';
        } finally {
            // Reset the UI
            summarizeBtn.disabled = false;
            summarizeBtn.innerText = 'Generate Summary';
        }
    }

    // --- Helper Functions ---
    function handleCopy() {
        const textToCopy = summaryOutput.innerText;
        if (textToCopy && textToCopy !== 'Your summary will appear here...') {
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('Summary copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Could not copy text.');
            });
        }
    }

    function handleDownload() {
        const textToDownload = summaryOutput.innerText;
        if (textToDownload && textToDownload !== 'Your summary will appear here...') {
            const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
});
