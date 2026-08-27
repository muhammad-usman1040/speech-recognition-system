import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import whisper

app = FastAPI()

# Allow CORS for Frontend Communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Allowed audio file extensions (including .webm for browser recording)
ALLOWED_EXTENSIONS = {'.ogg', '.m4a', '.wma', '.mp3', '.wav', '.flac', '.aac', '.webm'}
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load Whisper model
model = whisper.load_model("base")


@app.get("/")
def read_root():
    return {"status": "Speech Recognition Backend Running"}


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Validate file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed: {ALLOWED_EXTENSIONS}"
            )

        # Save uploaded file temporarily
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)

        # Process transcription
        result = model.transcribe(file_path)

        # Delete temp audio file
        if os.path.exists(file_path):
            os.remove(file_path)

        return {"text": result["text"]}

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


#ya_kaam_for_deploying_hugging_face
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Static CSS/JS serving
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Direct index.html open karne ke liye
@app.get("/")
async def read_index():
    return FileResponse('frontend/index.html')
