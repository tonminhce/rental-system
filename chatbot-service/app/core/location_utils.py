import math
from typing import Tuple, Dict, Optional
from dataclasses import dataclass

@dataclass
class Landmark:
    name: str
    lat: float
    lon: float
    address: str

class LocationUtils:
    # HCMC coordinate bounds
    HCMC_BOUNDS = {
        "lat_min": 10.3,  # Can Gio
        "lat_max": 11.1,  # Cu Chi
        "lon_min": 106.2, # Cu Chi
        "lon_max": 107.1  # Can Gio
    }

    # Key landmarks
    LANDMARKS = {
        "tsn_main": Landmark(
            "Sân bay Tân Sơn Nhất (Nhà ga chính)",
            10.818663,
            106.654835,
            "Sân bay Tân Sơn Nhất, P.2, Q.Tân Bình"
        ),
        "tsn_domestic": Landmark(
            "Sân bay Tân Sơn Nhất (Nhà ga trong nước)",
            10.812025,
            106.664376,
            "Nhà ga trong nước, Sân bay TSN"
        ),
        "tsn_international": Landmark(
            "Sân bay Tân Sơn Nhất (Nhà ga quốc tế)",
            10.819234,
            106.656829,
            "Nhà ga quốc tế, Sân bay TSN"
        )
    }

    # Distance categories (in km)
    DISTANCE_CATEGORIES = {
        "very_close": 0.5,
        "close": 1.0,
        "walkable": 2.0,
        "nearby": 5.0
    }

    # Travel speeds (km/h)
    TRAVEL_SPEEDS = {
        "walking": 5.0,
        "motorbike_peak": 25.0,
        "motorbike_offpeak": 35.0,
        "car_peak": 20.0,
        "car_offpeak": 30.0
    }

    @staticmethod
    def validate_coordinates(lat: float, lon: float) -> bool:
        """
        Validate if coordinates are within HCMC bounds
        """
        try:
            lat = float(lat)
            lon = float(lon)
            
            # Basic range check
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                return False
                
            # HCMC specific check
            return (LocationUtils.HCMC_BOUNDS["lat_min"] <= lat <= LocationUtils.HCMC_BOUNDS["lat_max"] and
                    LocationUtils.HCMC_BOUNDS["lon_min"] <= lon <= LocationUtils.HCMC_BOUNDS["lon_max"])
        except:
            return False

    @staticmethod
    def fix_coordinates(lat: str, lon: str) -> Tuple[float, float]:
        """
        Fix common coordinate format issues
        """
        try:
            lat = float(lat)
            lon = float(lon)
            
            # Handle missing decimal points
            if abs(lat) > 90:
                lat = lat / 1000000 if abs(lat) > 1000000 else lat / 1000
            if abs(lon) > 180:
                lon = lon / 1000000 if abs(lon) > 1000000 else lon / 1000
                
            # Handle swapped coordinates in HCMC region
            if (106.2 <= lat <= 107.1) and (10.3 <= lon <= 11.1):
                return (lon, lat)
            
            return (lat, lon)
        except:
            return (0, 0)  # Return origin if parsing fails

    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance using Haversine formula with Vietnam-specific Earth radius
        """
        # Earth radius at HCMC latitude
        R = 6378.137 - 21.385 * math.sin(math.radians(10.8))
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return round(R * c, 2)

    @staticmethod
    def get_distance_category(distance: float) -> str:
        """
        Get the category for a given distance
        """
        if distance < LocationUtils.DISTANCE_CATEGORIES["very_close"]:
            return "very_close"
        elif distance < LocationUtils.DISTANCE_CATEGORIES["close"]:
            return "close"
        elif distance < LocationUtils.DISTANCE_CATEGORIES["walkable"]:
            return "walkable"
        elif distance < LocationUtils.DISTANCE_CATEGORIES["nearby"]:
            return "nearby"
        else:
            return "far"

    @staticmethod
    def calculate_travel_times(distance: float) -> Dict[str, int]:
        """
        Calculate travel times for different modes of transport
        """
        return {
            "walking": round(distance / LocationUtils.TRAVEL_SPEEDS["walking"] * 60),
            "motorbike_peak": round(distance / LocationUtils.TRAVEL_SPEEDS["motorbike_peak"] * 60),
            "motorbike_offpeak": round(distance / LocationUtils.TRAVEL_SPEEDS["motorbike_offpeak"] * 60),
            "car_peak": round(distance / LocationUtils.TRAVEL_SPEEDS["car_peak"] * 60),
            "car_offpeak": round(distance / LocationUtils.TRAVEL_SPEEDS["car_offpeak"] * 60)
        }

    @staticmethod
    def format_distance_info(distance: float) -> Dict:
        """
        Format distance information including category and travel times
        """
        category = LocationUtils.get_distance_category(distance)
        travel_times = LocationUtils.calculate_travel_times(distance)
        
        return {
            "distance_km": distance,
            "category": category,
            "formatted": f"{distance:.2f}km",
            "travel_times": travel_times
        }

    @staticmethod
    def get_nearest_landmark(lat: float, lon: float, landmark_type: str = "tsn_main") -> Optional[Dict]:
        """
        Get the nearest landmark of specified type and its distance
        """
        if landmark_type not in LocationUtils.LANDMARKS:
            return None
            
        landmark = LocationUtils.LANDMARKS[landmark_type]
        distance = LocationUtils.calculate_distance(lat, lon, landmark.lat, landmark.lon)
        
        return {
            "landmark": landmark,
            "distance_info": LocationUtils.format_distance_info(distance)
        } 