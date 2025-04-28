import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
from typing import List, Dict
from bson import ObjectId

load_dotenv()

DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USERNAME')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')

def get_db_connection():
    """
    Tạo kết nối đến MongoDB
    
    Returns:
        MongoClient: Đối tượng kết nối đến MongoDB
    """
    MONGODB_URI = f"mongodb://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?authSource=admin"
    return MongoClient(MONGODB_URI)

def init_chat_history_table():
    """
    Khởi tạo bảng message trong database nếu chưa tồn tại
    Bảng này lưu trữ lịch sử chat bao gồm:
    - ID tin nhắn (ObjectId)
    - ID cuộc trò chuyện
    - Câu hỏi
    - Câu trả lời
    - Thời gian tạo
    """
    try:
        client = get_db_connection()
        db = client[DB_NAME]
        
        # Tạo collection nếu chưa tồn tại
        if 'message' not in db.list_collection_names():
            db.create_collection('message')
            
        # Tạo index cho thread_id
        db.message.create_index('thread_id')
        
        print("Chat history table initialized successfully")
    except Exception as e:
        print(f"Error initializing chat history table: {str(e)}")
    finally:
        client.close()

def save_chat_history(thread_id: str, question: str, answer: str) -> Dict:
    """
    Lưu lịch sử chat vào database
    
    Args:
        thread_id (str): ID của cuộc trò chuyện
        question (str): Câu hỏi của người dùng
        answer (str): Câu trả lời của chatbot
        
    Returns:
        Dict: Thông tin lịch sử chat vừa được lưu
    """
    try:
        client = get_db_connection()
        db = client[DB_NAME]
        
        message = {
            'thread_id': thread_id,
            'question': question,
            'answer': answer,
            'created_at': datetime.utcnow()
        }
        
        result = db.message.insert_one(message)
        return {'id': str(result.inserted_id)}
    finally:
        client.close()

def get_recent_chat_history(thread_id: str, limit: int = 10) -> List[Dict]:
    """
    Lấy lịch sử chat gần đây của một cuộc trò chuyện
    
    Args:
        thread_id (str): ID của cuộc trò chuyện
        limit (int): Số lượng tin nhắn tối đa cần lấy, mặc định là 10
        
    Returns:
        List[Dict]: Danh sách các tin nhắn gần đây
    """
    try:
        client = get_db_connection()
        db = client[DB_NAME]
        
        messages = list(db.message.find(
            {'thread_id': thread_id},
            {'_id': 1, 'thread_id': 1, 'question': 1, 'answer': 1, 'created_at': 1}
        ).sort('created_at', -1).limit(limit))
        
        # Convert ObjectId to string for JSON serialization
        for msg in messages:
            msg['id'] = str(msg.pop('_id'))
        
        return messages
    finally:
        client.close()

def format_chat_history(chat_history: List[Dict]) -> str:
    """
    Định dạng lịch sử chat thành chuỗi văn bản
    
    Args:
        chat_history (List[Dict]): Danh sách các tin nhắn
        
    Returns:
        str: Chuỗi văn bản đã được định dạng
    """
    formatted_history = []
    for msg in reversed(chat_history):  # Reverse to get chronological order
        formatted_history.extend([
            {"role": "human", "content": msg["question"]},
            {"role": "assistant", "content": msg["answer"]}
        ])
    return formatted_history

# Initialize table when module is imported
init_chat_history_table() 