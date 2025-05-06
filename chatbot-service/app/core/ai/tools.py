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
from ..location_utils import LocationUtils
import requests
import json
from requests.adapters import HTTPAdapter
from urllib.parse import urlparse, urlunparse

# class ProductSearchInput(BaseModel):
#     product_name: str = Field(..., description="The name of the product to search for")

# class ProductSearchTool(BaseTool):
#     name: Annotated[str, Field(description="Tool name")] = "product_search"
#     description: Annotated[str, Field(description="Tool description")] = "Search for product information by name"
#     args_schema: type[BaseModel] = ProductSearchInput

#     def _run(self, product_name: str) -> Optional[Dict]:
#         return get_product_by_name(product_name)

class ShowPropertiesInput(BaseModel):
    query: Optional[str] = Field(default="", description="Optional search query to filter properties")

class ShowPropertiesTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "show_properties"
    description: Annotated[str, Field(description="Tool description")] = """
    Show an overview of available properties.
    Use this tool when users want to:
    - See all available properties
    - Get a general overview of properties
    - View property listings without specific filters
    
    No parameters needed - just call the tool directly.
    """
    args_schema: type[BaseModel] = ShowPropertiesInput

    def format_property_display(self, property_data):
        """Format a single property for display"""
        return {
            "id": property_data.get('id'),
            "name": property_data.get('name', 'Chưa cập nhật'),
            "type": property_data.get('propertyType', 'Chưa cập nhật'),
            "area": property_data.get('area', 'Chưa cập nhật'),
            "bedrooms": property_data.get('bedrooms', 'Chưa cập nhật'),
            "bathrooms": property_data.get('bathrooms', 'Chưa cập nhật'),
            "address": property_data.get('displayedAddress', 'Chưa cập nhật'),
            "district": property_data.get('district', 'Chưa cập nhật'),
            "price": property_data.get('price', 'Chưa cập nhật'),
            "contact_name": property_data.get('contactName', 'Chưa cập nhật'),
            "contact_phone": property_data.get('contactPhone', 'Chưa cập nhật'),
            "images": property_data.get('images', [{'url': 'Chưa có hình ảnh'}])
        }

    def _run(self, query: str = "") -> Dict:
        try:
            print("\n[DEBUG] ShowPropertiesTool making API call")
            
            # Build query parameters
            params = {
                "page": 1,
                "limit": 10,  # Show a reasonable number of properties
                "status": "active"  # Only show active properties
            }
            
            # Print API call information
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Use a session with the debugging adapter
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
            
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "total_available": 0,
                    "properties": []
                }
            
            # Parse response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                available_properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(available_properties)} available properties via API")
                
                if not available_properties:
                    return {
                        "error": "No properties found",
                        "total_available": 0,
                        "properties": []
                    }
                
                # Format all properties
                formatted_properties = [
                    self.format_property_display(prop) 
                    for prop in available_properties
                ]
                
                # Create overview text
                overview = f"""Found {len(available_properties)} available properties:\n\n"""
                
                # Return all properties without limiting
                return {
                    "total_available": len(available_properties),
                    "formatted_properties": formatted_properties,
                    "overview": overview
                }
            else:
                return {
                    "error": "Unexpected API response format",
                    "total_available": 0,
                    "properties": []
                }
            
        except Exception as e:
            print(f"[DEBUG] Error in ShowPropertiesTool: {str(e)}")
            return {
                "error": f"Error fetching properties: {str(e)}",
                "total_available": 0,
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

    def format_property(self, prop: Dict) -> Dict:
        """Format a single property for display"""
        return {
            "id": prop.get('id', 'Not specified'),
            "name": prop.get('name', 'Unnamed Property'),
            "district": prop.get('district', 'Not specified'),
            "price": prop.get('price', 'Contact for price'),
            "area": prop.get('area', 'Not specified'),
            "bedrooms": prop.get('bedrooms', 'Not specified'),
            "bathrooms": prop.get('bathrooms', 'Not specified'),
            "contact_name": prop.get('contactName', 'Not specified'),
            "contact_phone": prop.get('contactPhone', 'Not specified'),
            "images": prop.get('images', [{'url': 'No image available'}])
        }

    def _normalize_district(self, district: str) -> str:
        """
        Chuẩn hóa tên quận/huyện để phù hợp với API
        - Nếu là "Quận X" hoặc "District X" -> trả về "X" 
        - Giữ nguyên các tên quận/huyện khác như "Bình Thạnh", "Thủ Đức"
        """
        import re
        
        # Chuẩn hóa district input
        district = district.strip()
        
        # Mẫu regex bắt "Quận X" hoặc "District X" (với X là số)
        quan_pattern = re.compile(r'^(?:quận|quan|district|q)\s*(\d+)$', re.IGNORECASE)
        match = quan_pattern.match(district)
        
        if match:
            # Nếu match "Quận X" -> trả về X (số)
            return match.group(1)
        
        # Kiểm tra nếu district chỉ là số
        if district.isdigit():
            return district
            
        # Giữ nguyên các quận/huyện khác
        return district

    def _run(self, district: str) -> Dict:
        print(f"\n[DEBUG] CheckPropertiesDistrictTool called with district: {district}")
        
        # Normalize district parameter
        normalized_district = self._normalize_district(district)
        print(f"[DEBUG] Normalized district: '{district}' -> '{normalized_district}'")
        
        try:
            # Using API instead of direct database access
            # Build query parameters - using district as filter
            params = {
                "page": 1,
                "limit": 50,  # Get more items to show comprehensive results
                "district": normalized_district
            }
            
            # Print API call information
            print(f"\n[DEBUG] CheckPropertiesDistrictTool making API call:")
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Build full URL for display
            param_strings = [f"{key}={value}" for key, value in params.items()]
            full_url = f"http://localhost:8080/api/posts?{'&'.join(param_strings)}"
            print(f"[DEBUG] Full URL: {full_url}")
            
            # Use a session with the debugging adapter to capture and print request details
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
                
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            # Print response details
            print(f"\n[DEBUG] ============ RESPONSE DETAILS ============")
            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response headers: {json.dumps(dict(response.headers), indent=2)}")
            print(f"[DEBUG] Response URL: {response.url}")
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "details": response.text
                }
            
            # Parse response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(properties)} properties in district {district} via API")
                
                # Format each property
                formatted_properties = [self.format_property(prop) for prop in properties]
                
                return {
                    "district": district,
                    "total_found": len(formatted_properties),
                    "properties": formatted_properties
                }
            else:
                return {
                    "district": district,
                    "total_found": 0,
                    "properties": [],
                    "error": "No properties found or unexpected API response format"
                }
                
        except Exception as e:
            print(f"[DEBUG] Error in CheckPropertiesDistrictTool: {str(e)}")
            return {
                "district": district,
                "total_found": 0,
                "properties": [],
                "error": f"Error fetching properties: {str(e)}"
            }

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
        print(f"\n[DEBUG] CheckPropertiesStatusTool called with status: {status}")
        
        try:
            # Build query parameters
            params = {
                "page": 1,
                "limit": 50,  # Get more items for a comprehensive view
                "status": status  # Status filter (active/inactive)
            }
            
            # Print API call information
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Use a session with the debugging adapter
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
            
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "status": status,
                    "properties": []
                }
            
            # Parse response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(properties)} properties with status '{status}' via API")
                
                return {
                    "status": status,
                    "total_found": len(properties),
                    "properties": properties
                }
            else:
                return {
                    "status": status,
                    "total_found": 0,
                    "properties": [],
                    "error": "No properties found or unexpected API response format"
                }
                
        except Exception as e:
            print(f"[DEBUG] Error in CheckPropertiesStatusTool: {str(e)}")
            return {
                "error": f"Error fetching properties: {str(e)}",
                "status": status,
                "properties": []
            }

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
        print(f"\n[DEBUG] CheckPropertiesPriceRangeTool called with price range: {min_price}-{max_price} million VND")
        
        try:
            # Build query parameters
            params = {
                "page": 1,
                "limit": 50,  # Get more items for a comprehensive view
                "minPrice": min_price,
                "maxPrice": max_price,
                "status": "active"  # Default to active properties
            }
            
            # Print API call information
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Use a session with the debugging adapter
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
            
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "price_range": {"min": min_price, "max": max_price},
                    "total_properties": 0,
                    "properties": []
                }
            
            # Parse response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(properties)} properties in price range {min_price}-{max_price} million via API")
                
                # Sort properties by price
                properties.sort(key=lambda x: x.get('price', float('inf')))
                
                return {
                    "price_range": {
                        "min": min_price,
                        "max": max_price
                    },
                    "total_properties": len(properties),
                    "properties": properties
                }
            else:
                return {
                    "price_range": {"min": min_price, "max": max_price},
                    "total_properties": 0,
                    "properties": [],
                    "error": "No properties found or unexpected API response format"
                }
                
        except Exception as e:
            print(f"[DEBUG] Error in CheckPropertiesPriceRangeTool: {str(e)}")
            return {
                "error": f"Error fetching properties: {str(e)}",
                "price_range": {"min": min_price, "max": max_price},
                "total_properties": 0,
                "properties": []
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
        r = 6378.137 - 21.385 * math.sin(math.radians(10.8231))
        
        return round(c * r, 2)

    def calculate_travel_times(self, distance_km: float) -> dict:
        """
        Tính thời gian di chuyển với các phương tiện khác nhau
        
        Args:
            distance_km: Khoảng cách tính bằng km
            
        Returns:
            dict: Thời gian di chuyển theo từng phương tiện
        """
        speeds = {
            "walking": 5.0,      # Đi bộ
            "motorbike": 25.0,   # Xe máy (có tính đến tắc đường)
            "car": 20.0         # Ô tô (có tính đến tắc đường)
        }
        
        travel_times = {}
        for mode, speed in speeds.items():
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
        Process all properties with distance calculations, no filtering
        
        Args:
            properties: List of properties
            ref_lat, ref_lon: Reference point coordinates
            
        Returns:
            List[Dict]: All properties with distance info, sorted by distance
        """
        all_properties = []
        
        for prop in properties:
            try:
                if not prop.get("latitude") or not prop.get("longitude"):
                    # For properties without coordinates, mark as unknown distance
                    property_with_distance = {
                        **prop,
                        "distance_km": None,
                        "distance_desc": "Distance unknown - No coordinates",
                        "travel_times": None,
                        "coordinates": None
                    }
                    all_properties.append(property_with_distance)
                    continue
                    
                lat = float(prop["latitude"])
                lon = float(prop["longitude"])
                
                if not self.validate_coordinates(lat, lon):
                    property_with_distance = {
                        **prop,
                        "distance_km": None,
                        "distance_desc": "Distance unknown - Invalid coordinates",
                        "travel_times": None,
                        "coordinates": {
                            "latitude": lat,
                            "longitude": lon
                        }
                    }
                    all_properties.append(property_with_distance)
                    continue
                
                lat, lon = self.fix_coordinates(lat, lon)
                
                # Calculate distance for all properties
                distance = self.haversine_distance(ref_lat, ref_lon, lat, lon)
                travel_times = self.calculate_travel_times(distance)
                
                property_with_distance = {
                    **prop,
                    "distance_km": distance,
                    "distance_desc": f"{distance:.2f}km",
                    "travel_times": travel_times,
                    "coordinates": {
                        "latitude": lat,
                        "longitude": lon
                    }
                }
                
                all_properties.append(property_with_distance)
                    
            except (ValueError, TypeError) as e:
                # For any other errors, include property with error note
                property_with_distance = {
                    **prop,
                    "distance_km": None,
                    "distance_desc": f"Distance calculation error: {str(e)}",
                    "travel_times": None,
                    "coordinates": None
                }
                all_properties.append(property_with_distance)
        
        # Sort properties: those with valid distances first, sorted by distance
        return sorted(
            all_properties,
            key=lambda x: (x["distance_km"] is None, x["distance_km"] if x["distance_km"] is not None else float('inf'))
        )

class DucbaCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "ducba_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Find properties near Notre Dame Cathedral (Nhà thờ Đức Bà).
    Uses Haversine formula to calculate distances.
    Returns ALL properties sorted by distance from the cathedral.
    
    Reference Point:
    - Cathedral Main Entrance: 10.779814°N, 106.699150°E
    - Address: 01 Công xã Paris, Bến Nghé, District 1, HCMC
    
    Each property includes:
    - Exact distance from cathedral in kilometers
    - Travel times by different modes (walking, motorbike, car)
    - Basic property information and features
    - Price and contact details
    """
    
    # Predefined coordinates for Notre Dame Cathedral
    CATHEDRAL_LAT: ClassVar[float] = 10.779814
    CATHEDRAL_LON: ClassVar[float] = 106.699150
    CATHEDRAL_ADDRESS: ClassVar[str] = "01 Công xã Paris, Bến Nghé, District 1, HCMC"

    def _run(self) -> Dict:
        print(f"\n[DEBUG] DucbaCheckingLocationTool called")
        
        try:
            # Build query parameters - using centerLat/centerLng might be more appropriate
            # but we'll get all properties and calculate distances manually for flexibility
            params = {
                "page": 1,
                "limit": 100,  # Get a larger set of properties
                "status": "active",
                # Could add centerLat, centerLng, and radius if API supports it
            }
            
            # Print API call information
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Use a session with the debugging adapter
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
            
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "reference_point": {
                        "name": "Notre Dame Cathedral",
                        "address": self.CATHEDRAL_ADDRESS,
                        "coordinates": {"lat": self.CATHEDRAL_LAT, "lon": self.CATHEDRAL_LON}
                    },
                    "total_properties": 0,
                    "properties": []
                }
            
            # Parse response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(properties)} active properties via API")
                
                # Process properties and calculate distances
                all_properties = self.process_properties_with_distance(
                    properties, self.CATHEDRAL_LAT, self.CATHEDRAL_LON
                )
                
                return {
                    "reference_point": {
                        "name": "Notre Dame Cathedral",
                        "address": self.CATHEDRAL_ADDRESS,
                        "coordinates": {
                            "lat": self.CATHEDRAL_LAT,
                            "lon": self.CATHEDRAL_LON
                        }
                    },
                    "total_properties": len(all_properties),
                    "properties": all_properties
                }
            else:
                return {
                    "reference_point": {
                        "name": "Notre Dame Cathedral",
                        "address": self.CATHEDRAL_ADDRESS,
                        "coordinates": {"lat": self.CATHEDRAL_LAT, "lon": self.CATHEDRAL_LON}
                    },
                    "total_properties": 0,
                    "properties": [],
                    "error": "No properties found or unexpected API response format"
                }
                
        except Exception as e:
            print(f"[DEBUG] Error in DucbaCheckingLocationTool: {str(e)}")
            return {
                "error": f"Error processing properties: {str(e)}",
                "reference_point": {
                    "name": "Notre Dame Cathedral",
                    "address": self.CATHEDRAL_ADDRESS,
                    "coordinates": {"lat": self.CATHEDRAL_LAT, "lon": self.CATHEDRAL_LON}
                },
                "total_properties": 0,
                "properties": []
            }

