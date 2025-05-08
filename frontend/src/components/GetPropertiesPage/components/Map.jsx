import useCreateMarkers from "@/hooks/useCreateMakers";
import useRenderRoute from "@/hooks/useRenderRoute";
import getBoundary from "@/utils/getBoundary";
import goongJs from "@goongmaps/goong-js"; // Import GoongJS
import "@goongmaps/goong-js/dist/goong-js.css"; // Import GoongJS CSS
import { useEffect, useRef, useState } from "react";
import { StringParam, useQueryParam } from "use-query-params";
import { Box, CircularProgress, Typography, Fade, Paper } from "@mui/material";
import DirectionsIcon from '@mui/icons-material/Directions';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';

const Map = ({ center = [107.6416527, 11.295036], markerList = [] }) => {
  const [centerLat] = useQueryParam("centerLat", StringParam);
  const [centerLng] = useQueryParam("centerLng", StringParam);
  const [boundary] = useQueryParam("boundary", StringParam);
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const [lng, lat] = centerLat && centerLng
    ? [parseFloat(centerLng), parseFloat(centerLat)]
    : center;

  const mapContainerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    setSelected(null);
  }, [markerList, centerLat, centerLng, boundary, center]);

  const selectedMarkerCoordinates = selected && selected.coordinates?.coordinates?.length >= 2
    ? `${selected.coordinates.coordinates[0]},${selected.coordinates.coordinates[1]}`
    : "";

  useEffect(() => {
    if (selectedMarkerCoordinates && mapInstance) {
      setIsRouteLoading(true);
    }
  }, [selectedMarkerCoordinates, mapInstance]);

  useRenderRoute(mapInstance, `${lat},${lng}`, selectedMarkerCoordinates, () => setIsRouteLoading(false));

  useCreateMarkers(mapInstance, markerList, (marker) => {
    setSelected(marker);
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    setIsLoading(true);
    goongJs.accessToken = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY; 
    const map = new goongJs.Map({
      container: mapContainerRef.current,
      style: "https://tiles.goong.io/assets/goong_light_v2.json",
      center: [lng, lat],
    });

    map.on('load', () => {
      setIsLoading(false);
      setMapInstance(map);
      new goongJs.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);
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
          "fill-color": "#4285F4",
          "fill-opacity": 0.2,
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
          "line-color": "#4285F4",
          "line-width": 2,
          "line-opacity": 0.7
        },
      });
    });

    return () => {
      if (map) map.remove();
    };
  }, [lng, lat, centerLat, centerLng, boundary]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading overlay for initial map load */}
      <Fade in={isLoading}>
        <Box sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          zIndex: 999,
          gap: 2
        }}>
          <CircularProgress size={70} thickness={4} sx={{ color: '#4285F4' }} />
          <Typography variant="body1" sx={{ fontWeight: 500, color: '#555' }}>
            Loading map...
          </Typography>
        </Box>
      </Fade>

      <Fade in={isRouteLoading && !isLoading}>
        <Paper elevation={4} sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12px",
          padding: 2.5,
          zIndex: 999,
          minWidth: '180px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}>
          <Box sx={{ position: 'relative', mb: 1 }}>
            <CircularProgress
              size={60}
              thickness={4}
              sx={{ color: '#4285F4' }}
            />
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}>
              <DirectionsIcon sx={{ color: '#EA4335', fontSize: 30 }} />
            </Box>
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 500, color: '#555' }}>
            Calculating route...
          </Typography>
        </Paper>
      </Fade>

      {selected && (
        <Paper elevation={2} sx={{
          position: "absolute",
          bottom: 10,
          left: 10,
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          borderRadius: "6px",
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          maxWidth: '300px',
          zIndex: 5
        }}>
          <TwoWheelerIcon sx={{ color: '#4285F4', mr: 1, fontSize: 20 }} />
          <Typography variant="caption" sx={{ color: '#555', fontSize: '11px' }}>
            Distance and travel time calculated for motorcycle
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Map;
