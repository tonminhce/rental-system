"use client";
import goongJs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { Close, MyLocationOutlined, RouteOutlined, Search, ZoomOutMapOutlined } from "@mui/icons-material";
import Link from "next/link";
import useRenderRoute from "@/hooks/useRenderRoute";
import { useGetMapPropertiesQuery } from "@/redux/features/properties/propertyApi";
import { formatRent } from "@/utils/rentalSearch.mjs";
import { declutterMarkers } from "@/utils/mapMarkers.mjs";
import styleRentalMap from "@/utils/styleRentalMap";
import { GOONG_STYLE_URL } from "@/utils/goongStyle.mjs";
import "./RentalMap.scss";

const validCoordinates = (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
const paddedBounds = (box) => [box[0] - 0.000001, box[1] - 0.000001, box[2] + 0.000001, box[3] + 0.000001];

export default function Map({ center, filters, selectedProperty, onSearchArea, onCloseSelection, onExpand, expanded }) {
  const container = useRef(null);
  const [map, setMap] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [viewport, setViewport] = useState("");
  const [moved, setMoved] = useState(false);
  const [selected, setSelected] = useState(null);
  const [destination, setDestination] = useState("");
  const [group, setGroup] = useState(null);
  const [markerCount, setMarkerCount] = useState(0);
  const selectionRef = useRef(null);
  const callbacks = useRef({ onSearchArea });
  callbacks.current = { onSearchArea };
  const route = useRenderRoute(map, `${center[1]},${center[0]}`, destination);
  const {
    currentData: data,
    isFetching,
    error,
    refetch,
  } = useGetMapPropertiesQuery({ ...filters, mapBounds: viewport }, { skip: !viewport });
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    if (!container.current || !goongJs.supported()) {
      setMapError(true);
      return;
    }
    let instance;
    let timer;
    let resize;
    let alive = true;
    try {
      instance = new goongJs.Map({
        container: container.current,
        style: GOONG_STYLE_URL,
        accessToken: process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY,
        center: [106.701, 10.786],
        zoom: 11,
        maxZoom: 19,
      });
      instance.addControl(new goongJs.NavigationControl({ showCompass: false }), "top-right");
      instance.dragRotate.disable();
      instance.touchZoomRotate.disableRotation();
      // Keep ordinary page scrolling predictable. Zoom buttons and pinch still work.
      instance.scrollZoom.disable();
      const report = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (!alive) return;
          const b = instance.getBounds();
          const box = [
            Math.max(-85, b.getSouth()),
            Math.max(-180, b.getWest()),
            Math.min(85, b.getNorth()),
            Math.min(180, b.getEast()),
          ];
          if (box[0] < box[2] && box[1] < box[3]) setViewport(box.map((v) => v.toFixed(7)).join(","));
        }, 180);
      };
      instance.on("load", () => {
        if (alive) {
          styleRentalMap(instance);
          setMap(instance);
          report();
        }
      });
      instance.on("moveend", report);
      instance.on("dragend", () => setMoved(true));
      instance.on("zoomend", (event) => {
        if (event.originalEvent) setMoved(true);
      });
      instance.on("error", (event) => {
        if (!event.sourceId && alive) setMapError(true);
      });
      resize = new ResizeObserver(() => instance.resize());
      resize.observe(container.current);
    } catch {
      setMapError(true);
    }
    return () => {
      alive = false;
      clearTimeout(timer);
      resize?.disconnect();
      instance?.remove();
    };
  }, []);

  useEffect(() => {
    setSelected(null);
    setGroup(null);
    setDestination("");
    setMoved(false);
  }, [filterKey]);

  // Recenter only when the search location changes, never when a list page changes.
  useEffect(() => {
    if (!map) return;
    const box = filters.bounds?.split(",").map(Number);
    if (box?.length === 4 && box.every(Number.isFinite)) {
      map.fitBounds(
        [
          [box[1], box[0]],
          [box[3], box[2]],
        ],
        { padding: 35, maxZoom: 16, duration: 400 },
      );
    } else map.easeTo({ center, zoom: filters.centerLat ? 13 : 11, duration: 400 });
  }, [map, center, filters.bounds, filters.centerLat]);

  useEffect(() => {
    if (!map || !selectedProperty) return;
    const coords = selectedProperty.coordinates?.coordinates;
    if (!validCoordinates(coords)) return;
    setSelected({ ...selectedProperty, coordinates: coords });
    setGroup(null);
    setDestination("");
    map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 15), padding: { bottom: 180 }, duration: 450 });
  }, [map, selectedProperty]);

  useEffect(() => {
    if (!map) return;
    if (destination) return;
    const width = container.current?.clientWidth || 500;
    const height = container.current?.clientHeight || 600;
    const maxMarkers = Math.min(20, Math.max(8, Math.floor((width * height) / 25000)));
    const visible = declutterMarkers(data?.markers || [], (coordinates) => map.project(coordinates), {
      maxMarkers,
      minDistance: 80,
    });
    setMarkerCount(visible.length);
    const markers = visible.map((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = item.count > 1 ? "rental-map-cluster" : "rental-map-price";
      if (item.count > 1) {
        const count = document.createElement("span");
        count.textContent = item.count.toLocaleString();
        button.append(count);
      } else button.textContent = formatRent(item.price);
      button.title = item.count > 1 ? `${item.count.toLocaleString()} homes · click to explore` : item.name;
      button.setAttribute(
        "aria-label",
        item.count > 1
          ? `Explore ${item.count} homes in this area`
          : `Preview ${item.name}, ${formatRent(item.price)} per month`,
      );
      button.onclick = () => {
        setDestination("");
        setMoved(true);
        if (item.count > 1) {
          setSelected(null);
          setGroup(item);
          const box = paddedBounds(item.bounds);
          map.fitBounds(
            [
              [box[1], box[0]],
              [box[3], box[2]],
            ],
            { padding: 65, maxZoom: Math.min(19, map.getZoom() + 2), duration: 400 },
          );
        } else {
          setGroup(null);
          setSelected(item);
        }
      };
      const point = map.project(item.coordinates);
      const halfWidth = item.count > 1 ? 26 : Math.max(32, button.textContent.length * 3.5 + 10);
      const offset = [
        Math.max(halfWidth - point.x, Math.min(0, width - halfWidth - point.x)),
        Math.max(24 - point.y, Math.min(0, height - 24 - point.y)),
      ];
      return new goongJs.Marker({ element: button, offset }).setLngLat(item.coordinates).addTo(map);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [map, data, destination]);

  useEffect(() => {
    if (!map || !selected) return;
    selectionRef.current?.focus({ preventScroll: true });
    const pin = document.createElement("button");
    pin.className = "rental-map-price is-selected";
    pin.textContent = formatRent(selected.price);
    pin.setAttribute("aria-label", `Selected home: ${selected.name}`);
    pin.onclick = () => selectionRef.current?.focus();
    const marker = new goongJs.Marker({ element: pin }).setLngLat(selected.coordinates).addTo(map);
    return () => marker.remove();
  }, [map, selected]);

  useEffect(() => {
    if (!map || !destination) return;
    const pin = document.createElement("div");
    pin.className = "rental-map-origin";
    pin.textContent = "Search center";
    const marker = new goongJs.Marker({ element: pin }).setLngLat(center).addTo(map);
    return () => marker.remove();
  }, [map, center, destination]);

  const close = () => {
    setSelected(null);
    setGroup(null);
    setDestination("");
    onCloseSelection?.();
  };
  const searchArea = (bounds = viewport) => {
    if (!bounds) return;
    callbacks.current.onSearchArea(bounds);
    setMoved(false);
    close();
  };

  return (
    <Box
      className="rental-map"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <Box className="rental-map-heading">
        <Box>
          <Typography component="h2" fontWeight={700} fontSize={15}>
            Explore the map
          </Typography>
          <Typography aria-live="polite" variant="caption" color="text.secondary">
            {isFetching
              ? "Updating this view…"
              : error
                ? "Map listings unavailable"
                : `${(data?.total || 0).toLocaleString()} matching homes in view`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            aria-label={expanded ? "Exit expanded map" : "Expand map"}
            size="small"
            onClick={onExpand}
            sx={{ display: { xs: "none", md: "inline-flex" } }}
          >
            <ZoomOutMapOutlined fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Return to search center"
            size="small"
            onClick={() => {
              map?.easeTo({ center, zoom: 12, duration: 400 });
              setMoved(true);
            }}
          >
            <MyLocationOutlined fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Box className="rental-map-canvas-wrap">
        <div ref={container} className="rental-map-canvas" aria-label="Interactive rental map" />
        {!map && !mapError && (
          <Box className="rental-map-loading">
            <CircularProgress size={26} />
            <span>Loading map…</span>
          </Box>
        )}
        {map && moved && !selected && (
          <Button className="search-map-area" variant="contained" startIcon={<Search />} onClick={() => searchArea()}>
            Search this area
          </Button>
        )}
        {(error || mapError) && (
          <Alert
            severity="warning"
            className="rental-map-notice"
            action={error ? <Button onClick={refetch}>Retry</Button> : undefined}
          >
            {error
              ? "Couldn’t load map homes. The list is still available."
              : "Map tiles are unavailable. Browse homes in the list."}
          </Alert>
        )}
        {!isFetching && !error && data?.total === 0 && !selected && !mapError && (
          <Box className="rental-map-empty">No mapped homes in this view. Move the map or broaden your filters.</Box>
        )}
        {group && !selected && (
          <Box className="rental-map-preview">
            <IconButton className="close-map-preview" aria-label="Close area preview" onClick={close}>
              <Close fontSize="small" />
            </IconButton>
            <Typography fontWeight={700} sx={{ pr: 4 }}>
              {group.count.toLocaleString()} homes around this spot
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
              Zoom in to separate pins, or browse all homes here in the list.
            </Typography>
            <Button variant="contained" onClick={() => searchArea(paddedBounds(group.bounds).join(","))}>
              View these homes
            </Button>
          </Box>
        )}
        {selected && (
          <Box className="rental-map-preview" role="region" aria-label="Selected home" tabIndex={-1} ref={selectionRef}>
            <IconButton className="close-map-preview" aria-label="Close home preview and clear route" onClick={close}>
              <Close fontSize="small" />
            </IconButton>
            <Typography color="text.secondary" fontSize={12} sx={{ pr: 4, mb: 0.5 }}>
              {selected.district || "Rental home"}
            </Typography>
            <Link className="map-home-title" href={`/posts/${selected.id}`}>
              {selected.name}
            </Link>
            <Typography fontSize={14} sx={{ my: 1 }}>
              <strong>{formatRent(selected.price)}</strong> / month · {selected.area ? Number(selected.area) : "—"} m²
            </Typography>
            <Typography fontSize={11} color="text.secondary" sx={{ mb: 1 }}>
              Location is unverified. Confirm the address before traveling.
            </Typography>
            {destination && (
              <Box role="status" className="rental-route-status">
                {route.status === "loading" && (
                  <>
                    <CircularProgress size={14} /> Finding a bike route…
                  </>
                )}
                {route.status === "ready" && (
                  <>
                    {Number.isFinite(route.distance)
                      ? `${(route.distance / 1000).toFixed(1)} km · ${Math.round(route.duration / 60)} min by bike`
                      : "Bike route ready"}{" "}
                    · from search center
                  </>
                )}
                {route.status === "error" && "No route available. Clear and try another home."}
              </Box>
            )}
            <Stack direction="row" spacing={1}>
              <Button component={Link} href={`/posts/${selected.id}`} variant="contained">
                View home
              </Button>
              <Button
                variant="outlined"
                startIcon={destination ? <Close /> : <RouteOutlined />}
                onClick={() => {
                  setDestination(destination ? "" : `${selected.coordinates[1]},${selected.coordinates[0]}`);
                }}
              >
                {destination ? "Clear route" : "Bike route"}
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
      <Box className="rental-map-footer">
        {destination ? (
          "Other homes are hidden while routing. Clear the route to explore again."
        ) : isFetching ? (
          "Updating map homes…"
        ) : (
          <>
            <span className="map-legend-dot" /> {markerCount} pins · grouped for a clearer map. Zoom in for prices.
          </>
        )}
      </Box>
    </Box>
  );
}
