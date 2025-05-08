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
import os
from urllib.parse import quote

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
    page: Optional[int] = Field(default=1, description="Page number for pagination")

class ShowPropertiesTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "show_properties"
    description: Annotated[str, Field(description="Tool description")] = """
    Show an overview of available properties.
    Use this tool when users want to:
    - See all available properties
    - Get a general overview of properties
    - View property listings without specific filters
    - Show more properties by specifying a page number greater than 1
    
    When users ask to "show more properties", increment the page parameter.
    """
    args_schema: type[BaseModel] = ShowPropertiesInput

    def format_property_display(self, property_data):
        """Format a single property for display"""
        # Get only the first image to save tokens
        images = property_data.get('images', [{'url': 'Chưa có hình ảnh'}])
        first_image = images[0] if images else {'url': 'Chưa có hình ảnh'}
        
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
            "images": first_image
        }

    def _run(self, query: str = "", page: int = 1) -> Dict:
        try:
            print(f"\n[DEBUG] ShowPropertiesTool making API call (page: {page})")
            
            params = {
                "page": page,
                "limit": 10, 
                "status": "active" 
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
                # Get properties from current page
                available_properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(available_properties)} properties on page {page} via API")
                
                # Get pagination info
                pagination = response_data["data"].get("pagination", {})
                total_records = pagination.get("total_records", len(available_properties))
                current_page = pagination.get("current_page", page)
                total_pages = pagination.get("total_pages", 1)
                
                print(f"[DEBUG] Pagination info: total_records={total_records}, current_page={current_page}, total_pages={total_pages}")
                
                if not available_properties:
                    return {
                        "error": "No properties found",
                        "total_available": 0,
                        "properties": [],
                        "pagination": pagination
                    }
                
                # Format all properties
                formatted_properties = [
                    self.format_property_display(prop) 
                    for prop in available_properties
                ]
                
                # Create overview text reflecting total count
                overview = f"""Found {total_records} available properties (showing page {current_page} of {total_pages}):\n\n"""
                
                # Return properties with pagination info
                return {
                    "total_available": total_records,
                    "properties_on_page": len(available_properties),
                    "formatted_properties": formatted_properties,
                    "overview": overview,
                    "pagination": {
                        "current_page": current_page,
                        "total_pages": total_pages,
                        "has_more": current_page < total_pages
                    }
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
    page: Optional[int] = Field(default=1, description="Page number for pagination")

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
    - Show more properties by specifying a page number greater than 1
    
    Example districts: Quận 1, Bình Thạnh, Thủ Đức
    """
    args_schema: type[BaseModel] = CheckPropertiesDistrictInput

    def format_property(self, prop: Dict) -> Dict:
        """Format a single property for display"""
        # Get only the first image to save tokens
        images = prop.get('images', [{'url': 'No image available'}])
        first_image = images[0] if images else {'url': 'No image available'}
        
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
            "images": first_image,  # Only include the first image to save tokens
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

    def _run(self, district: str, page: int = 1) -> Dict:
        print(f"\n[DEBUG] CheckPropertiesDistrictTool called with district: {district}, page: {page}")
        
        # Normalize district parameter
        normalized_district = self._normalize_district(district)
        print(f"[DEBUG] Normalized district: '{district}' -> '{normalized_district}'")
        
        try:
            # Using API instead of direct database access
            # Build query parameters - using district as filter
            params = {
                "page": page,
                "limit": 10,  # Get more items to show comprehensive results
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
                print(f"[DEBUG] Found {len(properties)} properties on page {page} for district {district} via API")
                
                # Get pagination info
                pagination = response_data["data"].get("pagination", {})
                total_records = pagination.get("total_records", len(properties))
                current_page = pagination.get("current_page", page)
                total_pages = pagination.get("total_pages", 1)
                
                print(f"[DEBUG] Pagination info: total_records={total_records}, current_page={current_page}, total_pages={total_pages}")
                
                # Format each property
                formatted_properties = [self.format_property(prop) for prop in properties]
                
                return {
                    "district": district,
                    "district_normalized": normalized_district,
                    "total_found": total_records,
                    "properties_on_page": len(formatted_properties),
                    "properties": formatted_properties,
                    "pagination": {
                        "current_page": current_page,
                        "total_pages": total_pages,
                        "has_more": current_page < total_pages
                    }
                }
            else:
                return {
                    "district": district,
                    "district_normalized": normalized_district,
                    "total_found": 0,
                    "properties": [],
                    "error": "No properties found or unexpected API response format"
                }
                
        except Exception as e:
            print(f"[DEBUG] Error in CheckPropertiesDistrictTool: {str(e)}")
            return {
                "district": district,
                "district_normalized": normalized_district,
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
            
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                print(f"[DEBUG] Found {len(properties)} properties in price range {min_price}-{max_price} million via API")
                
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

class LocationCheckingInput(BaseModel):
    landmark_type: str = Field(
        default="tsn_main",
        description="Type of landmark to check distance from. Options: tsn_main, tsn_domestic, tsn_international"
    )

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

def get_properties_with_filters(query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Get properties with filters from the rental service
    
    Args:
        query_params (Dict[str, Any]): Query parameters for filtering properties
        
    Returns:
        List[Dict[str, Any]]: List of properties matching the filters
    """
    try:
        print("\n==== GET_PROPERTIES_WITH_FILTERS CALLED ====")
        print(f"Filter parameters: {json.dumps(query_params, indent=2)}")
        print("========================================\n")
        
        # Convert query parameters to URL query string
        query_string = "?" + "&".join([f"{k}={v}" for k, v in query_params.items() if v is not None])
        
        # Make request to rental service
        response = requests.get(f"{RENTAL_SERVICE_URL}/posts{query_string}")
        response.raise_for_status()
        
        # Parse response
        data = response.json()
        
        # Print the results
        properties = data.get("data", {}).get("posts", [])
        print(f"Found {len(properties)} properties with filters")
        
        return properties
    except Exception as e:
        print(f"Error getting properties with filters: {str(e)}")
        return []

RENTAL_SERVICE_URL = "http://localhost:8080/api"

class FilteredPropertySearchInput(BaseModel):
    max_price_constraint: Optional[float] = Field(default=None, description="Maximum price constraint in millions VND")
    min_bedrooms: Optional[int] = Field(default=None, description="Minimum number of bedrooms required")
    min_bathrooms: Optional[int] = Field(default=None, description="Minimum number of bathrooms required")
    page: Optional[int] = Field(default=1, description="Page number for pagination")

# Global context for sharing data between tools and AI service
GLOBAL_CONTEXT = {}

class FilteredPropertySearchTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "filtered_property_search"
    description: Annotated[str, Field(description="Tool description")] = """
    Search for properties based on the user's current filter selection plus additional constraints.
    
    This tool uses the current filter parameters from the frontend (location, price range, etc.)
    and allows adding additional constraints like maximum price, min bedrooms, etc.
    
    Use this tool when:
    - The user asks to find properties based on "current selection" or "current filters"
    - The user wants to add constraints to their current search (e.g., "below 5 million")
    - The user refers to properties in their current location/area view
    
    The tool combines the frontend filters with the additional constraints specified.
    """
    args_schema: type[BaseModel] = FilteredPropertySearchInput
    
    def format_property(self, prop: Dict) -> Dict:
        """Format a single property for display"""
        # Get only the first image to save tokens
        images = prop.get('images', [{'url': 'No image available'}])
        first_image = images[0] if images else {'url': 'No image available'}
        
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
            "images": first_image,  # Only include the first image to save tokens
            "address": prop.get('displayedAddress', 'Not specified'),
        }
    
    def _run(self, 
             max_price_constraint: Optional[float] = None,
             min_bedrooms: Optional[int] = None, 
             min_bathrooms: Optional[int] = None,
             page: int = 1) -> Dict:
        """
        Search for properties using the current filter parameters plus additional constraints
        
        Args:
            max_price_constraint: Maximum price in millions VND (overrides the current filter if lower)
            min_bedrooms: Minimum number of bedrooms required
            min_bathrooms: Minimum number of bathrooms required
            page: Page number for pagination
            
        Returns:
            Dict: Search results with properties matching all criteria
        """
        print(f"\n[DEBUG] FilteredPropertySearchTool called with constraints:")
        print(f"[DEBUG] max_price_constraint: {max_price_constraint}")
        print(f"[DEBUG] min_bedrooms: {min_bedrooms}")
        print(f"[DEBUG] min_bathrooms: {min_bathrooms}")
        print(f"[DEBUG] page: {page}")
        
        try:
            # Get the current filter parameters from the global context
            current_filters = {}
            
            if GLOBAL_CONTEXT and "query_params" in GLOBAL_CONTEXT:
                current_filters = GLOBAL_CONTEXT["query_params"]
                print(f"[DEBUG] Current filters from frontend: {json.dumps(current_filters, indent=2)}")
            else:
                print("[DEBUG] No current filters found from frontend")
            
            # Create a combined filter with both current filters and new constraints
            combined_filters = dict(current_filters)
            
            # Handle pagination
            combined_filters["page"] = page
            combined_filters["limit"] = 10
            
            # Apply max price constraint if provided (and more restrictive than current)
            if max_price_constraint is not None:
                current_max_price = float(combined_filters.get("maxPrice", float('inf')))
                # Use the more restrictive of the two max prices
                if max_price_constraint < current_max_price or current_max_price == float('inf'):
                    combined_filters["maxPrice"] = max_price_constraint
                print(f"[DEBUG] Applied max price constraint: {combined_filters.get('maxPrice')}")
            
            # Apply bedroom/bathroom constraints if provided
            if min_bedrooms is not None:
                combined_filters["minBedrooms"] = min_bedrooms
                print(f"[DEBUG] Applied min bedrooms constraint: {min_bedrooms}")
            
            if min_bathrooms is not None:
                combined_filters["minBathrooms"] = min_bathrooms
                print(f"[DEBUG] Applied min bathrooms constraint: {min_bathrooms}")
            
            # Print the final combined filters
            print(f"[DEBUG] Final combined filters: {json.dumps(combined_filters, indent=2)}")
            
            # Make the API request with the combined filters
            response = requests.get(
                f"{RENTAL_SERVICE_URL}/posts", 
                params=combined_filters
            )
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "success": False,
                    "error": f"API call failed with status code {response.status_code}",
                    "properties": [],
                    "filters_used": combined_filters  # Include the used filters in the response
                }
            
            # Process the response
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                pagination = response_data["data"].get("pagination", {})
                total_records = pagination.get("total_records", len(properties))
                total_pages = pagination.get("total_pages", 1)
                
                print(f"[DEBUG] Found {len(properties)} properties on page {page} of {total_pages}")
                print(f"[DEBUG] Total records: {total_records}")
                
                # Format the properties
                formatted_properties = [self.format_property(prop) for prop in properties]
                
                # Generate a summary of the results
                price_ranges = set()
                districts = set()
                
                for prop in properties:
                    if prop.get("price"):
                        price_ranges.add(float(prop.get("price")))
                    if prop.get("district"):
                        districts.add(prop.get("district"))
                
                min_price = min(price_ranges) if price_ranges else "N/A"
                max_price = max(price_ranges) if price_ranges else "N/A"
                
                # List of unique property types
                property_types = set(p.get("propertyType", "") for p in properties if p.get("propertyType"))
                
                summary = {
                    "price_range": f"{min_price} - {max_price} million VND",
                    "districts": list(districts),
                    "property_types": list(property_types),
                    "total_found": total_records,
                    "page_info": f"Page {page} of {total_pages}"
                }
                
                return {
                    "success": True,
                    "properties": formatted_properties,
                    "summary": summary,
                    "pagination": {
                        "current_page": page,
                        "total_pages": total_pages,
                        "total_records": total_records,
                        "has_more": page < total_pages
                    },
                    "filters_used": combined_filters  # Include the used filters in the response
                }
            else:
                return {
                    "success": False,
                    "error": "Unexpected API response format",
                    "properties": [],
                    "filters_used": combined_filters  # Include the used filters in the response
                }
        except Exception as e:
            print(f"[DEBUG] Error in FilteredPropertySearchTool: {str(e)}")
            return {
                "success": False,
                "error": f"Error: {str(e)}",
                "properties": [],
                "filters_used": {"maxPrice": max_price_constraint} if max_price_constraint is not None else {}
            }

