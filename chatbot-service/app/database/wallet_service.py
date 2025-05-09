from typing import Optional, Dict
from .chat_history_service import get_db_connection
from decimal import Decimal

def init_wallet_table():
    """
    Khởi tạo bảng user_wallet trong database nếu chưa tồn tại
    Bảng này lưu trữ thông tin về ví tiền của người dùng bao gồm:
    - ID người dùng
    - Số dư
    - Thời gian tạo và cập nhật
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_wallet (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL UNIQUE,
                    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()

def get_wallet(user_id: str) -> Optional[Dict]:
    """
    Lấy thông tin ví của người dùng
    
    Args:
        user_id (str): ID của người dùng
        
    Returns:
        Optional[Dict]: Thông tin ví nếu tìm thấy, None nếu không tìm thấy
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    id,
                    user_id,
                    balance::text,
                    created_at,
                    updated_at
                FROM user_wallet 
                WHERE user_id = %s
                """,
                (user_id,)
            )
            result = cur.fetchone()
            if result:
                result['balance'] = Decimal(result['balance'])
            return result

def create_wallet(user_id: str, initial_balance: Decimal = Decimal('0')) -> Optional[Dict]:
    """
    Tạo ví mới cho người dùng
    
    Args:
        user_id (str): ID của người dùng
        initial_balance (Decimal): Số dư ban đầu, mặc định là 0
        
    Returns:
        Optional[Dict]: Thông tin ví nếu tạo thành công, None nếu thất bại
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO user_wallet (user_id, balance)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO UPDATE 
                SET balance = EXCLUDED.balance
                RETURNING 
                    id,
                    user_id,
                    balance::text,
                    created_at,
                    updated_at
                """,
                (user_id, initial_balance)
            )
            result = cur.fetchone()
            if result:
                result['balance'] = Decimal(result['balance'])
            conn.commit()
            return result

def update_balance(user_id: str, amount: Decimal) -> Optional[Dict]:
    """
    Cập nhật số dư trong ví của người dùng
    
    Args:
        user_id (str): ID của người dùng
        amount (Decimal): Số tiền cần thay đổi (dương để thêm vào, âm để trừ đi)
        
    Returns:
        Optional[Dict]: Thông tin ví sau khi cập nhật, None nếu thất bại hoặc số dư không đủ
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE user_wallet
                SET balance = balance + %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s AND balance + %s >= 0
                RETURNING 
                    id,
                    user_id,
                    balance::text,
                    created_at,
                    updated_at
                """,
                (amount, user_id, amount)
            )
            result = cur.fetchone()
            if result:
                result['balance'] = Decimal(result['balance'])
            conn.commit()
            return result 