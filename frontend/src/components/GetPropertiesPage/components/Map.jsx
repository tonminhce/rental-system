import useCreateMarkers from "@/hooks/useCreateMakers";
import useRenderRoute from "@/hooks/useRenderRoute";
import getBoundary from "@/utils/getBoundary";
import goongJs from "@goongmaps/goong-js"; // Import GoongJS
import "@goongmaps/goong-js/dist/goong-js.css"; // Import GoongJS CSS
import { useEffect, useRef, useState } from "react";
import { StringParam, useQueryParam } from "use-query-params";

const Map = ({ center = [107.6416527, 11.295036], markerList = [] }) => {
  const [centerLat] = useQueryParam("centerLat", StringParam);
  const [centerLng] = useQueryParam("centerLng", StringParam);
  const [boundary] = useQueryParam("boundary", StringParam);

  const [lng, lat] = centerLat && centerLng
    ? [parseFloat(centerLng), parseFloat(centerLat)]
    : center;

  const mapContainerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Reset selected property when markerList changes (e.g., when filters are cleared)
  // Also reset when center, lat/lng or boundary changes
  useEffect(() => {
    setSelected(null);
  }, [markerList, centerLat, centerLng, boundary, center]);

  const selectedMarkerCoordinates = selected && selected.coordinates?.coordinates?.length >= 2
    ? `${selected.coordinates.coordinates[0]},${selected.coordinates.coordinates[1]}`
    : "";
  useRenderRoute(mapInstance, `${lat},${lng}`, selectedMarkerCoordinates);
  useCreateMarkers(mapInstance, markerList, (marker) => setSelected(marker));

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    goongJs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY; // Set Goong Maps key

    const map = new goongJs.Map({
      container: mapContainerRef.current,
      style: "https://tiles.goong.io/assets/goong_light_v2.json",
      center: [lng, lat],
    });
    
    // Wait for map to load before saving the instance
    map.on('load', () => {
    setMapInstance(map);

    // Thêm marker đỏ tại trung tâm
    new goongJs.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);

      // Sử dụng centerLat và centerLng nếu có, nếu không thì dùng giá trị mặc định
      const mapCenter = centerLat && centerLng
        ? [parseFloat(centerLng), parseFloat(centerLat)]
        : [106.660172, 10.762622];
      const { polygon, convex } = getBoundary(mapCenter, boundary);

      const coordinates = convex.geometry.coordinates[0];
      const bounds = coordinates.reduce(function (bounds, coord) {
        return bounds.extend(coord);
      }, new goongJs.LngLatBounds(coordinates[0], coordinates[0]));

      map.fitBounds(bounds, { padding: 20, duration: 0 });

      map.addSource("boundary", {
        type: "geojson",
        data: polygon,
      });
      map.addLayer({
        id: "maine",
        type: "fill",
        source: "boundary",
        layout: {},
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.4,
        },
      });

      map.addSource("outerbox", {
        type: "geojson",
        data: convex,
      });
      map.addLayer({
        id: "maine2",
        type: "line",
        source: "outerbox",
        layout: {},
        paint: {
          "line-color": "#888",
          "line-width": 3,
        },
      });
    });

    return () => {
      if (map) map.remove();
    };
  }, [lng, lat, centerLat, centerLng, boundary]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />;
};

export default Map;