class TanSonNhatCheckingLocationTool(BaseTool, LocationBaseMixin):
    name: Annotated[str, Field(description="Tool name")] = "tansonhat_checking_location"
    description: Annotated[str, Field(description="Tool description")] = """
    Calculate distances from all properties to Tan Son Nhat Airport.
    Uses Haversine formula to calculate distances.
    Returns ALL properties with their exact distance from the airport.
    
    Reference Point:
    - Main Terminal: 10.818663°N, 106.654835°E
    - Address: Trường Sơn, P.2, Q.Tân Bình, HCMC
    
    Each property includes:
    - Exact distance from airport in kilometers
    - Travel times by different modes
    - Basic property information
    - Price and contact details
    
    Note: Shows ALL properties with their distances, no distance filtering
    """
    
    # Predefined coordinates for Tan Son Nhat Airport
    AIRPORT_LAT: ClassVar[float] = 10.818663
    AIRPORT_LON: ClassVar[float] = 106.654835
    AIRPORT_ADDRESS: ClassVar[str] = "Trường Sơn, P.2, Q.Tân Bình, HCMC"

    def _run(self) -> Dict:
        print(f"\n[DEBUG] TanSonNhatCheckingLocationTool called")
        
        try:
            # Build query parameters - fetch all active properties
            params = {
                "page": 1,
                "limit": 100,  # Get a larger set of properties
                "status": "active",
                # Could add centerLat, centerLng, and radius if API supports it
            }
            
            # Print API call information
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Use a session with the debugging adapter
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
            
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "reference_point": {
                        "name": "Tan Son Nhat Airport",
                        "address": self.AIRPORT_ADDRESS,
                        "coordinates": {"lat": self.AIRPORT_LAT, "lon": self.AIRPORT_LON}
                    },
                    "total_properties": 0,
                    "properties": []
                }
            
            # Parse response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(properties)} active properties via API")
                
                # Process properties and calculate distances
                all_properties = self.process_properties_with_distance(
                    properties, self.AIRPORT_LAT, self.AIRPORT_LON
                )
                
                return {
                    "reference_point": {
                        "name": "Tan Son Nhat Airport",
                        "address": self.AIRPORT_ADDRESS,
                        "coordinates": {
                            "lat": self.AIRPORT_LAT,
                            "lon": self.AIRPORT_LON
                        }
                    },
                    "total_properties": len(all_properties),
                    "properties": all_properties
                }
            else:
                return {
                    "reference_point": {
                        "name": "Tan Son Nhat Airport",
                        "address": self.AIRPORT_ADDRESS,
                        "coordinates": {"lat": self.AIRPORT_LAT, "lon": self.AIRPORT_LON}
                    },
                    "total_properties": 0,
                    "properties": [],
                    "error": "No properties found or unexpected API response format"
                }
                
        except Exception as e:
            print(f"[DEBUG] Error in TanSonNhatCheckingLocationTool: {str(e)}")
            return {
                "error": f"Error processing properties: {str(e)}",
                "reference_point": {
                    "name": "Tan Son Nhat Airport",
                    "address": self.AIRPORT_ADDRESS,
                    "coordinates": {"lat": self.AIRPORT_LAT, "lon": self.AIRPORT_LON}
                },
                "total_properties": 0,
                "properties": []
            }

