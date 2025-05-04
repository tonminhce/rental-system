from typing import List, Dict, Optional
from app.database.db_connection import get_db_connection
from decimal import Decimal
from datetime import datetime
import os

def init_properties_table():
    """
    Initialize properties and property_images tables in MySQL if they don't exist
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                # Tables are created by schema.sql
                print("Properties tables initialized successfully")
    except Exception as e:
        print(f"Error initializing properties table: {str(e)}")

def get_properties_by_district(district: str) -> List[Dict]:
    """
    Search for properties in a specific district
    
    Args:
        district (str): District name to search for
        
    Returns:
        List[Dict]: List of properties in that district
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor(dictionary=True) as cursor:
                # Normalize district name
                district = district.strip()
                
                # Handle district name variations
                district_variations = [
                    district,  # Original name
                    district.lower(),  # Lowercase
                    district.upper(),  # Uppercase
                    f"Quận {district}",  # With Quận prefix
                    f"quận {district.lower()}",  # With quận prefix
                    f"Quan {district}",  # Without diacritics
                    f"quan {district.lower()}"  # Without diacritics
                ]
                
                # Query with district variations
                cursor.execute("""
                    SELECT 
                        p.*,
                        GROUP_CONCAT(pi.url) as image_urls
                    FROM properties p
                    LEFT JOIN property_images pi ON p.id = pi.property_id
                    WHERE p.district IN (%s)
                    GROUP BY p.id
                    ORDER BY p.created_at DESC
                """, (','.join(['%s'] * len(district_variations)),))
                
                cursor.execute(cursor.statement, district_variations)
                results = cursor.fetchall()
                
                # Process image URLs
                for result in results:
                    if result['image_urls']:
                        result['images'] = [{'url': url} for url in result['image_urls'].split(',')]
                    else:
                        result['images'] = []
                    del result['image_urls']
                
                return results
    except Exception as e:
        print(f"Error in get_properties_by_district: {str(e)}")
        return []

def get_properties_by_status(status: str) -> List[Dict]:
    """
    Search for properties by status
    
    Args:
        status (str): Property status (active, inactive)
        
    Returns:
        List[Dict]: List of properties with matching status
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor(dictionary=True) as cursor:
                cursor.execute("""
                    SELECT 
                        p.*,
                        GROUP_CONCAT(pi.url) as image_urls
                    FROM properties p
                    LEFT JOIN property_images pi ON p.id = pi.property_id
                    WHERE p.status = %s
                    GROUP BY p.id
                    ORDER BY p.created_at DESC
                """, (status,))
                
                results = cursor.fetchall()
                
                # Process image URLs
                for result in results:
                    if result['image_urls']:
                        result['images'] = [{'url': url} for url in result['image_urls'].split(',')]
                    else:
                        result['images'] = []
                    del result['image_urls']
                
                return results
    except Exception as e:
        print(f"Error in get_properties_by_status: {str(e)}")
        return []

def get_properties_by_price_range(min_price: float, max_price: float) -> List[Dict]:
    """
    Find properties within a price range
    
    Args:
        min_price (float): Minimum price in millions VND
        max_price (float): Maximum price in millions VND
        
    Returns:
        List[Dict]: List of properties within the price range
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor(dictionary=True) as cursor:
                cursor.execute("""
                    SELECT 
                        p.*,
                        GROUP_CONCAT(pi.url) as image_urls
                    FROM properties p
                    LEFT JOIN property_images pi ON p.id = pi.property_id
                    WHERE p.price BETWEEN %s AND %s
                    GROUP BY p.id
                    ORDER BY p.price ASC
                """, (min_price, max_price))
                
                results = cursor.fetchall()
                
                # Process image URLs
                for result in results:
                    if result['image_urls']:
                        result['images'] = [{'url': url} for url in result['image_urls'].split(',')]
                    else:
                        result['images'] = []
                    del result['image_urls']
                
                return results
    except Exception as e:
        print(f"Error in get_properties_by_price_range: {str(e)}")
        return []

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