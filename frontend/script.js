let mediaRecorder;
let audioChunks = [];

const audioFileInput = document.getElementById('audioFile');
const uploadBtn = document.getElementById('uploadBtn');
const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');

// Backend API Request Function
async function sendAudioToBackend(fileOrBlob, filename) {
  const formData = new FormData();
  formData.append('file', fileOrBlob, filename);

  loadingDiv?.classList.remove('hidden');
  resultDiv.innerText = '';

  try {
    const response = await fetch('https://0aa7f5efa8364b.lhr.life/transcribe', {
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
    loadingDiv?.classList.add('hidden');
  }
}

// 1. File Upload Event Handler
uploadBtn.addEventListener('click', () => {
  if (!audioFileInput.files[0]) {
    alert('Pehle audio file choose karein!');
    return;
  }
  sendAudioToBackend(audioFileInput.files[0], audioFileInput.files[0].name);
});

// 2. Start Live Recording
recordBtn.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Browser ka native supported audio type detect karein (webm ya ogg)
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
      await sendAudioToBackend(audioBlob, `live_audio.${ext}`);
    };

    mediaRecorder.start();
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    resultDiv.innerText = "🎙️ Recording chal rahi hai... Bolna shuru karein!";
  } catch (err) {
    alert("Microphone permission error: " + err.message);
  }
});

// 3. Stop Live Recording
stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  }
});
