# 🎤 Speech Recognition System

An AI-powered speech recognition application that converts audio files to text with multi-language support, confidence scoring, and detailed transcription segments.

## Features

**Real-time Transcription** - Convert audio to text instantly  
**Multi-Language Support** - Supports 13+ languages including Urdu, Hindi, Arabic  
**Confidence Scoring** - Get accuracy metrics for each transcription  
 **Detailed Segments** - View timestamps and confidence for each segment  
 **Auto-Language Detection** - Automatically detect audio language  
 **Copy & Download** - Copy transcript or download as text file  
 **Transcription History** - Keep track of all transcriptions  
 **Modern UI** - Beautiful, responsive, dark-theme interface  
 **REST API** - Full-featured API for integration  
 **Docker Support** - Easy deployment with Docker  

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Whisper AI** - OpenAI's speech recognition model
- **librosa** - Audio processing library
- **Uvicorn** - ASGI server

### Frontend
- **HTML5/CSS3/JavaScript** - Modern web technologies
- **Responsive Design** - Works on desktop and mobile
- **Vanilla JS** - No framework dependencies

### Deployment
- **Docker & Docker Compose** - Containerization
- **Nginx** - Web server & proxy

##  System Requirements

- Python 3.10+
- FFmpeg (for audio processing)
- 4GB+ RAM (recommended for large models)
- 3GB+ disk space (for model download)

##  Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/muhammad-usman1040/speech-recognition-system.git
cd speech-recognition-system

# Build and run with Docker Compose
docker-compose up --build

# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from: https://ffmpeg.org/download.html

#### Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Server will start at: `http://localhost:8000`

#### Setup Frontend

```bash
# Open frontend/index.html in a browser
# Or use a simple HTTP server:
python -m http.server 8080 --directory frontend
```

Frontend will be at: `http://localhost:8080`

##  API Documentation

After starting the backend, visit: http://localhost:8000/docs

### Key Endpoints

#### Transcribe Audio
```http
POST /transcribe
Content-Type: multipart/form-data

Parameters:
- file: Audio file (MP3, WAV, OGG, M4A, FLAC, AAC, WMA)
- language: Optional language code (e.g., 'en', 'ur', 'hi')

Response:
{
  "id": "uuid",
  "filename": "audio.mp3",
  "text": "Transcribed text here...",
  "language": "en",
  "confidence": 0.95,
  "duration": 45.32,
  "timestamp": "2024-01-15T10:30:00",
  "segments": [...]
}
```

#### Get All Transcripts
```http
GET /transcripts

Response:
{
  "count": 5,
  "transcripts": [...]
}
```

#### Get Specific Transcript
```http
GET /transcripts/{transcript_id}
```

#### Delete Transcript
```http
DELETE /transcripts/{transcript_id}
```

#### Get Supported Languages
```http
GET /languages

Response:
{
  "supported_languages": {
    "en": "English",
    "es": "Spanish",
    "ur": "Urdu",
    ...
  }
}
```

##  Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| en   | English  | ru   | Russian  |
| es   | Spanish  | ko   | Korean   |
| fr   | French   | ur   | Urdu     |
| de   | German   | hi   | Hindi    |
| it   | Italian  | ar   | Arabic   |
| pt   | Portuguese | ja | Japanese |
| zh   | Chinese  |      |          |

##  Configuration

### Model Selection

Edit `backend/main.py` line 19:

```python
model = whisper.load_model("base")  # Options below:
```

**Available Models:**
- `tiny` - Fastest, ~39M parameters, ~1GB
- `base` - Default, ~74M parameters, ~1.4GB (RECOMMENDED)
- `small` - ~244M parameters, ~2.7GB
- `medium` - ~769M parameters, ~2.7GB
- `large` - Most accurate, ~1.5B parameters, ~2.9GB

### CORS Configuration

Edit `backend/main.py` line 19-24 for production:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Change this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Setup (Optional)

For persistent storage, use the `database.py` file and configure PostgreSQL:

```bash
# Update .env file
DATABASE_URL=postgresql://user:password@localhost/transcriptions
```

##  Performance Tips

1. **Use smaller model for speed:** `tiny` or `base` for real-time transcription
2. **Use larger model for accuracy:** `large` for important documents
3. **GPU Support:** If you have CUDA-capable GPU:
   ```python
   model = whisper.load_model("base", device="cuda")
   ```
4. **Preprocessing:** Convert audio to 16kHz mono for better results
5. **Caching:** Implement caching for frequently transcribed files

## Security Considerations

1. **File Upload Limits:** Set `MAX_FILE_SIZE` in `.env`
2. **CORS:** Configure allowed origins for production
3. **Authentication:** Add API key authentication for production
4. **HTTPS:** Use SSL/TLS in production
5. **File Storage:** Encrypt uploaded files
6. **Input Validation:** Validate file types and sizes

##  Deployment

### Heroku
```bash
heroku create your-app-name
heroku stack:set container
git push heroku main
```

### AWS
```bash
# Use AWS ECS or Lambda for serverless deployment
# See AWS documentation for detailed setup
```

### Google Cloud
```bash
# Use Google Cloud Run for containerized deployment
gcloud run deploy speech-recognition --source .
```

##  Usage Examples

### cURL
```bash
# Transcribe audio file
curl -X POST http://localhost:8000/transcribe \
  -F "file=@audio.mp3" \
  -F "language=en"
```

### Python
```python
import requests

with open('audio.mp3', 'rb') as f:
    files = {'file': f}
    data = {'language': 'en'}
    response = requests.post(
        'http://localhost:8000/transcribe',
        files=files,
        data=data
    )
    result = response.json()
    print(result['text'])
```

### JavaScript
```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('language', 'en');

const response = await fetch('http://localhost:8000/transcribe', {
    method: 'POST',
    body: formData
});

const result = await response.json();
console.log(result.text);
```

##  Troubleshooting

### Issue: FFmpeg not found
**Solution:** Install FFmpeg (see requirements above)

### Issue: Model download timeout
**Solution:** Manually download model:
```python
import whisper
model = whisper.load_model("base")
```

### Issue: Out of memory
**Solution:** Use smaller model or enable CPU-only mode:
```python
import os
os.environ['CUDA_VISIBLE_DEVICES'] = ''
```

### Issue: CORS errors
**Solution:** Update CORS configuration in `main.py`

##  Learning Resources

- [Whisper Documentation](https://github.com/openai/whisper)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Docker Documentation](https://docs.docker.com)
- [librosa Documentation](https://librosa.org)

##  Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

##  License

MIT License - feel free to use this project for personal or commercial purposes.

##  Support

Having issues? Open an issue on GitHub or contact the maintainer.

##  Contact

- GitHub: [@muhammad-usman1040](https://github.com/muhammad-usman1040)
- Email: your-email@example.com

---

**Made with  by Muhammad Usman**

If you found this useful, please give it a ⭐ star!