class LocationCheckingInput(BaseModel):
    landmark_type: str = Field(
        default="tsn_main",
        description="Type of landmark to check distance from. Options: tsn_main, tsn_domestic, tsn_international"
    )

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
        print(f"\n[DEBUG] UniversityCheckingLocationTool called with university: {university_name}")
        
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
        
        try:
            # Build query parameters
            params = {
                "page": 1,
                "limit": 100,  # Get a larger set of properties
                "status": "active",
                # Could add centerLat, centerLng, and radius if API supports it
            }
            
            # Print API call information
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Use a session with the debugging adapter
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
            
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "university": {
                        "name": matched_university["name"],
                        "address": matched_university["address"],
                        "coordinates": {"lat": univ_lat, "lon": univ_lon},
                        "note": matched_university.get("note", "")
                    },
                    "total_properties": 0,
                    "properties": []
                }
            
            # Parse response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(properties)} active properties via API")
                
                # Process properties and calculate distances from university
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
            else:
                return {
                    "university": {
                        "name": matched_university["name"],
                        "address": matched_university["address"],
                        "coordinates": {"lat": univ_lat, "lon": univ_lon}, 
                        "note": matched_university.get("note", "")
                    },
                    "total_properties": 0,
                    "properties": [],
                    "error": "No properties found or unexpected API response format"
                }
                
        except Exception as e:
            print(f"[DEBUG] Error in UniversityCheckingLocationTool: {str(e)}")
            return {
                "error": f"Error processing properties: {str(e)}",
                "university": {
                    "name": matched_university["name"],
                    "address": matched_university["address"],
                    "coordinates": {"lat": univ_lat, "lon": univ_lon}, 
                    "note": matched_university.get("note", "")
                },
                "total_properties": 0,
                "properties": []
            }

