from fastapi import APIRouter
from .chat.routes import router as chat_router

router = APIRouter(prefix="/v1")
router.include_router(chat_router, prefix="/chat", tags=["chat"]) 