let mediaRecorder;
let audioChunks = [];

const audioFileInput = document.getElementById('audioFile');
const uploadBtn = document.getElementById('uploadBtn');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');

// Common function for API requests
async function sendAudioToBackend(fileOrBlob, filename = 'audio.wav') {
  const formData = new FormData();
  formData.append('file', fileOrBlob, filename);

  loadingDiv.classList.remove('hidden');
  resultDiv.innerText = '';

  try {
    const response = await fetch('http://127.0.0.1:8000/transcribe', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (response.ok) {
      resultDiv.innerText = data.text || data.transcription || JSON.stringify(data);
    } else {
      resultDiv.innerText = "Error: " + (data.detail || "Audio process nahi ho saki.");
    }
  } catch (error) {
    resultDiv.innerText = "Server Error: Backend running nahi hai ya connection fail hua.";
  } finally {
    loadingDiv.classList.add('hidden');
  }
}

// 1. File Upload Handler
uploadBtn.addEventListener('click', () => {
  if (!audioFileInput.files[0]) {
    alert('Pehle audio file choose karein!');
    return;
  }
  sendAudioToBackend(audioFileInput.files[0], audioFileInput.files[0].name);
});

// 2. Start Mic Recording
recordBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      await sendAudioToBackend(audioBlob, 'live_audio.wav');
    };

    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    resultDiv.innerText = "🎙️ Recording chal rahi hai... Abhi bolna shuru karein!";
  } catch (err) {
    alert("Microphone permission issue: " + err.message);
  }
});

// 3. Stop Mic Recording
stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  }
});