class SearchPostsInput(BaseModel):
    page: int = Field(default=1, description="Page number for pagination")
    limit: int = Field(default=10, description="Number of items per page")
    min_price: Optional[float] = Field(default=None, description="Minimum price in millions VND")
    max_price: Optional[float] = Field(default=None, description="Maximum price in millions VND")
    min_area: Optional[float] = Field(default=None, description="Minimum area in square meters")
    max_area: Optional[float] = Field(default=None, description="Maximum area in square meters")
    property_type: Optional[str] = Field(default=None, description="Type of property (room, apartment, house, etc.)")
    transaction_type: Optional[str] = Field(default=None, description="Type of transaction (rent, buy)")
    province: Optional[str] = Field(default=None, description="Province/City name")
    district: Optional[str] = Field(default=None, description="District name")
    ward: Optional[str] = Field(default=None, description="Ward name")
    min_bedrooms: Optional[int] = Field(default=None, description="Minimum number of bedrooms")
    min_bathrooms: Optional[int] = Field(default=None, description="Minimum number of bathrooms")
    center_lat: Optional[float] = Field(default=None, description="Center latitude for radius search")
    center_lng: Optional[float] = Field(default=None, description="Center longitude for radius search")
    radius: Optional[int] = Field(default=None, description="Radius for location search in kilometers")
    bounds: Optional[str] = Field(default=None, description="Boundary coordinates for area search [minLat, minLng, maxLat, maxLng]")

