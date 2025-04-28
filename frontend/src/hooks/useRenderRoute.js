import calculateBoundsForRoute from "@/utils/getRouteBoundary";
import polyline from "@mapbox/polyline";
import { useEffect } from "react";

export default function useRenderRoute(mapInstance, originCoord, destinationCoord) {
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

      // Clear existing route when no destination is selected
      if (!destinationCoord || destinationCoord === "") {
        safelyRemoveSource();
        return;
      }

      // Don't proceed if origin is missing
      if (!originCoord) return;

    console.log("originCoord:", originCoord);
    console.log("destinationCoord:", destinationCoord);
      
    const getRouteData = async () => {
      const url = `/api/direction?origin=${originCoord}&destination=${destinationCoord}`;
      const res = await fetch(url);
      return await res.json();
    };

    getRouteData()
      .then((data) => {
          if (!data || !data.routes || !data.routes[0]) {
            console.error("Invalid route data received");
            return;
          }
          
        console.log(data);
        const polylineStr = data.routes[0].overview_polyline.points;
        const decoded = polyline.decode(polylineStr);
        const routeBoundary = calculateBoundsForRoute(decoded);

        mapInstance.fitBounds(routeBoundary, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
        });

          // Clean up existing layers and sources first
          safelyRemoveSource();

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
            "line-color": "red",
            "line-width": 8,
            "line-opacity": 0.3,
          },
        });
      })
        .catch((error) => console.error("Route data fetch error:", error));
    } catch (error) {
      console.error("Error in useRenderRoute:", error);
    }
  }, [mapInstance, originCoord, destinationCoord]);
}
