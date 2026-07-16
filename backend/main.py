from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

conversations = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "llama3.2:1b"

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    if session_id not in conversations:
        conversations[session_id] = []

    conversations[session_id].append({"role": "user", "content": request.message})

    response = requests.post(OLLAMA_URL, json={
        "model": MODEL_NAME,
        "messages": conversations[session_id],
        "stream": False
    })

    data = response.json()
    ai_reply = data["message"]["content"]

    conversations[session_id].append({"role": "assistant", "content": ai_reply})

    return ChatResponse(reply=ai_reply, session_id=session_id)

@app.get("/")
def health_check():
    return {"status": "backend is running"}