class NearbyLocationSearchInput(BaseModel):
    location_name: str = Field(..., description="Name of the location to search for properties nearby")
    radius: Optional[int] = Field(default=2, description="Search radius in kilometers")
    max_price: Optional[float] = Field(default=None, description="Maximum price in millions VND")
    min_price: Optional[float] = Field(default=None, description="Minimum price in millions VND")
    page: Optional[int] = Field(default=1, description="Page number for pagination")
    property_type: Optional[str] = Field(default=None, description="Type of property (room, apartment, house, etc.)")

class NearbyLocationSearchTool(BaseTool):
    name: Annotated[str, Field(description="Tool name")] = "nearby_location_search"
    description: Annotated[str, Field(description="Tool description")] = """
    Search for properties near a specific location by name.
    
    This tool will:
    1. Search for a location using its name
    2. Get the coordinates of that location
    3. Find properties within the specified radius of that location
    
    Use this tool when users ask for properties:
    - Near a specific place (e.g. "near CMC Creative Space")
    - Close to an address or landmark
    - Within walking distance of a location
    - In the vicinity/area of a place
    
    Parameters:
    - location_name: Name of the place to search near (e.g. "CMC Creative Space", "Landmark 81")
    - radius: Search radius in kilometers (default: 2)
    - max_price: Maximum price filter (optional)
    - min_price: Minimum price filter (optional)
    - page: Page number for pagination
    - property_type: Type of property filter (optional)
    """
    args_schema: type[BaseModel] = NearbyLocationSearchInput
    
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
            "image": prop.get('images', [{'url': 'No image available'}])[0],  # Only include the first image to save tokens
            "address": prop.get('displayedAddress', 'Not specified'),
        }
    
    def _run(self, 
             location_name: str,
             radius: int = 2,
             max_price: Optional[float] = None,
             min_price: Optional[float] = None,
             page: int = 1,
             property_type: Optional[str] = None) -> Dict:
        """
        Search for properties near a specific location
        
        Args:
            location_name: Name of the place to search near
            radius: Search radius in kilometers
            max_price: Maximum price filter (optional)
            min_price: Minimum price filter (optional)
            page: Page number for pagination
            property_type: Type of property filter (optional)
            
        Returns:
            Dict: Search results with properties near the specified location
        """
        # Goong API key - should be set in an environment variable
        goong_api_key = os.getenv("GOONG_API_KEY", "JHIeym2SpVnWISoW6ZfalFvRibdkYfpzRRCwQ1nG")
        
        print(f"\n[DEBUG] NearbyLocationSearchTool called with location: {location_name}")
        print(f"[DEBUG] Search radius: {radius} km")
        
        try:
            # Step 1: Call Goong Autocomplete API to get place_id
            encoded_location = quote(location_name)
            autocomplete_url = f"https://rsapi.goong.io/Place/AutoComplete?input={encoded_location}&api_key={goong_api_key}"
            
            print(f"[DEBUG] Calling Goong Autocomplete API: {autocomplete_url}")
            
            autocomplete_response = requests.get(autocomplete_url)
            if autocomplete_response.status_code != 200:
                print(f"[DEBUG] Autocomplete API call failed: {autocomplete_response.status_code}")
                return {
                    "success": False,
                    "error": f"Autocomplete API call failed: {autocomplete_response.status_code}",
                    "properties": []
                }
            
            autocomplete_data = autocomplete_response.json()
            if not autocomplete_data.get("predictions"):
                print(f"[DEBUG] No locations found for '{location_name}'")
                return {
                    "success": False,
                    "error": f"No locations found for '{location_name}'",
                    "properties": []
                }
            
            # Get the first prediction's place_id
            place_id = autocomplete_data["predictions"][0].get("place_id")
            matched_location = autocomplete_data["predictions"][0].get("description", location_name)
            print(f"[DEBUG] Found place_id: {place_id}")
            print(f"[DEBUG] Matched location: {matched_location}")
            
            # Step 2: Call Goong Geocode API to get coordinates
            geocode_url = f"https://rsapi.goong.io/geocode?place_id={place_id}&api_key={goong_api_key}"
            
            print(f"[DEBUG] Calling Goong Geocode API")
            
            geocode_response = requests.get(geocode_url)
            if geocode_response.status_code != 200:
                print(f"[DEBUG] Geocode API call failed: {geocode_response.status_code}")
                return {
                    "success": False,
                    "error": f"Geocode API call failed: {geocode_response.status_code}",
                    "properties": []
                }
            
            geocode_data = geocode_response.json()
            if not geocode_data.get("results"):
                print(f"[DEBUG] No geocode results found")
                return {
                    "success": False,
                    "error": "No geocode results found",
                    "properties": []
                }
            
            # Extract lat and lng from the first result
            location = geocode_data["results"][0].get("geometry", {}).get("location", {})
            lat = location.get("lat")
            lng = location.get("lng")
            
            if not lat or not lng:
                print(f"[DEBUG] No coordinates found in geocode response")
                return {
                    "success": False,
                    "error": "No coordinates found in geocode response",
                    "properties": []
                }
            
            print(f"[DEBUG] Location coordinates: lat={lat}, lng={lng}")
            
            # Step 3: Search for properties near these coordinates
            # Build query parameters
            params = {
                "page": page,
                "limit": 10,
                "centerLat": lat,
                "centerLng": lng,
                "radius": radius,
                "status": "active"
            }
            
            # Add optional filters if provided
            if max_price is not None:
                params["maxPrice"] = max_price
            
            if min_price is not None:
                params["minPrice"] = min_price
            
            if property_type is not None:
                params["propertyType"] = property_type
            
            print(f"[DEBUG] Searching for properties with params: {params}")
            
            # Make the API call to the rental service
            response = requests.get(f"{RENTAL_SERVICE_URL}/posts", params=params)
            
            if response.status_code != 200:
                print(f"[DEBUG] API call failed with status code {response.status_code}: {response.text}")
                return {
                    "success": False,
                    "error": f"API call failed with status code {response.status_code}",
                    "location_name": matched_location,
                    "coordinates": {"lat": lat, "lng": lng},
                    "properties": []
                }
            
            response_data = response.json()
            
            if "data" in response_data and "data" in response_data["data"]:
                properties = response_data["data"]["data"]
                pagination = response_data["data"].get("pagination", {})
                total_records = pagination.get("total_records", len(properties))
                total_pages = pagination.get("total_pages", 1)
                
                print(f"[DEBUG] Found {len(properties)} properties near {matched_location}")
                
                formatted_properties = [self.format_property(prop) for prop in properties]
                
                for i, prop in enumerate(formatted_properties):
                    if "coordinates" in properties[i]:
                        prop_lat = properties[i]["coordinates"].get("latitude")
                        prop_lng = properties[i]["coordinates"].get("longitude")
                        if prop_lat and prop_lng:
                            from math import radians, cos, sin, asin, sqrt
                            
                            def haversine(lat1, lon1, lat2, lon2):
                                # Convert decimal degrees to radians
                                lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
                                
                                # Haversine formula
                                dlon = lon2 - lon1
                                dlat = lat2 - lat1
                                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                                c = 2 * asin(sqrt(a))
                                r = 6371  
                                return round(c * r, 2)
                            
                            distance = haversine(lat, lng, prop_lat, prop_lng)
                            prop["distance_km"] = distance
                
                # Sort properties by distance if distance is available
                formatted_properties = sorted(
                    formatted_properties,
                    key=lambda x: x.get("distance_km", float('inf'))
                )
                
                return {
                    "success": True,
                    "location_name": matched_location,
                    "coordinates": {"lat": lat, "lng": lng},
                    "search_radius_km": radius,
                    "properties": formatted_properties,
                    "total_found": total_records,
                    "pagination": {
                        "current_page": page,
                        "total_pages": total_pages,
                        "has_more": page < total_pages
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "Unexpected API response format",
                    "location_name": matched_location,
                    "coordinates": {"lat": lat, "lng": lng},
                    "properties": []
                }
        
        except Exception as e:
            print(f"[DEBUG] Error in NearbyLocationSearchTool: {str(e)}")
            return {
                "success": False,
                "error": f"Error: {str(e)}",
                "properties": []
            }