# Custom HTTP adapter to capture request details
class DebuggingAdapter(HTTPAdapter):
    def add_headers(self, request, **kwargs):
        super().add_headers(request, **kwargs)
        # Print full request details
        print(f"\n[DEBUG] ============ FULL REQUEST DETAILS ============")
        print(f"[DEBUG] Request method: {request.method}")
        print(f"[DEBUG] Request URL: {request.url}")
        print(f"[DEBUG] Request headers: {json.dumps(dict(request.headers), indent=2)}")
        print(f"[DEBUG] Request body: {request.body}")
        print(f"[DEBUG] ===============================================")
        return request

class SearchPostsTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "search_posts"
    description: Annotated[str, Field(description="Tool description")] = """
    Search for rental properties with various filters.
    Returns a list of properties matching the criteria.
    
    Use this tool when:
    - Users ask for properties within a specific price range
    - Users want to find rooms/apartments/houses for rent or buy
    - Users need to filter properties by area size, location, or features
    - Users are looking for properties in specific conditions or districts
    
    Main parameters:
    - property_type: Type of property (options: "room", "apartment", "house", "commercial", "land")
    - transaction_type: Type of transaction (options: "rent", "buy")
    - min_price/max_price: Price range in millions VND
    - min_area/max_area: Area range in square meters
    - province/district/ward: Location filters
    - min_bedrooms/min_bathrooms: Minimum requirements for rooms
    - center_lat/center_lng/radius: For location-based radius search
    
    Note: Prices are in millions VND (3 = 3,000,000 VND)
    """
    args_schema: type[BaseModel] = SearchPostsInput
    
    def _normalize_district(self, district: str) -> str:
        """
        Chuẩn hóa tên quận/huyện để phù hợp với API
        - Nếu là "Quận X" hoặc "District X" -> trả về "X" 
        - Giữ nguyên các tên quận/huyện khác như "Bình Thạnh", "Thủ Đức"
        """
        if district is None:
            return None
            
        import re
        
        # Chuẩn hóa district input
        district = district.strip()
        
        # Mẫu regex bắt "Quận X" hoặc "District X" (với X là số)
        quan_pattern = re.compile(r'^(?:quận|quan|district|q)\s*(\d+)$', re.IGNORECASE)
        match = quan_pattern.match(district)
        
        if match:
            # Nếu match "Quận X" -> trả về X (số)
            return match.group(1)
        
        # Kiểm tra nếu district chỉ là số
        if district.isdigit():
            return district
            
        # Giữ nguyên các quận/huyện khác
        return district

    def _format_property_type(self, property_type: str) -> Optional[str]:
        """
        Đảm bảo property_type phù hợp với enum PropertyType 
        trong API (room, apartment, house, commercial, land)
        """
        if property_type is None:
            return None
            
        # Chuẩn hóa property_type
        property_type = property_type.lower().strip()
        
        # Map các từ đồng nghĩa về đúng giá trị enum
        mapping = {
            # room
            'room': 'room',
            'phòng': 'room',
            'phong': 'room',
            'phòng trọ': 'room',
            'phong tro': 'room',
            
            # apartment
            'apartment': 'apartment', 
            'căn hộ': 'apartment',
            'can ho': 'apartment',
            'chung cư': 'apartment',
            'chung cu': 'apartment',
            
            # house
            'house': 'house',
            'nhà': 'house',
            'nha': 'house',
            'biệt thự': 'house',
            'biet thu': 'house',
            'villa': 'house',
            
            # commercial
            'commercial': 'commercial',
            'thương mại': 'commercial',
            'thuong mai': 'commercial',
            'văn phòng': 'commercial',
            'van phong': 'commercial',
            'office': 'commercial',
            'mặt bằng': 'commercial',
            'mat bang': 'commercial',
            
            # land
            'land': 'land',
            'đất': 'land',
            'dat': 'land',
            'đất nền': 'land',
            'dat nen': 'land',
        }
        
        return mapping.get(property_type, property_type)
        
    def _format_transaction_type(self, transaction_type: str) -> Optional[str]:
        """
        Đảm bảo transaction_type phù hợp với enum TransactionType 
        trong API (rent, buy)
        """
        if transaction_type is None:
            return None
            
        # Chuẩn hóa transaction_type
        transaction_type = transaction_type.lower().strip()
        
        # Map các từ đồng nghĩa về đúng giá trị enum
        mapping = {
            # rent
            'rent': 'rent',
            'thuê': 'rent',
            'thue': 'rent',
            'cho thuê': 'rent',
            'cho thue': 'rent',
            
            # buy
            'buy': 'buy',
            'mua': 'buy',
            'bán': 'buy',
            'ban': 'buy',
        }
        
        return mapping.get(transaction_type, transaction_type)
    
    def _run(self, page: int = 1, limit: int = 10, 
             min_price: Optional[float] = None, max_price: Optional[float] = None, 
             min_area: Optional[float] = None, max_area: Optional[float] = None,
             property_type: Optional[str] = None, transaction_type: Optional[str] = None,
             province: Optional[str] = None, district: Optional[str] = None, ward: Optional[str] = None,
             min_bedrooms: Optional[int] = None, min_bathrooms: Optional[int] = None,
             center_lat: Optional[float] = None, center_lng: Optional[float] = None,
             radius: Optional[int] = None, bounds: Optional[str] = None) -> Dict:
        """
        Search for rental properties with various filters
        
        Args:
            page: Page number for pagination
            limit: Number of items per page
            min_price: Minimum price in millions VND
            max_price: Maximum price in millions VND
            min_area: Minimum area in square meters
            max_area: Maximum area in square meters
            property_type: Type of property (room, apartment, house, etc.)
            transaction_type: Type of transaction (rent, buy)
            province: Province/City name
            district: District name
            ward: Ward name
            min_bedrooms: Minimum number of bedrooms
            min_bathrooms: Minimum number of bathrooms
            center_lat: Center latitude for radius search
            center_lng: Center longitude for radius search
            radius: Radius for location search in kilometers
            bounds: Boundary coordinates for area search [minLat, minLng, maxLat, maxLng]
            
        Returns:
            Dict: Search results with properties and pagination info
        """
        try:
            # Build query parameters - follow API DTO format exactly
            params = {}
            
            # Basic pagination parameters
            params["page"] = int(page) if page is not None else 1
            params["limit"] = int(limit) if limit is not None else 10
            
            # Normalize and format input parameters
            if district is not None:
                normalized_district = self._normalize_district(district)
                print(f"[DEBUG] Normalized district: '{district}' -> '{normalized_district}'")
                district = normalized_district
                
            if property_type is not None:
                formatted_property_type = self._format_property_type(property_type)
                print(f"[DEBUG] Formatted property_type: '{property_type}' -> '{formatted_property_type}'")
                property_type = formatted_property_type
                
            if transaction_type is not None:
                formatted_transaction_type = self._format_transaction_type(transaction_type)
                print(f"[DEBUG] Formatted transaction_type: '{transaction_type}' -> '{formatted_transaction_type}'")
                transaction_type = formatted_transaction_type
            
            # Add optional parameters if provided - strictly follow GetPostsDto format
            if property_type is not None:
                params["propertyType"] = property_type
            if transaction_type is not None:
                params["transactionType"] = transaction_type
            if min_price is not None:
                params["minPrice"] = float(min_price)
            if max_price is not None:
                params["maxPrice"] = float(max_price)
            if min_area is not None:
                params["minArea"] = float(min_area)
            if max_area is not None:
                params["maxArea"] = float(max_area)
            if province is not None:
                params["province"] = province
            if district is not None:
                params["district"] = district
            if ward is not None:
                params["ward"] = ward
            if min_bedrooms is not None:
                params["minBedrooms"] = int(min_bedrooms)
            if min_bathrooms is not None:
                params["minBathrooms"] = int(min_bathrooms)
            if center_lat is not None:
                params["centerLat"] = float(center_lat)
            if center_lng is not None:
                params["centerLng"] = float(center_lng)
            if radius is not None:
                params["radius"] = int(radius)
            if bounds is not None:
                params["bounds"] = bounds
            
            # Print API call information
            print(f"\n[DEBUG] SearchPostsTool making API call:")
            print(f"[DEBUG] URL: http://localhost:8080/api/posts")
            print(f"[DEBUG] Params: {params}")
            
            # Build full URL for display
            param_strings = [f"{key}={value}" for key, value in params.items()]
            full_url = f"http://localhost:8080/api/posts?{'&'.join(param_strings)}"
            print(f"[DEBUG] Full URL: {full_url}")
            
            # Use a session with the debugging adapter to capture and print request details
            session = requests.Session()
            session.mount('http://', DebuggingAdapter())
            session.mount('https://', DebuggingAdapter())
                
            # Make API call using the session
            response = session.get(
                "http://localhost:8080/api/posts",
                params=params
            )
            
            # Print response details
            print(f"\n[DEBUG] ============ RESPONSE DETAILS ============")
            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response headers: {json.dumps(dict(response.headers), indent=2)}")
            print(f"[DEBUG] Response URL: {response.url}")  # This shows the final URL after any redirects
            try:
                print(f"[DEBUG] Response content summary (first 500 chars): {response.text[:500]}...")
            except:
                print(f"[DEBUG] Could not print response content")
            print(f"[DEBUG] ============================================")
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "error": f"API call failed with status code {response.status_code}",
                    "details": response.text
                }
            
            # Print response success
            print(f"[DEBUG] API call successful: Status {response.status_code}")
            
            # Parse response
            response_data = response.json()
            print(f"[DEBUG] Response data: {response_data}")


            # Format response for easier consumption by the AI
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                pagination = response_data["data"].get("pagination", {})
                
                # Generate a summary for the AI to use
                property_types = set(p.get("propertyType", "") for p in properties if p.get("propertyType"))
                price_range = f"{min(p.get('price', float('inf')) for p in properties if p.get('price'))} - {max(p.get('price', 0) for p in properties if p.get('price'))} triệu VND" if properties else "N/A"
                districts = set(p.get("district", "") for p in properties if p.get("district"))
                
                summary = f"""Tìm thấy {len(properties)} bất động sản phù hợp với tiêu chí.
                Loại bất động sản: {', '.join(property_types) or 'Đa dạng'}
                Khoảng giá: {price_range}
                Khu vực: {', '.join(districts) or 'Đa dạng'}
                """
                
                return {
                    "success": True,
                    "summary": summary,
                    "properties": properties,
                    "pagination": pagination,
                    "total_found": len(properties)
                }
            
            # Return original response if structure is different
            return {
                "success": True,
                "response": response_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error searching posts: {str(e)}"
            }
            
    async def _arun(self, page: int = 1, limit: int = 10, 
                   min_price: Optional[float] = None, max_price: Optional[float] = None, 
                   min_area: Optional[float] = None, max_area: Optional[float] = None,
                   property_type: Optional[str] = None, transaction_type: Optional[str] = None,
                   province: Optional[str] = None, district: Optional[str] = None, ward: Optional[str] = None,
                   min_bedrooms: Optional[int] = None, min_bathrooms: Optional[int] = None,
                   center_lat: Optional[float] = None, center_lng: Optional[float] = None,
                   radius: Optional[int] = None, bounds: Optional[str] = None) -> Dict:
        """Async implementation of _run"""
        return self._run(page, limit, min_price, max_price, min_area, max_area,
                       property_type, transaction_type, province, district, ward,
                       min_bedrooms, min_bathrooms, center_lat, center_lng, radius, bounds) 