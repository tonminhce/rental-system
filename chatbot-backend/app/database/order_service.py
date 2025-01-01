from typing import List, Dict, Optional
from .chat_history_service import get_db_connection
from decimal import Decimal

def init_order_table():
    """Initialize order table if it doesn't exist"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS "order" (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    product_id INTEGER NOT NULL REFERENCES product(id),
                    quantity INTEGER NOT NULL,
                    total_amount DECIMAL(10,2) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()

def create_order(user_id: str, product_id: int, quantity: int, total_amount: Decimal) -> Optional[Dict]:
    """Create a new order"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO "order" (user_id, product_id, quantity, total_amount)
                VALUES (%s, %s, %s, %s)
                RETURNING 
                    id,
                    user_id,
                    product_id,
                    quantity,
                    total_amount::text,
                    status,
                    created_at,
                    updated_at
                """,
                (user_id, product_id, quantity, total_amount)
            )
            result = cur.fetchone()
            if result:
                result['total_amount'] = Decimal(result['total_amount'])
            conn.commit()
            return result

def update_order_status(order_id: int, status: str) -> bool:
    """Update order status"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "order"
                SET status = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
                """,
                (status, order_id)
            )
            result = cur.fetchone()
            conn.commit()
            return bool(result) 