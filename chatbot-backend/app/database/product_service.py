from typing import List, Dict, Optional
from .chat_history_service import get_db_connection
from decimal import Decimal

def init_product_table():
    """Initialize product table if it doesn't exist"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS product (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    stock INTEGER NOT NULL DEFAULT 0,
                    specifications JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        conn.commit()

def get_product_by_name(name: str) -> Optional[Dict]:
    """Get product by name"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    id,
                    name,
                    description,
                    price::text,
                    stock,
                    specifications,
                    created_at,
                    updated_at
                FROM product 
                WHERE LOWER(name) LIKE LOWER(%s)
                """,
                (f"%{name}%",)
            )
            result = cur.fetchone()
            if result:
                result['price'] = Decimal(result['price'])
            return result

def check_product_stock(product_id: int, quantity: int) -> bool:
    """Check if product has enough stock"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT stock 
                FROM product 
                WHERE id = %s
                """,
                (product_id,)
            )
            result = cur.fetchone()
            if result and result['stock'] >= quantity:
                return True
            return False

def update_product_stock(product_id: int, quantity: int) -> bool:
    """Update product stock"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE product 
                SET stock = stock - %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND stock >= %s
                RETURNING id
                """,
                (quantity, product_id, quantity)
            )
            result = cur.fetchone()
            conn.commit()
            return bool(result) 

def main():
    quantity = check_product_stock(1, 1)
    print('check_product_stock(1, 1): ', quantity)

if __name__ == '__main__':
    main()