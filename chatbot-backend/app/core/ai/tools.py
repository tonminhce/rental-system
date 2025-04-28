from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Optional, Dict, Annotated, List, ClassVar, Any, Tuple
from app.database.product_service import get_properties_by_district, get_properties_by_status, get_properties_by_price_range
from app.database.models import Property
# from app.database.order_service import create_order, update_order_status
# from app.database.wallet_service import get_wallet, update_balance
from decimal import Decimal
import math
from datetime import datetime

# class ProductSearchInput(BaseModel):
#     product_name: str = Field(..., description="The name of the product to search for")

# class ProductSearchTool(BaseTool):
#     name: Annotated[str, Field(description="Tool name")] = "product_search"
#     description: Annotated[str, Field(description="Tool description")] = "Search for product information by name"
#     args_schema: type[BaseModel] = ProductSearchInput

#     def _run(self, product_name: str) -> Optional[Dict]:
#         return get_product_by_name(product_name)

class ShowPropertiesInput(BaseModel):
    pass  # Remove limit parameter

class ShowPropertiesTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "show_properties"
    description: Annotated[str, Field(description="Tool description")] = """
    Show an overview of available properties with different options.
    Returns a summary of properties including:
    - Total number of available properties
    - Properties by district
    - Properties by type (room, apartment, house)
    - Price ranges available
    - Available transaction types (rent/sale)
    - All available properties with full details
    
    Each property includes:
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), property_type, transaction_type, status
    - Location: street, ward, district, province, displayedAddress
    - Contact: contactName, contactPhone
    - Source: sourceUrl, postUrl
    - Images: List of image URLs
    - Metadata: createdAt, updatedAt
    
    Use this tool when users ask to see property options or want an overview of available properties.
    """
    args_schema: type[BaseModel] = ShowPropertiesInput

    def _run(self) -> Dict:
        try:
            # Get all available properties
            available_properties = get_properties_by_status("active")
            
            if not available_properties:
                return {
                    "error": "No properties found",
                    "total_available": 0,
                    "districts_available": [],
                    "property_types": [],
                    "transaction_types": [],
                    "price_range": {"min": 0, "max": 0},
                    "properties": []
                }
            
            # Get unique districts
            districts = list(set(prop.get("district", "") for prop in available_properties))
            
            # Get unique property types
            property_types = list(set(prop.get("propertyType", "") for prop in available_properties))
            
            # Get unique transaction types
            transaction_types = list(set(prop.get("transactionType", "") for prop in available_properties))
            
            # Calculate price ranges (prices are in millions)
            prices = [prop.get("price", 0) for prop in available_properties]
            min_price = min(prices) if prices else 0
            max_price = max(prices) if prices else 0
            
            return {
                "total_available": len(available_properties),
                "districts_available": sorted(districts),
                "property_types": sorted(property_types),
                "transaction_types": sorted(transaction_types),
                "price_range": {
                    "min": min_price,
                    "max": max_price
                },
                "properties": available_properties  # Return all properties
            }
        except Exception as e:
            print(f"Error in ShowPropertiesTool: {str(e)}")
            return {
                "error": f"Failed to fetch properties: {str(e)}",
                "total_available": 0,
                "districts_available": [],
                "property_types": [],
                "transaction_types": [],
                "price_range": {"min": 0, "max": 0},
                "properties": []
            }

class CheckPropertiesDistrictInput(BaseModel):
    district: str = Field(
        ..., 
        description="District name to search for properties. Examples: Quận 1, Bình Thạnh, Thủ Đức"
    )

class CheckPropertiesStatusInput(BaseModel):
    status: str = Field(
        ..., 
        description="Property status to search for. Must be one of: active, inactive"
    )

class CheckPropertiesPriceRangeInput(BaseModel):
    min_price: float = Field(..., description="Minimum price in millions VND")
    max_price: float = Field(..., description="Maximum price in millions VND")

class CheckPropertiesDistrictTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "check_properties_district"
    description: Annotated[str, Field(description="Tool description")] = """
    Search for properties in a specific district.
    Returns a list of properties with their details including:
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), property_type, transaction_type, status
    - Location: street, ward, district, province, displayedAddress
    - Contact: contactName, contactPhone
    - Source: sourceUrl, postUrl
    - Images: List of image URLs
    - Metadata: createdAt, updatedAt
    
    Use this tool when:
    - Users ask about properties in a specific district
    - Need to filter properties by location
    - Want to compare properties in the same area
    
    Example districts: Quận 1, Bình Thạnh, Thủ Đức
    """
    args_schema: type[BaseModel] = CheckPropertiesDistrictInput

    def _run(self, district: str) -> List[Dict]:
        properties = get_properties_by_district(district)
        return properties

class CheckPropertiesStatusTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "check_properties_status"
    description: Annotated[str, Field(description="Tool description")] = """
    Search for properties with a specific status.
    Returns a list of properties with their details including:
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), property_type, transaction_type, status
    - Location: street, ward, district, province, displayedAddress
    - Contact: contactName, contactPhone
    - Source: sourceUrl, postUrl
    - Images: List of image URLs
    - Metadata: createdAt, updatedAt
    
    Use this tool when:
    - Users ask about active/inactive properties
    - Need to check current property status
    - Want to see only active listings
    
    Valid status values:
    - active: Properties currently available
    - inactive: Properties no longer available
    """
    args_schema: type[BaseModel] = CheckPropertiesStatusInput

    def _run(self, status: str) -> List[Dict]:
        properties = get_properties_by_status(status)
        return properties

class CheckPropertiesPriceRangeTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "check_properties_price_range"
    description: Annotated[str, Field(description="Tool description")] = """
    Search for properties within a specified price range.
    Returns properties with full details including:
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), property_type, transaction_type, status
    - Location: street, ward, district, province, displayedAddress
    - Contact: contactName, contactPhone
    - Source: sourceUrl, postUrl
    - Images: List of image URLs
    - Metadata: createdAt, updatedAt
    
    Use this tool when:
    - Customer asks about properties within a specific budget
    - Need to filter properties by price range
    - Sort properties by price from low to high or vice versa
    
    Note:
    - Prices are in millions VND (e.g., 3.5 = 3,500,000 VND)
    - Returns properties sorted by price
    """
    args_schema: type[BaseModel] = CheckPropertiesPriceRangeInput

    def _run(self, min_price: float, max_price: float) -> Dict:
        """
        Search for properties within price range
        
        Args:
            min_price (float): Minimum price in millions VND
            max_price (float): Maximum price in millions VND
            
        Returns:
            Dict: Properties found within the price range with their details
        """
        # Get properties within price range
        properties = get_properties_by_price_range(min_price, max_price)
        
        # Sort properties by price
        properties.sort(key=lambda x: x['price'])
        
        return {
            "price_range": {
                "min": min_price,
                "max": max_price
            },
            "total_properties": len(properties),
            "properties": properties
        }

class DucbaCheckingLocationInput(BaseModel):
    radius: Optional[float] = Field(default=2.0, description="Radius in kilometers to search for properties (default: 2km)")

