from typing import List, Dict, Optional
from .chat_history_service import get_db_connection
from decimal import Decimal

def init_order_table():
    """
    Khởi tạo bảng order trong database để lưu trữ các giao dịch bất động sản
    Bảng này lưu trữ thông tin về các đơn đặt/mua bất động sản bao gồm:
    - ID người dùng đặt/mua
    - ID bất động sản
    - Loại giao dịch (thuê/mua)
    - Thời gian bắt đầu hợp đồng
    - Thời gian kết thúc hợp đồng (với trường hợp thuê)
    - Số tiền đặt cọc
    - Số tiền thanh toán hàng tháng (với trường hợp thuê)
    - Tổng giá trị hợp đồng
    - Phương thức thanh toán
    - Trạng thái đơn hàng
    - Ghi chú bổ sung
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS "order" (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    product_id VARCHAR(50) NOT NULL REFERENCES product(id),
                    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('rent', 'buy')),
                    contract_start_date DATE NOT NULL,
                    contract_end_date DATE,
                    deposit_amount DECIMAL(15,2) NOT NULL,
                    monthly_payment DECIMAL(15,2),
                    total_amount DECIMAL(15,2) NOT NULL,
                    payment_method VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending', 'deposit_paid', 'confirmed', 'active', 'completed', 'cancelled')),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT valid_contract_dates CHECK (
                        (transaction_type = 'rent' AND contract_end_date IS NOT NULL AND contract_end_date > contract_start_date) OR
                        (transaction_type = 'buy' AND contract_end_date IS NULL)
                    ),
                    CONSTRAINT valid_monthly_payment CHECK (
                        (transaction_type = 'rent' AND monthly_payment IS NOT NULL AND monthly_payment > 0) OR
                        (transaction_type = 'buy' AND monthly_payment IS NULL)
                    )
                )
            """)
        conn.commit()

def create_order(
    user_id: str,
    product_id: str,
    transaction_type: str,
    contract_start_date: str,
    contract_end_date: Optional[str],
    deposit_amount: Decimal,
    monthly_payment: Optional[Decimal],
    total_amount: Decimal,
    payment_method: str,
    notes: Optional[str] = None
) -> Optional[Dict]:
    """
    Tạo đơn đặt/mua bất động sản mới
    
    Args:
        user_id (str): ID của người dùng
        product_id (str): ID của bất động sản
        transaction_type (str): Loại giao dịch ('rent' hoặc 'buy')
        contract_start_date (str): Ngày bắt đầu hợp đồng (format: YYYY-MM-DD)
        contract_end_date (Optional[str]): Ngày kết thúc hợp đồng (chỉ với trường hợp thuê)
        deposit_amount (Decimal): Số tiền đặt cọc
        monthly_payment (Optional[Decimal]): Số tiền thanh toán hàng tháng (chỉ với trường hợp thuê)
        total_amount (Decimal): Tổng giá trị hợp đồng
        payment_method (str): Phương thức thanh toán
        notes (Optional[str]): Ghi chú bổ sung
        
    Returns:
        Optional[Dict]: Thông tin đơn hàng nếu tạo thành công, None nếu thất bại
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO "order" (
                    user_id, product_id, transaction_type,
                    contract_start_date, contract_end_date,
                    deposit_amount, monthly_payment, total_amount,
                    payment_method, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING 
                    id,
                    user_id,
                    product_id,
                    transaction_type,
                    contract_start_date,
                    contract_end_date,
                    deposit_amount::text,
                    monthly_payment::text,
                    total_amount::text,
                    payment_method,
                    status,
                    notes,
                    created_at,
                    updated_at
                """,
                (
                    user_id, product_id, transaction_type,
                    contract_start_date, contract_end_date,
                    deposit_amount, monthly_payment, total_amount,
                    payment_method, notes
                )
            )
            result = cur.fetchone()
            if result:
                # Convert decimal strings back to Decimal objects
                for field in ['deposit_amount', 'monthly_payment', 'total_amount']:
                    if result[field]:
                        result[field] = Decimal(result[field])
            conn.commit()
            return result

def update_order_status(order_id: int, status: str, notes: Optional[str] = None) -> bool:
    """
    Cập nhật trạng thái đơn hàng
    
    Args:
        order_id (int): ID của đơn hàng
        status (str): Trạng thái mới (pending, deposit_paid, confirmed, active, completed, cancelled)
        notes (Optional[str]): Ghi chú bổ sung khi cập nhật trạng thái
        
    Returns:
        bool: True nếu cập nhật thành công, False nếu thất bại
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "order"
                SET status = %s,
                    notes = CASE 
                        WHEN %s IS NOT NULL THEN 
                            CASE 
                                WHEN notes IS NULL THEN %s
                                ELSE notes || E'\n' || %s
                            END
                        ELSE notes
                    END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
                """,
                (status, notes, notes, notes, order_id)
            )
            result = cur.fetchone()
            conn.commit()
            return bool(result) 