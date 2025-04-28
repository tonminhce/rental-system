import goongJs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

const PostMap = ({ coordinates, address }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const searchParams = useSearchParams();

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  
  const mapCoordinates = coordinates
    ? [coordinates[1], coordinates[0]] 
    : (lat && lng)
      ? [parseFloat(lat), parseFloat(lng)]: [106.660172, 10.762622];

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize Goong Maps
    goongJs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;
    
    // Create map instance
    const map = new goongJs.Map({
      container: mapContainerRef.current,
      style: "https://tiles.goong.io/assets/goong_light_v2.json",
      zoom: 15,
      center: mapCoordinates
    });
    
    // Add marker for property location
    new goongJs.Marker()
      .setLngLat(mapCoordinates)
      .addTo(map);
    
    mapRef.current = map;
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [mapCoordinates]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: "100%", height: "300px", borderRadius: "4px" }}
    />
  );
};

export default PostMap; 