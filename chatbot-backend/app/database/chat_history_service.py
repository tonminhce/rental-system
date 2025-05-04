import os
from dotenv import load_dotenv
from datetime import datetime
from typing import List, Dict
from app.database.db_connection import get_db_connection

load_dotenv()

def init_chat_history_table():
    """
    Initialize chat_history table in MySQL if it doesn't exist
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                # Table is created by schema.sql
                print("Chat history table initialized successfully")
    except Exception as e:
        print(f"Error initializing chat history table: {str(e)}")

def save_chat_history(thread_id: str, question: str, answer: str) -> Dict:
    """
    Save chat history to database
    
    Args:
        thread_id (str): Thread ID of the conversation
        question (str): User's question
        answer (str): Chatbot's answer
        
    Returns:
        Dict: Information about the saved chat history
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO chat_history (thread_id, question, answer)
                    VALUES (%s, %s, %s)
                """, (thread_id, question, answer))
                
                return {'id': cursor.lastrowid}
    except Exception as e:
        print(f"Error saving chat history: {str(e)}")
        return {'error': str(e)}

def get_recent_chat_history(thread_id: str, limit: int = 10) -> List[Dict]:
    """
    Get recent chat history for a conversation
    
    Args:
        thread_id (str): Thread ID of the conversation
        limit (int): Maximum number of messages to retrieve, default is 10
        
    Returns:
        List[Dict]: List of recent messages
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor(dictionary=True) as cursor:
                cursor.execute("""
                    SELECT 
                        id,
                        thread_id,
                        question,
                        answer,
                        created_at
                    FROM chat_history
                    WHERE thread_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (thread_id, limit))
                
                return cursor.fetchall()
    except Exception as e:
        print(f"Error getting chat history: {str(e)}")
        return []

def format_chat_history(history: List[Dict]) -> List[Dict]:
    """
    Format chat history for the AI model
    
    Args:
        history (List[Dict]): Raw chat history from database
        
    Returns:
        List[Dict]: Formatted chat history
    """
    formatted_history = []
    for msg in reversed(history):  # Reverse to get chronological order
        formatted_history.extend([
            {"role": "human", "content": msg['question']},
            {"role": "assistant", "content": msg['answer']}
        ])
    return formatted_history

# Initialize table when module is imported
init_chat_history_table() 