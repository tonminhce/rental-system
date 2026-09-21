"use client";
import goongJs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import useRenderRoute from "@/hooks/useRenderRoute";
const EMPTY_MARKERS = [];

export default function Map({ center, markerList = EMPTY_MARKERS }) {
  const container = useRef(null);
  const [map, setMap] = useState(null);
  const [error, setError] = useState(false);
  const [destination, setDestination] = useState("");
  const [routing, setRouting] = useState(false);
  const destinationRef = useRef(destination);
  destinationRef.current = destination;

  const finishRoute = useCallback(() => setRouting(false), []);
  const clearRoute = useCallback(() => {
    setDestination("");
    setRouting(false);
  }, []);

  useRenderRoute(map, `${center[1]},${center[0]}`, destination, finishRoute, clearRoute);

  useEffect(() => {
    if (!container.current || !goongJs.supported()) {
      setError(true);
      return;
    }
    let instance;
    try {
      instance = new goongJs.Map({
        container: container.current,
        style: "https://tiles.goong.io/assets/goong_map_web.json",
        accessToken: process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY,
        center: [106.701, 10.786],
        zoom: 11,
      });
      instance.addControl(new goongJs.NavigationControl(), "top-right");
      instance.on("load", () => {
        setError(false);
        setMap(instance);
      });
      instance.on("error", () => setError(true));
    } catch {
      setError(true);
    }
    return () => {
      instance?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    setDestination("");
    const markers = [];
    const bounds = new goongJs.LngLatBounds();
    for (const property of markerList) {
      const coordinates = property.coordinates?.coordinates;
      if (!coordinates || coordinates.length !== 2 || !coordinates.every(Number.isFinite)) continue;
      const coordStr = `${coordinates[1]},${coordinates[0]}`;

      const button = document.createElement("button");
      button.textContent = `${Number(property.price).toLocaleString()}m ₫`;
      button.setAttribute("aria-label", `${property.name}, ${property.price} million VND per month`);
      Object.assign(button.style, {
        background: "#fff",
        color: "#234c3e",
        border: "1px solid #234c3e",
        borderRadius: "18px",
        padding: "7px 11px",
        fontSize: "12px",
        boxShadow: "0 2px 6px #0002",
        cursor: "pointer",
      });

      const content = document.createElement("div");
      content.style.padding = "8px";
      const title = document.createElement("strong");
      title.textContent = property.name;
      content.append(title);
      const info = document.createElement("p");
      info.textContent = `${property.price}m ₫ / month · ${property.area || "—"} m²`;
      info.style.margin = "8px 0";
      content.append(info);
      const link = document.createElement("a");
      link.href = `/posts/${encodeURIComponent(property.id)}`;
      link.textContent = "View home →";
      link.style.color = "#234c3e";
      content.append(link);

      const route = document.createElement("button");
      route.textContent = "Route from search center";
      Object.assign(route.style, {
        display: "block",
        marginTop: "10px",
        fontSize: "11px",
        background: "#edf1e7",
        color: "#234c3e",
        border: "1px solid #c9d6be",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontWeight: "500",
      });
      route.onclick = () => {
        if (destinationRef.current === coordStr) {
          clearRoute();
          route.textContent = "Route from search center";
          route.style.background = "#edf1e7";
          route.style.color = "#234c3e";
        } else {
          setRouting(true);
          setDestination(coordStr);
          route.textContent = "✕ Clear route";
          route.style.background = "#fff1f0";
          route.style.color = "#c94040";
        }
      };
      content.append(route);

      const popup = new goongJs.Popup({ offset: 20 }).setDOMContent(content);
      popup.on("close", () => {
        if (destinationRef.current === coordStr) {
          clearRoute();
        }
      });

      markers.push(new goongJs.Marker({ element: button }).setLngLat(coordinates).setPopup(popup).addTo(map));
      bounds.extend(coordinates);
    }
    if (markers.length) map.fitBounds(bounds, { padding: 65, maxZoom: 14, duration: 0 });
    else map.flyTo({ center, zoom: 12, duration: 0 });
    return () => markers.forEach((marker) => marker.remove());
  }, [map, markerList, center, clearRoute]);

  return (
    <Box sx={{ height: "100%", position: "relative", bgcolor: "#e9eee2" }}>
      <div ref={container} style={{ height: "100%" }} />
      {!map && !error && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            gap: 2,
            justifyItems: "center",
          }}
        >
          <CircularProgress size={28} />
          <Typography variant="body2">Loading the neighborhood…</Typography>
        </Box>
      )}
      {error && (
        <Alert severity="warning" sx={{ position: "absolute", bottom: 35, left: 12, right: 12 }}>
          Map unavailable. You can still browse every home in the list.
        </Alert>
      )}
      {routing && (
        <Alert icon={<CircularProgress size={16} />} sx={{ position: "absolute", top: 12, left: 12, zIndex: 10 }}>
          Finding your route…
        </Alert>
      )}
      {destination && !routing && (
        <Button
          variant="contained"
          size="small"
          onClick={clearRoute}
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            bgcolor: "#234c3e",
            color: "#fff",
            borderRadius: "20px",
            textTransform: "none",
            fontSize: "12px",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            "&:hover": { bgcolor: "#1a392e" },
          }}
        >
          ✕ Clear route
        </Button>
      )}
    </Box>
  );
}
