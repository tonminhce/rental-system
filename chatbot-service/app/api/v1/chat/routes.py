from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.core.ai.ai_service import get_answer, get_answer_stream
import logging
import json
from typing import AsyncGenerator, Optional, Dict, Any

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    question: str
    thread_id: str
    query_params: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    answer: str

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received question: {request.question} for thread: {request.thread_id}")
        
        # Print query parameters for debugging
        print(f"\n==== CHAT FILTER PARAMETERS ====")
        print(f"Received query parameters: {json.dumps(request.query_params, indent=2)}")
        print(f"============================\n")
        
        logger.info(f"Query parameters: {request.query_params}")
        result = get_answer(request.question, request.thread_id, request.query_params)
        logger.info(f"Got result: {result}")
        
        if not isinstance(result, dict) or "output" not in result:
            raise ValueError("Invalid response format from get_answer")
            
        return ChatResponse(answer=result["output"])
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Internal server error: {str(e)}"
        )

async def event_generator(question: str, thread_id: str, query_params: Optional[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
    try:
        # Send initial event to establish connection
        yield f"data: {json.dumps({'status': 'connected'})}\n\n"
        
        # Stream the response with query parameters
        async for chunk in get_answer_stream(question, thread_id, query_params):
            if chunk:  # Only yield if there's content
                # Ensure proper field names for contact information
                yield f"data: {json.dumps({'content': chunk})}\n\n"
                
        # Send end event
        yield f"data: {json.dumps({'status': 'completed'})}\n\n"
    except Exception as e:
        logger.error(f"Error in stream: {str(e)}", exc_info=True)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield f"data: {json.dumps({'status': 'error'})}\n\n"

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, req: Request = None):
    # Log the request details for debugging
    client_host = req.client.host if req and req.client else "Unknown"
    logger.info(f"Stream request from {client_host} - Question: {request.question[:30]}... for thread: {request.thread_id}")
    
    # Print query parameters in a more visible format for debugging
    print(f"\n==== STREAM CHAT FILTER PARAMETERS ====")
    print(f"Received query parameters: {json.dumps(request.query_params, indent=2)}")
    print(f"======================================\n")
    
    logger.info(f"Query parameters: {request.query_params}")
    
    # Set proper SSE headers
    response_headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",  # Disable proxy buffering
        "Access-Control-Allow-Origin": "*",  # Ensure CORS headers even in response
    }
    
    return StreamingResponse(
        event_generator(request.question, request.thread_id, request.query_params),
        media_type="text/event-stream",
        headers=response_headers
    ) 