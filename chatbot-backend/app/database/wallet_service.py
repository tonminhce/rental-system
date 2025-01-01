from typing import Optional, Dict
from .chat_history_service import get_db_connection
from decimal import Decimal

def init_wallet_table():
    """Initialize wallet table if it doesn't exist"""
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
    """Get user wallet information"""
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
    """Create a new wallet for user"""
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
    """Update wallet balance. Use negative amount to deduct."""
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