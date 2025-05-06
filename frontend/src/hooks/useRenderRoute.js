import calculateBoundsForRoute from "@/utils/getRouteBoundary";
import polyline from "@mapbox/polyline";
import { useEffect } from "react";
import goongJs from "@goongmaps/goong-js";

export default function useRenderRoute(mapInstance, originCoord, destinationCoord, onRouteComplete) {
  useEffect(() => {
    // Make sure map exists
    if (!mapInstance) return;

    try {
      // Only continue with route operations if the map is in a state to handle them
      const safelyRemoveLayer = () => {
        try {
          if (mapInstance.getLayer && mapInstance.getLayer("route-layer")) {
            mapInstance.removeLayer("route-layer");
          }
        } catch (e) {
          console.log("Could not remove layer:", e);
        }
      };

      const safelyRemoveSource = () => {
        try {
          if (mapInstance.getSource && mapInstance.getSource("route")) {
            safelyRemoveLayer(); // Remove layer first
            mapInstance.removeSource("route");
          }
        } catch (e) {
          console.log("Could not remove source:", e);
        }
      };
      
      const safelyRemovePopup = () => {
        try {
          // Remove existing route popup if it exists
          const existingPopup = document.querySelector('.route-info-popup');
          if (existingPopup) {
            existingPopup.remove();
          }
        } catch (e) {
          console.log("Could not remove existing popup:", e);
        }
      };

      // Clear existing route when no destination is selected
      if (!destinationCoord || destinationCoord === "") {
        safelyRemoveSource();
        safelyRemovePopup();
        if (onRouteComplete) onRouteComplete(null);
        return;
      }

      // Don't proceed if origin is missing
      if (!originCoord) {
        if (onRouteComplete) onRouteComplete(null);
        return;
      }

      console.log("originCoord:", originCoord);
      console.log("destinationCoord:", destinationCoord);
      
      const getRouteData = async () => {
        const url = `/api/direction?origin=${originCoord}&destination=${destinationCoord}&vehicle=bike`;
        const res = await fetch(url);
        return await res.json();
      };

      getRouteData()
        .then((data) => {
          if (!data || !data.routes || !data.routes[0]) {
            console.error("Invalid route data received");
            if (onRouteComplete) onRouteComplete(null);
            return;
          }
          
          console.log(data);
          const route = data.routes[0];
          const polylineStr = route.overview_polyline.points;
          const decoded = polyline.decode(polylineStr);

          // Get origin and destination points
          const origParts = originCoord.split(',').map(parseFloat);
          const destParts = destinationCoord.split(',').map(parseFloat);
          
          // Create new bounds object to encompass the route
          const newBounds = new goongJs.LngLatBounds();
          
          // Add all route points to bounds
          decoded.forEach(point => {
            newBounds.extend([point[1], point[0]]);
          });
          
          // Ensure origin and destination are included with extra margin
          if (origParts.length >= 2) {
            newBounds.extend([origParts[1], origParts[0]]);
          }
          
          if (destParts.length >= 2) {
            newBounds.extend([destParts[1], destParts[0]]);
          }

          // Clean up existing layers and sources first
          safelyRemoveSource();
          safelyRemovePopup();

          // Add new source and layer
          mapInstance.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: decoded.map((point) => [point[1], point[0]]),
              },
            },
          });

          mapInstance.addLayer({
            id: "route-layer",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#4285F4",
              "line-width": 6,
              "line-opacity": 0.7,
            },
          });
          
          // Create popup with distance and duration info
          if (route.legs && route.legs[0]) {
            const distanceKm = (route.legs[0].distance.value / 1000).toFixed(1);
            const durationMins = Math.round(route.legs[0].duration.value / 60);
            
            const popup = new goongJs.Popup({ 
              closeButton: false, 
              closeOnClick: false,
              className: 'route-info-popup'
            })
              .setLngLat([destParts[1], destParts[0]])
              .setHTML(`
                <div style="font-family: Arial, sans-serif; padding: 8px; border-radius: 6px; min-width: 150px;">
                  <strong>Distance:</strong> ${distanceKm} km<br>
                  <strong>Duration:</strong> ${durationMins} mins
                </div>
              `)
              .addTo(mapInstance);
          }
          
          // Use a small timeout to ensure popup content has rendered
          setTimeout(() => {
            try {
              // First zoom out to see the whole route
              mapInstance.fitBounds(newBounds, {
                padding: { top: 100, bottom: 100, left: 100, right: 100 },
                maxZoom: 16,
                duration: 800,
                linear: false 
              });
              
              // Force maximum padding on smaller screens to ensure visibility
              setTimeout(() => {
                // Ensure we're not too zoomed in
                const currentZoom = mapInstance.getZoom();
                if (currentZoom > 15) {
                  mapInstance.easeTo({
                    zoom: 14,
                    duration: 500
                  });
                }
                
                // Call the callback when route is complete
                if (onRouteComplete) onRouteComplete(data);
              }, 900);
            } catch (error) {
              console.error("Error adjusting map view:", error);
              // Fallback to simple zoom out
              try {
                mapInstance.easeTo({
                  zoom: 14,
                  duration: 600
                });
                
                // Still call the callback with data
                if (onRouteComplete) onRouteComplete(data);
              } catch (e) {
                console.error("Fallback zoom failed:", e);
                if (onRouteComplete) onRouteComplete(data);
              }
            }
          }, 400);
        })
        .catch((error) => {
          console.error("Route data fetch error:", error);
          if (onRouteComplete) onRouteComplete(null);
        });
    } catch (error) {
      console.error("Error in useRenderRoute:", error);
      if (onRouteComplete) onRouteComplete(null);
    }
  }, [mapInstance, originCoord, destinationCoord, onRouteComplete]);
}