class LocationBaseMixin:
    """
    Mixin class for shared location-based functionality
    """
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Tính khoảng cách giữa hai điểm trên bản đồ sử dụng công thức Haversine
        
        Args:
            lat1, lon1: Tọa độ điểm thứ nhất
            lat2, lon2: Tọa độ điểm thứ hai
            
        Returns:
            float: Khoảng cách tính bằng km, làm tròn đến 2 chữ số thập phân
        """
        # Chuyển đổi độ sang radian
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Công thức Haversine
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Bán kính trái đất tại Việt Nam (km)
        # Sử dụng bán kính chính xác hơn cho vĩ độ của TPHCM
        r = 6378.137 - 21.385 * math.sin(math.radians(10.8231))  # Bán kính tại vĩ độ ~10.8°N
        
        return round(c * r, 2)

    def calculate_travel_times(self, distance_km: float) -> dict:
        """
        Tính thời gian di chuyển với các phương tiện khác nhau
        
        Args:
            distance_km: Khoảng cách tính bằng km
            
        Returns:
            dict: Thời gian di chuyển theo từng phương tiện
        """
        # Tốc độ trung bình (km/h) tại TPHCM
        speeds = {
            "walking": 5.0,      # Đi bộ
            "bicycle": 12.0,     # Xe đạp
            "motorbike": 25.0,   # Xe máy (có tính đến tắc đường)
            "car": 20.0         # Ô tô (có tính đến tắc đường)
        }
        
        travel_times = {}
        for mode, speed in speeds.items():
            # Tính thời gian theo phút
            time_hours = distance_km / speed
            time_minutes = int(time_hours * 60)
            travel_times[mode] = time_minutes
            
        return travel_times

    def validate_coordinates(self, lat: float, lon: float) -> bool:
        """
        Kiểm tra tọa độ có hợp lệ và nằm trong khu vực TPHCM
        
        Args:
            lat, lon: Tọa độ cần kiểm tra
            
        Returns:
            bool: True nếu tọa độ hợp lệ
        """
        # Kiểm tra range cơ bản
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return False
            
        # Ranh giới TPHCM (mở rộng một chút để bao gồm các khu vực lân cận)
        HCMC_BOUNDS = {
            "lat_min": 10.3,  # Cần Giờ
            "lat_max": 11.1,  # Củ Chi
            "lon_min": 106.2, # Củ Chi
            "lon_max": 107.1  # Cần Giờ
        }
        
        return (HCMC_BOUNDS["lat_min"] <= lat <= HCMC_BOUNDS["lat_max"] and
                HCMC_BOUNDS["lon_min"] <= lon <= HCMC_BOUNDS["lon_max"])

    def process_properties_with_distance(self, 
                                      properties: List[Dict], 
                                      ref_lat: float, 
                                      ref_lon: float, 
                                      radius: float = None) -> Tuple[List[Dict], List[Dict]]:
        """
        Xử lý danh sách bất động sản, tính khoảng cách và thời gian di chuyển
        
        Args:
            properties: Danh sách bất động sản
            ref_lat, ref_lon: Tọa độ điểm tham chiếu
            radius: Bán kính tìm kiếm (km), mặc định là None
            
        Returns:
            Tuple[List[Dict], List[Dict]]: (properties_within_radius, all_properties_sorted)
        """
        all_properties = []
        properties_within_radius = []
        
        for prop in properties:
            try:
                if not prop.get("latitude") or not prop.get("longitude"):
                    continue
                    
                lat = float(prop["latitude"])
                lon = float(prop["longitude"])
                
                if not self.validate_coordinates(lat, lon):
                    continue
                
                # Tính khoảng cách
                distance = self.haversine_distance(ref_lat, ref_lon, lat, lon)
                
                # Tính thời gian di chuyển
                travel_times = self.calculate_travel_times(distance)
                
                property_with_distance = {
                    **prop,
                    "distance_km": distance,
                    "travel_times": travel_times
                }
                
                all_properties.append(property_with_distance)
                
                # Thêm vào danh sách trong bán kính nếu thỏa điều kiện
                if radius is None or distance <= radius:
                    properties_within_radius.append(property_with_distance)
                    
            except (ValueError, TypeError):
                continue
        
        # Sắp xếp theo khoảng cách
        all_properties.sort(key=lambda x: x["distance_km"])
        properties_within_radius.sort(key=lambda x: x["distance_km"])
        
        return properties_within_radius, all_properties

class DucbaCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "ducba_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Find properties near Notre Dame Cathedral (Nhà thờ Đức Bà) within a specified radius.
    Uses Haversine formula to calculate distances.
    Returns all properties sorted by distance, including:
    - Properties within specified radius (default 2km)
    - Other properties sorted by distance
    - Distance from Notre Dame Cathedral in kilometers
    - Travel times by different modes (walking, bicycle, motorbike, car)
    
    Even if no properties are found within the specified radius,
    the tool will still return the nearest available properties sorted by distance.
    
    Each property includes:
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), propertyType, transactionType, status
    - Property features: bedrooms, bathrooms, area
    - Location: street, ward, district, province, displayedAddress
    - Contact: contactName, contactPhone
    - Source: sourceUrl, postUrl
    - Images: List of image URLs
    - Distance info: distance_km, travel_times
    
    Use this tool when users want to find properties near Notre Dame Cathedral.
    """
    args_schema: type[BaseModel] = DucbaCheckingLocationInput

    def _run(self, radius: Optional[float] = 2.0) -> Dict:
        # Tọa độ Nhà thờ Đức Bà
        DUCBA_LAT = 10.779814
        DUCBA_LON = 106.699150
        
        # Lấy tất cả bất động sản đang hoạt động
        properties = get_properties_by_status("active")
        
        # Xử lý và tính khoảng cách
        properties_within_radius, all_properties = self.process_properties_with_distance(
            properties, DUCBA_LAT, DUCBA_LON, radius
        )
        
        # Luôn trả về ít nhất 5 properties gần nhất, kể cả khi không có properties trong bán kính
        nearest_properties = all_properties[:5] if all_properties else []
        
        return {
            "reference_point": {
                "name": "Nhà thờ Đức Bà",
                "coordinates": {
                    "lat": DUCBA_LAT,
                    "lon": DUCBA_LON
                }
            },
            "radius_km": radius,
            "properties_within_radius": {
                "total": len(properties_within_radius),
                "properties": properties_within_radius
            },
            "nearest_properties": {
                "total": len(nearest_properties),
                "properties": nearest_properties
            }
        }

