from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from typing import Optional, List

class ChatHistory(BaseModel):
    id: int
    thread_id: str
    question: str
    answer: str
    created_at: datetime = datetime.now()

class PropertyImage(BaseModel):
    """
    Model cho hình ảnh bất động sản
    """
    id: int
    rentalId: int
    url: str
    createdAt: datetime
    updatedAt: datetime
    rental_id: int

class Property(BaseModel):
    """
    Model cho bất động sản, bao gồm:
    - Thông tin cơ bản (id, tên, mô tả, giá)
    - Đặc điểm (loại BĐS, loại giao dịch, trạng thái, số phòng, diện tích)
    - Thông tin liên hệ
    - Địa chỉ và tọa độ
    - Nguồn và URL
    - Hình ảnh
    """
    # Thông tin cơ bản
    id: int
    name: str
    description: str
    price: float  # Đơn vị: triệu đồng
    
    # Đặc điểm
    propertyType: str  # room, apartment, house
    transactionType: str  # rent, sale
    status: str  # active, inactive
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: float  # m2
    
    # Thông tin liên hệ
    contactName: str
    contactPhone: str
    
    # Địa chỉ
    street: str
    ward: str
    district: str
    province: str = "TPHCM"  # Default value
    displayedAddress: str
    
    # Tọa độ
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    
    # Nguồn và URL
    sourceUrl: str
    postUrl: str
    
    # Hình ảnh
    images: List[PropertyImage] = []
    
    # Metadata
    createdAt: datetime = datetime.now()
    updatedAt: datetime = datetime.now()

    class Config:
        json_schema_extra = {
            "example": {
                "id": 68,
                "name": "Nhà nguyên căn mới, 3pn, 1PK, 2 wc",
                "description": "CHO THUÊ NHÀ NGUYÊN CĂN - Diện tích: 50m2 - Full nội thất",
                "price": 4.0,  # 4 triệu đồng
                "propertyType": "room",
                "transactionType": "rent",
                "status": "active",
                "bedrooms": 3,
                "bathrooms": 2,
                "area": 50.0,
                "contactName": "Kim Cúc",
                "contactPhone": "0909634270",
                "street": "2009 Lê Văn Lương",
                "ward": "Nhơn Đức",
                "district": "Nhà Bè",
                "province": "TPHCM",
                "displayedAddress": "2009 Lê Văn Lương, Xã Nhơn Đức, Huyện Nhà Bè, TPHCM",
                "latitude": "106.70388031",
                "longitude": "10.67145729",
                "sourceUrl": "mogi.vn",
                "postUrl": "https://mogi.vn/huyen-nha-be/thue-nha-hem-ngo/nha-nguyen-can-moi-3pn-1pk-2-wc-chi-3tr5-id22471979"
            }
        }

# class Product(BaseModel):
#     id: int
#     name: str
#     description: str
#     price: Decimal
#     stock: int
#     specifications: dict
#     created_at: datetime = datetime.now()
#     updated_at: datetime = datetime.now()

# class Order(BaseModel):
#     id: int
#     user_id: str
#     product_id: int
#     quantity: int
#     total_amount: Decimal
#     status: str  # pending, confirmed, paid, cancelled
#     created_at: datetime = datetime.now()
#     updated_at: datetime = datetime.now()

# class UserWallet(BaseModel):
#     id: int
#     user_id: str
#     balance: Decimal
#     created_at: datetime = datetime.now()
#     updated_at: datetime = datetime.now() 