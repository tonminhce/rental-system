import polyline from "@mapbox/polyline";
import { useEffect } from "react";
import goongJs from "@goongmaps/goong-js";

export default function useRenderRoute(mapInstance, originCoord, destinationCoord, onRouteComplete) {
  useEffect(() => {
    if (!mapInstance) return;

    try {
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
            safelyRemoveLayer();
            mapInstance.removeSource("route");
          }
        } catch (e) {
          console.log("Could not remove source:", e);
        }
      };
      
      const safelyRemovePopup = () => {
        try {
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
            
            // Calculate middle point of the route
            const middleIndex = Math.floor(decoded.length / 2);
            const middlePoint = decoded[middleIndex];
            
            const popup = new goongJs.Popup({ 
              closeButton: true, 
              closeOnClick: false,
              className: 'route-info-popup',
              maxWidth: '200px'
            })
              .setLngLat([middlePoint[1], middlePoint[0]])
              .setHTML(`
                <div style="font-family: Arial, sans-serif; padding: 8px; border-radius: 6px; min-width: 150px;">
                  <strong>Distance:</strong> ${distanceKm} km<br>
                  <strong>Duration:</strong> ${durationMins} mins
                </div>
              `)
              .addTo(mapInstance);
          }
          
          try {
            mapInstance.fitBounds(newBounds, {
              padding: { top: 80, bottom: 80, left: 80, right: 80 },
              maxZoom: 15,
              duration: 1000,
              linear: true
            });
            
            setTimeout(() => {
              if (onRouteComplete) onRouteComplete(data);
            }, 1000);
          } catch (error) {
            console.error("Error adjusting map view:", error);
            if (onRouteComplete) onRouteComplete(data);
          }
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
