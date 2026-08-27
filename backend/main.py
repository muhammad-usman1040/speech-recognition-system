from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
import os
from datetime import datetime
import uuid
from pydantic import BaseModel
from typing import Optional
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Speech Recognition API", version="1.0.0")

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model (downloads ~3GB on first run)
logger.info("Loading Whisper model...")
model = whisper.load_model("base")  # Options: tiny, base, small, medium, large
logger.info("Whisper model loaded successfully!")

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory storage (replace with database for production)
transcriptions = {}

# Request/Response Models
class TranscriptResponse(BaseModel):
    id: str
    filename: str
    language: str
    text: str
    confidence: float
    duration: float
    timestamp: str
    segments: Optional[list]

# Routes

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "Speech Recognition API is active",
        "version": "1.0.0"
    }

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = None
):
    """
    Transcribe audio file to text
    
    Parameters:
    - file: Audio file (MP3, WAV, OGG, M4A, FLAC, etc.)
    - language: Optional language code (e.g., 'en', 'ur', 'es')
    
    Returns:
    - Transcript with confidence scores and metadata
    """
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file extension
        allowed_extensions = {'.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed: {allowed_extensions}"
            )
        
        # Save uploaded file
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
        
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"Processing file: {file.filename}")
        
        # Transcribe using Whisper
        options = {}
        if language:
            options['language'] = language
        
        result = model.transcribe(file_path, **options)
        
        # Extract text and segments
        transcript_text = result['text']
        detected_language = result['language']
        segments = result.get('segments', [])
        
        # Calculate confidence (average confidence from segments)
        confidences = [seg.get('confidence', 0.9) for seg in segments if 'confidence' in seg]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.9
        
        # Get audio duration
        import librosa
        y, sr = librosa.load(file_path)
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Store transcript
        transcript_data = {
            'id': file_id,
            'filename': file.filename,
            'text': transcript_text,
            'language': detected_language,
            'confidence': round(avg_confidence, 3),
            'duration': round(duration, 2),
            'timestamp': datetime.now().isoformat(),
            'segments': [
                {
                    'text': seg['text'],
                    'start': seg['start'],
                    'end': seg['end'],
                    'confidence': seg.get('confidence', 0.9)
                }
                for seg in segments
            ]
        }
        
        transcriptions[file_id] = transcript_data
        
        # Clean up uploaded file (optional)
        os.remove(file_path)
        
        logger.info(f"Transcription completed for: {file.filename}")
        
        return transcript_data
    
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.get("/transcripts")
async def get_all_transcripts():
    """Get all transcribed files"""
    return {
        "count": len(transcriptions),
        "transcripts": list(transcriptions.values())
    }

@app.get("/transcripts/{transcript_id}")
async def get_transcript(transcript_id: str):
    """Get specific transcript by ID"""
    if transcript_id not in transcriptions:
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    return transcriptions[transcript_id]

@app.delete("/transcripts/{transcript_id}")
async def delete_transcript(transcript_id: str):
    """Delete a transcript"""
    if transcript_id not in transcriptions:
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    del transcriptions[transcript_id]
    return {"message": "Transcript deleted successfully"}

@app.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ur': 'Urdu',
        'hi': 'Hindi',
        'ar': 'Arabic',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ru': 'Russian',
        'ko': 'Korean',
    }
    return {"supported_languages": languages}

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
