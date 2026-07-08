from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
import os

# NEW: PDF text extraction
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

from quiz_graph import start_quiz, submit_answer, get_next_question

app = FastAPI(title="QuizMaster API", version="1.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://quiz-app-jb8z.vercel.app",
        "http://localhost:5173",   # local development ke liye
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session storage (use Redis in production)
sessions = {}

# ==================== MODELS ====================
class StartQuizRequest(BaseModel):
    topic: str
    difficulty: str = "Medium"
    num_questions: int = 5
    # NEW: optional custom content (text extracted from uploaded PDF or pasted by user)
    # When provided, quiz is generated based on this content instead of just the topic
    content: Optional[str] = None

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

class QuizResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None

# ==================== ENDPOINTS ====================
@app.post("/api/quiz/start")
async def api_start_quiz(request: StartQuizRequest):
    try:
        # NEW: pass content if provided for content-based quiz generation
        result = start_quiz(
            request.topic,
            request.difficulty,
            request.num_questions,
            content=request.content
        )
        session_id = str(uuid.uuid4())
        sessions[session_id] = result 
        
        return QuizResponse(
            success=True,
            data={
                "session_id": session_id,
                "question": result['current_question'],
                "questions": result['questions'],
                "current_index": 1,
                "total_questions": result['total_questions'],
                "score": 0
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz/answer")
async def api_submit_answer(request: AnswerRequest):
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_state = sessions[request.session_id]
    
    try:
        response, updated_state = submit_answer(session_state, request.answer)
        sessions[request.session_id] = updated_state
        
        return QuizResponse(
            success=True,
            data=response
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz/next")
async def api_next_question(request: AnswerRequest):
    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_state = sessions[request.session_id]
    
    try:
        result = get_next_question(session_state)
        return QuizResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.md', '.csv', '.json'}
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico'}

# NEW: Helper to extract text from uploaded file (PDF or plain text)
async def extract_text_from_file(file: UploadFile) -> str:
    """Extract text content from an uploaded PDF or text file."""
    content_bytes = await file.read()
    filename = file.filename.lower() if file.filename else ""

    # Check for unsupported file types (images, etc.)
    ext = '.' + filename.rsplit('.', 1)[-1] if '.' in filename else ''
    if ext in IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot read \"{file.filename}\" (this model does not support image input). Please upload a PDF, TXT, MD, CSV, or JSON file instead."
        )
    if ext and ext not in ALLOWED_EXTENSIONS and not filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type \"{ext}\". Allowed: PDF, TXT, MD, CSV, JSON."
        )

    if filename.endswith('.pdf'):
        # PDF file - extract text using PyMuPDF
        if not PYMUPDF_AVAILABLE:
            raise HTTPException(
                status_code=500,
                detail="PDF support requires PyMuPDF. Install it with: pip install PyMuPDF"
            )
        doc = fitz.open(stream=content_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    else:
        # Assume plain text file
        try:
            return content_bytes.decode('utf-8')
        except UnicodeDecodeError:
            return content_bytes.decode('latin-1')

# NEW: Endpoint to upload a file (PDF or text) and get extracted text
# The frontend can then send this text as `content` in the /api/quiz/start request
@app.post("/api/quiz/upload")
async def api_upload_file(file: UploadFile = File(...)):
    try:
        text = await extract_text_from_file(file)
        # Truncate if too long (LLM context limit)
        max_chars = 8000
        if len(text) > max_chars:
            text = text[:max_chars] + "\n\n[Content truncated to first 8000 characters]"
        return QuizResponse(
            success=True,
            data={
                "filename": file.filename,
                "content": text,
                "char_count": len(text)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "QuizMaster API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/")
async def root():
    return {"message": "QuizMaster API", "docs": "/docs"}