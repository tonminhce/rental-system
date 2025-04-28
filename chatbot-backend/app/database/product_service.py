from typing import List, Dict, Optional
from app.database.chat_history_service import get_db_connection
from decimal import Decimal
from datetime import datetime
import os

def init_properties_table():
    """
    Khởi tạo collection rentals trong MongoDB nếu chưa tồn tại
    Collection này lưu trữ thông tin về các bất động sản bao gồm:
    - ID
    - Tên bất động sản
    - Mô tả
    - Giá (triệu đồng)
    - Loại bất động sản (room, apartment, house)
    - Loại giao dịch (rent, sale)
    - Trạng thái (active, inactive)
    - Số phòng ngủ
    - Số phòng tắm
    - Diện tích (m2)
    - Thông tin liên hệ
    - Địa chỉ chi tiết
    - Tọa độ
    - Nguồn và URL
    - Hình ảnh
    """
    try:
        client = get_db_connection()
        db = client[os.getenv('DB_NAME')]
        
        # Tạo collection nếu chưa tồn tại
        if 'rentals' not in db.list_collection_names():
            db.create_collection('rentals')
            
        # Tạo các index cần thiết
        db.rentals.create_index('district')
        db.rentals.create_index('status')
        db.rentals.create_index([('createdAt', -1)])
        
        print("Properties table initialized successfully")
    except Exception as e:
        print(f"Error initializing properties table: {str(e)}")
    finally:
        client.close()

def get_properties_by_district(district: str) -> List[Dict]:
    """
    Tìm kiếm bất động sản theo quận/huyện
    
    Args:
        district (str): Tên quận/huyện cần tìm
        
    Returns:
        List[Dict]: Danh sách bất động sản trong quận/huyện đó
    """
    try:
        client = get_db_connection()
        db = client[os.getenv('DB_NAME')]
        
        # Sử dụng regex để tìm kiếm không phân biệt hoa thường
        district_pattern = {'$regex': f'^{district}$', '$options': 'i'}
        
        results = list(db.rentals.find(
            {'district': district_pattern},
            {
                '_id': 0,
                'id': 1,
                'name': 1,
                'description': 1,
                'price': 1,
                'propertyType': 1,
                'transactionType': 1,
                'status': 1,
                'bedrooms': 1,
                'bathrooms': 1,
                'area': 1,
                'contactName': 1,
                'contactPhone': 1,
                'street': 1,
                'ward': 1,
                'district': 1,
                'province': 1,
                'displayedAddress': 1,
                'latitude': 1,
                'longitude': 1,
                'sourceUrl': 1,
                'postUrl': 1,
                'images': 1,
                'createdAt': 1,
                'updatedAt': 1
            }
        ).sort('createdAt', -1))
            
        return results
    finally:
        client.close()

def get_properties_by_status(status: str) -> List[Dict]:
    """
    Tìm kiếm bất động sản theo trạng thái
    
    Args:
        status (str): Trạng thái của bất động sản (active, inactive)
        
    Returns:
        List[Dict]: Danh sách bất động sản có trạng thái tương ứng
    """
    try:
        client = get_db_connection()
        db = client[os.getenv('DB_NAME')]
        
        # Sử dụng regex để tìm kiếm không phân biệt hoa thường
        status_pattern = {'$regex': f'^{status}$', '$options': 'i'}
        
        results = list(db.rentals.find(
            {'status': status_pattern},
            {
                '_id': 0,
                'id': 1,
                'name': 1,
                'description': 1,
                'price': 1,
                'propertyType': 1,
                'transactionType': 1,
                'status': 1,
                'bedrooms': 1,
                'bathrooms': 1,
                'area': 1,
                'contactName': 1,
                'contactPhone': 1,
                'street': 1,
                'ward': 1,
                'district': 1,
                'province': 1,
                'displayedAddress': 1,
                'latitude': 1,
                'longitude': 1,
                'sourceUrl': 1,
                'postUrl': 1,
                'images': 1,
                'createdAt': 1,
                'updatedAt': 1
            }
        ).sort('createdAt', -1))
            
        return results
    finally:
        client.close()

def get_properties_by_price_range(min_price: float, max_price: float) -> List[Dict]:
    """
    Tìm bất động sản trong khoảng giá
    
    Args:
        min_price (float): Giá tối thiểu (triệu đồng)
        max_price (float): Giá tối đa (triệu đồng)
        
    Returns:
        List[Dict]: Danh sách bất động sản trong khoảng giá
    """
    try:
        client = get_db_connection()
        db = client[os.getenv('DB_NAME')]
        
        results = list(db.rentals.find(
            {
                'price': {
                    '$gte': min_price,
                    '$lte': max_price
                }
            },
            {
                '_id': 0,
                'id': 1,
                'name': 1,
                'description': 1,
                'price': 1,
                'propertyType': 1,
                'transactionType': 1,
                'status': 1,
                'bedrooms': 1,
                'bathrooms': 1,
                'area': 1,
                'contactName': 1,
                'contactPhone': 1,
                'street': 1,
                'ward': 1,
                'district': 1,
                'province': 1,
                'displayedAddress': 1,
                'latitude': 1,
                'longitude': 1,
                'sourceUrl': 1,
                'postUrl': 1,
                'images': 1,
                'createdAt': 1,
                'updatedAt': 1
            }
        ).sort('createdAt', -1))
            
        return results
    finally:
        client.close()

def main():
    """
    Hàm test các chức năng tìm kiếm bất động sản
    """
    # Test tìm theo quận
    print("\n=== Tìm bất động sản ở quận Bình Thạnh ===")
    binh_thanh_properties = get_properties_by_district("Bình Thạnh")
    for prop in binh_thanh_properties:
        print(f"- {prop['name']}")
        print(f"  Giá: {prop['price']:,.1f} triệu")
        print(f"  Địa chỉ: {prop['displayedAddress']}")
        print()

    # Test tìm theo trạng thái
    print("\n=== Bất động sản đang cho thuê ===")
    available_properties = get_properties_by_status("active")
    for prop in available_properties:
        print(f"- {prop['name']}")
        print(f"  Giá: {prop['price']:,.1f} triệu")
        print(f"  Địa chỉ: {prop['displayedAddress']}")
        print(f"  Liên hệ: {prop['contactName']} - {prop['contactPhone']}")
        print()
        
    # Test tìm theo khoảng giá
    print("\n=== Bất động sản từ 5-10 triệu ===")
    price_range_properties = get_properties_by_price_range(5.0, 10.0)
    for prop in price_range_properties:
        print(f"- {prop['name']}")
        print(f"  Giá: {prop['price']:,.1f} triệu")
        print(f"  Địa chỉ: {prop['displayedAddress']}")
        print()

if __name__ == '__main__':
    main()