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
    pass  # Remove all parameters since coordinates are predefined

class TanSonNhatCheckingLocationInput(BaseModel):
    pass  # Remove all parameters since coordinates are predefined

class UniversityCheckingLocationInput(BaseModel):
    university_name: str = Field(..., description="Name of the university to search properties around. Examples: HCMUS, Bách Khoa, HUTECH, UEH, etc.")

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

    def fix_coordinates(self, lat: float, lon: float) -> tuple[float, float]:
        """
        Sửa lại tọa độ nếu bị đảo ngược (dựa vào range của HCMC)
        
        Args:
            lat, lon: Tọa độ cần kiểm tra
            
        Returns:
            tuple[float, float]: (lat, lon) đã được sửa
        """
        # Range của HCMC
        LAT_RANGE = (10.3, 11.1)   # Vĩ độ HCMC ~ 10.3-11.1
        LON_RANGE = (106.2, 107.1)  # Kinh độ HCMC ~ 106.2-107.1
        
        # Nếu tọa độ bị đảo ngược
        if (LAT_RANGE[0] <= lon <= LAT_RANGE[1] and 
            LON_RANGE[0] <= lat <= LON_RANGE[1]):
            return (lon, lat)
        
        return (lat, lon)

    def validate_coordinates(self, lat: float, lon: float) -> bool:
        """
        Kiểm tra tọa độ có hợp lệ và nằm trong khu vực HCMC
        
        Args:
            lat, lon: Tọa độ cần kiểm tra
            
        Returns:
            bool: True nếu tọa độ hợp lệ
        """
        try:
            lat = float(lat)
            lon = float(lon)
            
            # Kiểm tra range cơ bản
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                return False
                
            # Ranh giới HCMC (mở rộng một chút để bao gồm các khu vực lân cận)
            HCMC_BOUNDS = {
                "lat_min": 10.3,  # Cần Giờ
                "lat_max": 11.1,  # Củ Chi
                "lon_min": 106.2, # Củ Chi
                "lon_max": 107.1  # Cần Giờ
            }
            
            # Thử cả hai cách (gốc và đảo ngược)
            original_valid = (HCMC_BOUNDS["lat_min"] <= lat <= HCMC_BOUNDS["lat_max"] and
                            HCMC_BOUNDS["lon_min"] <= lon <= HCMC_BOUNDS["lon_max"])
                            
            swapped_valid = (HCMC_BOUNDS["lat_min"] <= lon <= HCMC_BOUNDS["lat_max"] and
                            HCMC_BOUNDS["lon_min"] <= lat <= HCMC_BOUNDS["lon_max"])
            
            return original_valid or swapped_valid
            
        except (ValueError, TypeError):
            return False

    def process_properties_with_distance(self, 
                                      properties: List[Dict], 
                                      ref_lat: float, 
                                      ref_lon: float) -> List[Dict]:
        """
        Xử lý danh sách bất động sản, tính khoảng cách và thời gian di chuyển
        
        Args:
            properties: Danh sách bất động sản
            ref_lat, ref_lon: Tọa độ điểm tham chiếu
            
        Returns:
            List[Dict]: Danh sách properties đã được sắp xếp theo khoảng cách
        """
        all_properties = []
        
        for prop in properties:
            try:
                if not prop.get("latitude") or not prop.get("longitude"):
                    continue
                    
                lat = float(prop["latitude"])
                lon = float(prop["longitude"])
                
                if not self.validate_coordinates(lat, lon):
                    continue
                
                # Sửa lại tọa độ nếu bị đảo ngược
                lat, lon = self.fix_coordinates(lat, lon)
                
                # Tính khoảng cách
                distance = self.haversine_distance(ref_lat, ref_lon, lat, lon)
                
                # Tính thời gian di chuyển
                travel_times = self.calculate_travel_times(distance)
                
                # Format distance description
                distance_desc = ""
                if distance < 0.1:  # Less than 100m
                    distance_desc = f"{int(distance * 1000)}m"
                elif distance < 1:  # Less than 1km
                    distance_desc = f"{int(distance * 1000)}m"
                else:
                    distance_desc = f"{distance:.1f}km"
                
                property_with_distance = {
                    **prop,
                    "distance_km": distance,
                    "distance_desc": distance_desc,
                    "travel_times": travel_times,
                    "coordinates": {
                        "latitude": lat,
                        "longitude": lon
                    },
                    "distance_info": {
                        "value": distance,
                        "formatted": distance_desc,
                        "category": "very_close" if distance < 0.5 else
                                  "close" if distance < 1 else
                                  "walkable" if distance < 2 else
                                  "nearby" if distance < 5 else
                                  "far"
                    }
                }
                
                all_properties.append(property_with_distance)
                    
            except (ValueError, TypeError):
                continue
        
        # Sắp xếp theo khoảng cách
        all_properties.sort(key=lambda x: x["distance_km"])
        
        return all_properties

class DucbaCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "ducba_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Find properties near Notre Dame Cathedral (Nhà thờ Đức Bà).
    Uses Haversine formula to calculate distances.
    Returns ALL properties sorted by distance from the cathedral.
    
    Reference Point:
    - Notre Dame Cathedral (10.779814, 106.699150)
    - Address: 01 Công xã Paris, Bến Nghé, District 1, HCMC
    
    Each property includes:
    - Distance from Notre Dame Cathedral in kilometers
    - Travel times by different modes (walking, bicycle, motorbike, car)
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

    # Predefined coordinates for Notre Dame Cathedral
    DUCBA_LAT: ClassVar[float] = 10.779814
    DUCBA_LON: ClassVar[float] = 106.699150
    DUCBA_ADDRESS: ClassVar[str] = "01 Công xã Paris, Bến Nghé, District 1, HCMC"

    def _run(self) -> Dict:
        # Lấy tất cả bất động sản đang hoạt động
        properties = get_properties_by_status("active")
        
        # Xử lý và tính khoảng cách cho tất cả properties
        all_properties = self.process_properties_with_distance(
            properties, self.DUCBA_LAT, self.DUCBA_LON
        )
        
        return {
            "reference_point": {
                "name": "Nhà thờ Đức Bà",
                "address": self.DUCBA_ADDRESS,
                "coordinates": {
                    "lat": self.DUCBA_LAT,
                    "lon": self.DUCBA_LON
                }
            },
            "total_properties": len(all_properties),
            "properties": all_properties
        }

class TanSonNhatCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "tansonhat_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Find properties near Tan Son Nhat Airport (Sân bay Tân Sơn Nhất).
    Uses Haversine formula to calculate distances.
    Returns ALL properties sorted by distance from the airport.
    
    Reference Point:
    - Tan Son Nhat Airport (10.818663, 106.654835)
    - Address: Sân bay Tân Sơn Nhất, P.2, Q.Tân Bình, HCMC
    
    Each property includes:
    - Distance from Tan Son Nhat Airport in kilometers
    - Travel times by different modes (walking, bicycle, motorbike, car)
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

    # Predefined coordinates for Tan Son Nhat Airport
    # Using the center point of the airport instead of the main gate
    TANSONHAT_LAT: ClassVar[float] = 10.818663  # Updated to airport center
    TANSONHAT_LON: ClassVar[float] = 106.654835  # Updated to airport center
    TANSONHAT_ADDRESS: ClassVar[str] = "Sân bay Tân Sơn Nhất, P.2, Q.Tân Bình, HCMC"

    def _run(self) -> Dict:
        # Lấy tất cả bất động sản đang hoạt động
        properties = get_properties_by_status("active")
        
        # Xử lý và tính khoảng cách cho tất cả properties
        all_properties = self.process_properties_with_distance(
            properties, self.TANSONHAT_LAT, self.TANSONHAT_LON
        )
        
        return {
            "reference_point": {
                "name": "Sân bay Tân Sơn Nhất",
                "address": self.TANSONHAT_ADDRESS,
                "coordinates": {
                    "lat": self.TANSONHAT_LAT,
                    "lon": self.TANSONHAT_LON
                }
            },
            "total_properties": len(all_properties),
            "properties": all_properties
        }

class UniversityCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "university_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Find properties near specified university campuses in Ho Chi Minh City.
    Uses Haversine formula to calculate distances.
    Returns ALL properties sorted by distance from the selected campus.
    
    Available Universities:
    1. HCMUS (Đại học Khoa học Tự nhiên):
       - Q5 Campus: 227 Nguyen Van Cu, District 5
       - Thu Duc Campus: Quarter 6, Linh Trung, Thu Duc (part of VNU)
    
    2. HCMUT (Đại học Bách Khoa):
       - Q10 Campus: 268 Ly Thuong Kiet, District 10
       - Di An Campus: Dĩ An, Bình Dương (part of VNU)
    
    3. HUTECH (Đại học Công nghệ TP.HCM):
       - Binh Thanh Campus: 475A Dien Bien Phu
    
    4. UEH (Đại học Kinh tế TP.HCM):
       - District 3 Campus: 59C Nguyen Dinh Chieu
    
    5. VNU (Đại học Quốc gia):
       - Thu Duc Campus: Linh Trung, Thu Duc
       - Includes: HCMUS, HCMUT, UIT, USSH, IU, UEL
       - KTX khu B: Dong Hoa, Di An, Binh Duong
    
    Each property includes:
    - Distance from campus in kilometers
    - Travel times by different modes (walking, bicycle, motorbike, car)
    - Basic info: id, name, description
    - Price and details: price (in millions VND), area (m2), propertyType, transactionType
    - Location and contact information
    """
    args_schema: type[BaseModel] = UniversityCheckingLocationInput

    # Predefined university coordinates
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
        }
    }

    def _find_matching_university(self, search_key: str) -> Optional[Dict[str, Any]]:
        """
        Tìm trường đại học phù hợp với từ khóa tìm kiếm
        
        Args:
            search_key (str): Từ khóa tìm kiếm (đã được chuẩn hóa)
            
        Returns:
            Optional[Dict[str, Any]]: Thông tin trường đại học nếu tìm thấy
        """
        # Special case for VNU/ĐHQG queries
        vnu_keywords = ["vnu", "dhqg", "daihocquocgia", "vietnam national university", "ktxkhub"]
        if any(keyword.lower() in search_key for keyword in vnu_keywords):
            return self.UNIVERSITIES["vnu_ktx_b"]
            
        # Tìm campus phù hợp
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
                return univ
                
        return None

    def _run(self, university_name: str) -> Dict:
        # Chuẩn hóa từ khóa tìm kiếm
        search_key = university_name.lower().replace(" ", "").replace("-", "").replace("đ", "d")
        
        # Tìm trường đại học phù hợp
        matched_university = self._find_matching_university(search_key)
        
        if not matched_university:
            return {
                "error": "University campus not found",
                "available_campuses": [
                    f"{key.upper()}: {univ['name']} ({univ['address']})"
                    for key, univ in self.UNIVERSITIES.items()
                ]
            }
        
        # Lấy tọa độ trường
        univ_lat = matched_university["lat"]
        univ_lon = matched_university["lon"]
        
        # Lấy tất cả bất động sản đang hoạt động
        properties = get_properties_by_status("active")
        
        # Xử lý và tính khoảng cách cho tất cả properties
        all_properties = self.process_properties_with_distance(
            properties, univ_lat, univ_lon
        )
        
        return {
            "university": {
                "name": matched_university["name"],
                "address": matched_university["address"],
                "coordinates": {
                    "lat": univ_lat,
                    "lon": univ_lon
                },
                "note": matched_university.get("note", "")  # Add note if available
            },
            "total_properties": len(all_properties),
            "properties": all_properties
        } 