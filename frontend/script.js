const API_BASE_URL = 'http://localhost:8000';
let selectedFile = null;
let transcriptionHistory = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const transcribeBtn = document.getElementById('transcribeBtn');
const resultsSection = document.getElementById('resultsSection');
const languageSelect = document.getElementById('language');

// Drag and Drop
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/aac', 'audio/x-ms-wma'];
    if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
        alert('Please select a valid audio file (MP3, WAV, OGG, M4A, FLAC, AAC, WMA)');
        return;
    }

    selectedFile = file;
    document.getElementById('fileName').textContent = `📁 ${file.name}`;
    document.getElementById('fileSize').textContent = `📊 ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    fileInfo.style.display = 'block';
    transcribeBtn.disabled = false;
}

transcribeBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert('Please select a file first');
        return;
    }

    const spinner = document.getElementById('spinner');
    const btnText = transcribeBtn.querySelector('span:first-child');
    const originalText = btnText.textContent;

    try {
        transcribeBtn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Processing...';

        const formData = new FormData();
        formData.append('file', selectedFile);
        if (languageSelect.value) {
            formData.append('language', languageSelect.value);
        }

        const response = await fetch(`${API_BASE_URL}/transcribe`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Transcription failed');
        }

        const result = await response.json();
        displayResults(result);
        transcriptionHistory.unshift(result);
        updateHistory();
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        transcribeBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = originalText;
    }
});

function displayResults(result) {
    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    // Populate metadata
    document.getElementById('resultFilename').textContent = result.filename;
    document.getElementById('resultLanguage').textContent = result.language.toUpperCase();
    document.getElementById('resultConfidence').textContent = `${(result.confidence * 100).toFixed(1)}%`;
    document.getElementById('resultDuration').textContent = `${result.duration} seconds`;

    // Display transcript
    document.getElementById('transcriptText').textContent = result.text;

    // Display segments if available
    if (result.segments && result.segments.length > 0) {
        const segmentsBox = document.getElementById('segmentsBox');
        const segmentsList = document.getElementById('segmentsList');
        segmentsList.innerHTML = '';

        result.segments.forEach((seg, idx) => {
            const segmentDiv = document.createElement('div');
            segmentDiv.className = 'segment-item';
            segmentDiv.innerHTML = `
                <div class="time">${formatTime(seg.start)} - ${formatTime(seg.end)}</div>
                <div class="text">${seg.text}</div>
                <div class="confidence">Confidence: ${(seg.confidence * 100).toFixed(1)}%</div>
            `;
            segmentsList.appendChild(segmentDiv);
        });
        segmentsBox.style.display = 'block';
    }
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (transcriptionHistory.length === 0) {
        historyList.innerHTML = '<p style="color: #999;">No transcriptions yet</p>';
        return;
    }

    transcriptionHistory.forEach((item, idx) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="filename">${item.filename}</div>
            <div class="meta">
                <span>🗣️ ${item.language.toUpperCase()}</span>
                <span> | ⏱️ ${item.duration}s</span>
                <span> | 📅 ${new Date(item.timestamp).toLocaleString()}</span>
            </div>
        `;
        historyItem.addEventListener('click', () => displayResults(item));
        historyList.appendChild(historyItem);
    });
}

function copyToClipboard() {
    const text = document.getElementById('transcriptText').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Transcript copied to clipboard!');
    });
}

function downloadTranscript() {
    const filename = document.getElementById('resultFilename').textContent;
    const text = document.getElementById('transcriptText').textContent;
    const timestamp = new Date().toISOString().split('T')[0];
    const content = `Transcript: ${filename}\nDate: ${timestamp}\n\n${text}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${timestamp}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Initialize
uploadArea.style.cursor = 'pointer';
