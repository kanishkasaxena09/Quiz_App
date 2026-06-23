from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid

from quiz_graph import start_quiz, submit_answer, get_next_question

app = FastAPI(title="QuizMaster API", version="1.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        result = start_quiz(request.topic, request.difficulty, request.num_questions)
        session_id = str(uuid.uuid4())
        sessions[session_id] = result  # Store full state
        
        return QuizResponse(
            success=True,
            data={
                "session_id": session_id,
                "question": result['current_question'],
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

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "QuizMaster API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/")
async def root():
    return {"message": "QuizMaster API", "docs": "/docs"}