class TanSonNhatCheckingLocationInput(BaseModel):
    radius: Optional[float] = Field(default=2.0, description="Radius in kilometers to search for properties (default: 2km)")

class TanSonNhatCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "tansonhat_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Find properties near Tan Son Nhat Airport (Sân bay Tân Sơn Nhất) within a specified radius.
    Uses Haversine formula to calculate distances.
    Returns all properties sorted by distance, including:
    - Properties within specified radius (default 2km)
    - Other properties sorted by distance
    - Distance from Tan Son Nhat Airport in kilometers
    - Travel times by different modes (walking, bicycle, motorbike, car)
    
    Even if no properties are found within the specified radius,
    the tool will still return the nearest available properties sorted by distance.
    
    Each property includes:
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), propertyType, transactionType, status
    - Property features: bedrooms, bathrooms, area
    - Location: street, ward, district, province, displayedAddress
    - Contact: contactName, contactPhone
    - Source: sourceUrl, postUrl
    - Images: List of image URLs
    - Distance info: distance_km, travel_times
    
    Use this tool when users want to find properties near Tan Son Nhat Airport.
    """
    args_schema: type[BaseModel] = TanSonNhatCheckingLocationInput

    def _run(self, radius: Optional[float] = 2.0) -> Dict:
        # Tọa độ sân bay Tân Sơn Nhất
        TANSONHAT_LAT = 10.817996728
        TANSONHAT_LON = 106.651164062
        
        # Lấy tất cả bất động sản đang hoạt động
        properties = get_properties_by_status("active")
        
        # Xử lý và tính khoảng cách
        properties_within_radius, all_properties = self.process_properties_with_distance(
            properties, TANSONHAT_LAT, TANSONHAT_LON, radius
        )
        
        # Luôn trả về ít nhất 5 properties gần nhất, kể cả khi không có properties trong bán kính
        nearest_properties = all_properties[:5] if all_properties else []
        
        return {
            "reference_point": {
                "name": "Sân bay Tân Sơn Nhất",
                "coordinates": {
                    "lat": TANSONHAT_LAT,
                    "lon": TANSONHAT_LON
                }
            },
            "radius_km": radius,
            "properties_within_radius": {
                "total": len(properties_within_radius),
                "properties": properties_within_radius
            },
            "nearest_properties": {
                "total": len(nearest_properties),
                "properties": nearest_properties
            }
        }

class UniversityCheckingLocationInput(BaseModel):
    university_name: str = Field(..., description="Name of the university and/or specific campus to search properties around")
    radius: Optional[float] = Field(default=2.0, description="Radius in kilometers to search for properties (default: 2km)")

class UniversityCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "university_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Find properties near specified university campuses in Ho Chi Minh City.
    Uses Haversine formula to calculate distances.
    Returns all properties sorted by distance, including:
    - Properties within specified radius (default 2km)
    - Other properties sorted by distance
    - Distance from the university campus in kilometers
    - Travel times by different modes (walking, bicycle, motorbike, car)
    
    Even if no properties are found within the specified radius,
    the tool will still return the nearest available properties sorted by distance.
    
    Each property includes:
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), propertyType, transactionType, status
    - Property features: bedrooms, bathrooms, area
    - Location: street, ward, district, province, displayedAddress
    - Contact: contactName, contactPhone
    - Source: sourceUrl, postUrl
    - Images: List of image URLs
    - Distance info: distance_km, travel_times
    
    Available university campuses:
    - HCMUS Q5 (Đại học Khoa học Tự nhiên - Cơ sở Quận 5): 227 Nguyen Van Cu, District 5
    - HCMUT Q10 (Đại học Bách Khoa - Cơ sở Lý Thường Kiệt): 268 Ly Thuong Kiet, District 10
    - HUTECH BT (Đại học Công nghệ TP.HCM - Cơ sở Điện Biên Phủ): 475A Dien Bien Phu, Binh Thanh
    - UEH Q3 (Đại học Kinh tế TP.HCM - Cơ sở Nguyễn Đình Chiểu): 59C Nguyen Dinh Chieu, District 3
    - HCMUTE TD (Đại học Sư phạm Kỹ thuật - Cơ sở Thủ Đức): 1 Vo Van Ngan, Thu Duc
    - IU TD (Đại học Quốc tế - Cơ sở Thủ Đức): Quarter 6, Linh Trung Ward, Thu Duc
    - UFM Q7 (Đại học Tài chính - Marketing - Cơ sở Quận 7): 2/4 Tran Xuan Soan, District 7
    - VNU KTX B (Ký túc xá khu B - ĐHQG): Dong Hoa, Di An, Binh Duong
    - VLU GV (Đại học Văn Lang - Cơ sở Gò Vấp): 69/68 Dang Thuy Tram, Go Vap
    - HCMUE ADV (Đại học Sư phạm TP.HCM - Cơ sở An Dương Vương): 280 An Duong Vuong, District 5
    - HCMUE LVS (Đại học Sư phạm TP.HCM - Cơ sở Lê Văn Sỹ): 222 Lê Văn Sỹ, Phường 14, Quận 3
    - HCMUE LLQ (Đại học Sư phạm TP.HCM - Cơ sở Lạc Long Quân): 351 Lạc Long Quân, Phường 5, Quận 11
    """
    args_schema: type[BaseModel] = UniversityCheckingLocationInput

    # Dictionary of university campus coordinates
    UNIVERSITIES: ClassVar[Dict[str, Dict[str, Any]]] = {
        "hcmus_q5": {
            "name": "Đại học Khoa học Tự nhiên - Cơ sở Quận 5",
            "address": "227 Nguyễn Văn Cừ, Quận 5",
            "lat": 10.76307801155418,
            "lon": 106.68243948006412
        },
        "hcmut_q10": {
            "name": "Đại học Bách Khoa - Cơ sở Lý Thường Kiệt",
            "address": "268 Lý Thường Kiệt, Quận 10",
            "lat": 10.775702458108402,
            "lon": 106.66015796004943
        },
        "hutech_bt": {
            "name": "Đại học Công nghệ TP.HCM - Cơ sở Điện Biên Phủ",
            "address": "475A Điện Biên Phủ, Bình Thạnh",
            "lat": 10.80788664124126,
            "lon": 106.71447352020371
        },
        "ueh_q3": {
            "name": "Đại học Kinh tế TP.HCM - Cơ sở Nguyễn Đình Chiểu",
            "address": "59C Nguyễn Đình Chiểu, Quận 3",
            "lat": 10.783300549788201,
            "lon": 106.69466826701431
        },
        "hcmute_td": {
            "name": "Đại học Sư phạm Kỹ thuật - Cơ sở Thủ Đức",
            "address": "1 Võ Văn Ngân, Thủ Đức",
            "lat": 10.850864203563647,
            "lon": 106.77192382424722
        },
        "iu_td": {
            "name": "Đại học Quốc tế - Cơ sở Thủ Đức",
            "address": "Khu phố 6, Phường Linh Trung, Thủ Đức",
            "lat": 10.877732266612055,
            "lon": 106.80169467073344
        },
        "ufm_q7": {
            "name": "Đại học Tài chính - Marketing - Cơ sở Quận 7",
            "address": "2/4 Trần Xuân Soạn, Quận 7",
            "lat": 10.752240594077142,
            "lon": 106.71988755122759
        },
        "vnu_ktx_b": {
            "name": "Ký túc xá khu B - ĐHQG",
            "address": "Đông Hòa, Dĩ An, Bình Dương",
            "lat": 10.882348255938583,
            "lon": 106.78251202424775,
            "note": "Đây là KTX của Đại học Quốc gia, gần các trường thành viên như: ĐHQG (khu phố Đại học), ĐH Khoa học Tự nhiên (CS Thủ Đức), ĐH Bách Khoa (CS Dĩ An), ĐH Công nghệ Thông tin, ĐH Khoa học Xã hội và Nhân văn (CS Thủ Đức), ĐH Quốc tế, ĐH Kinh tế - Luật",
            "aliases": [
                "đại học quốc gia", "dhqg", "ktx dhqg", "ktx khu b",
                "đại học khoa học tự nhiên thủ đức", "khtn thủ đức",
                "đại học bách khoa dĩ an", "bách khoa dĩ an",
                "đại học công nghệ thông tin", "uit",
                "đại học nhân văn thủ đức", "khxh&nv",
                "đại học kinh tế luật", "uel",
                "khu phố đại học", "làng đại học",
                "đại học quốc gia thủ đức", "đại học quốc gia dĩ an"
            ]
        },
        "vlu_gv": {
            "name": "Đại học Văn Lang - Cơ sở Gò Vấp",
            "address": "69/68 Đặng Thùy Trâm, Gò Vấp",
            "lat": 10.827676581053456,
            "lon": 106.70000433773774,
            "aliases": ["văn lang", "vlu", "van lang go vap"]
        },
        "hcmue_adv": {
            "name": "Đại học Sư phạm TP.HCM - Cơ sở An Dương Vương",
            "address": "280 An Dương Vương, Quận 5",
            "lat": 10.761081650813715,
            "lon": 106.68255128006409,
            "aliases": ["đại học sư phạm", "dhsp", "sư phạm an dương vương", "hcmue", "sư phạm cơ sở chính"]
        },
        "hcmue_lvs": {
            "name": "Đại học Sư phạm TP.HCM - Cơ sở Lê Văn Sỹ",
            "address": "222 Lê Văn Sỹ, Phường 14, Quận 3",
            "lat": 10.785998895835074,
            "lon": 106.67746491157694,
            "aliases": ["sư phạm lê văn sỹ", "dhsp lê văn sỹ", "sư phạm cơ sở 2", "hcmue lê văn sỹ"]
        },
        "hcmue_llq": {
            "name": "Đại học Sư phạm TP.HCM - Cơ sở Lạc Long Quân",
            "address": "351 Lạc Long Quân, Phường 5, Quận 11",
            "lat": 10.765301665949094,
            "lon": 106.64494168197885,
            "aliases": ["sư phạm lạc long quân", "dhsp lạc long quân", "sư phạm cơ sở 3", "hcmue lạc long quân"]
        }
    }

    def _run(self, university_name: str, radius: Optional[float] = 2.0) -> Dict:
        # Tìm trường đại học phù hợp
        search_key = university_name.lower().replace(" ", "").replace("-", "").replace("đ", "d")
        
        # Special case for VNU/ĐHQG queries
        vnu_keywords = ["vnu", "dhqg", "daihocquocgia", "vietnam national university", "ktxkhub"]
        if any(keyword.lower() in search_key for keyword in vnu_keywords):
            matched_university = self.UNIVERSITIES["vnu_ktx_b"]
        else:
            # Tìm campus phù hợp
            matched_university = None
            for key, univ in self.UNIVERSITIES.items():
                if (key in search_key or 
                    search_key in key.lower() or 
                    search_key in univ["name"].lower().replace(" ", "").replace("-", "").replace("đ", "d") or
                    (
                        "aliases" in univ and 
                        any(alias.lower().replace(" ", "") in search_key or 
                            search_key in alias.lower().replace(" ", "")
                            for alias in univ["aliases"])
                    )):
                    matched_university = univ
                    break
        
        if not matched_university:
            return {
                "error": "University campus not found",
                "available_campuses": [
                    f"{key.upper()}: {univ['name']} ({univ['address']})"
                    for key, univ in self.UNIVERSITIES.items()
                ]
            }
        
        # Lấy tọa độ trường
        UNIV_LAT = matched_university["lat"]
        UNIV_LON = matched_university["lon"]
        
        # Lấy tất cả bất động sản đang hoạt động
        properties = get_properties_by_status("active")
        
        # Xử lý và tính khoảng cách
        properties_within_radius, all_properties = self.process_properties_with_distance(
            properties, UNIV_LAT, UNIV_LON, radius
        )
        
        # Luôn trả về ít nhất 5 properties gần nhất, kể cả khi không có properties trong bán kính
        nearest_properties = all_properties[:5] if all_properties else []
        
        return {
            "university": {
                "name": matched_university["name"],
                "address": matched_university["address"],
                "coordinates": {
                    "lat": UNIV_LAT,
                    "lon": UNIV_LON
                }
            },
            "radius_km": radius,
            "properties_within_radius": {
                "total": len(properties_within_radius),
                "properties": properties_within_radius
            },
            "nearest_properties": {
                "total": len(nearest_properties),
                "properties": nearest_properties
            }
        } 