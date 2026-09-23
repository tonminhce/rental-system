import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  ListItem,
  ListItemText,
} from "@mui/material";
import goongJs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import { DirectionsOutlined, LocationOn, PlaceOutlined } from "@mui/icons-material";
import usePlaceAutocomplete from "@/hooks/usePlaceAutocomplete";
import useRenderRoute from "@/hooks/useRenderRoute";
import { palette } from "@/styles/palette";
import { GOONG_STYLE_URL } from "@/utils/goongStyle.mjs";

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;

// Map markers take literal colors because they are painted inside the map canvas.
const MARKER_COLORS = { property: palette.brand, start: palette.gold };

// These maps are only ~300px tall, so the shared route fit needs a tighter inset
// than the full-height search map uses.
const ROUTE_PADDING = { top: 40, bottom: 40, left: 40, right: 40 };

const FALLBACK_CENTER = [106.660172, 10.762622];

// PostGIS stores [lng, lat] while the direction API expects "lat,lng".
const propertyCoords = (post) => post?.coordinates?.coordinates || null;
const toLatLngParam = ([lng, lat]) => `${lat},${lng}`;

// goong-js needs a WebGL context; without one the map constructor throws and
// used to take the whole comparison page down with it.
const supportsWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
};

const createStartMarkerElement = () => {
  const element = document.createElement("div");
  element.style.width = "30px";
  element.style.height = "30px";
  element.style.borderRadius = "50%";
  element.style.backgroundColor = MARKER_COLORS.start;
  element.style.border = `2px solid ${palette.paper}`;
  element.style.display = "flex";
  element.style.justifyContent = "center";
  element.style.alignItems = "center";
  element.style.color = palette.onBrand;
  element.style.fontWeight = "bold";
  element.style.fontSize = "14px";
  element.textContent = "S";
  element.title = "Your starting location";
  return element;
};

const ComparisonMap = ({ post1, post2 }) => {
  const container1Ref = useRef(null);
  const container2Ref = useRef(null);
  const mapsRef = useRef({ first: null, second: null });
  const startMarkersRef = useRef({ first: null, second: null });

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [originParam, setOriginParam] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [mapUnavailable, setMapUnavailable] = useState(false);

  const [searchInput, setSearchInput, suggestions] = usePlaceAutocomplete();

  const dest1Param = propertyCoords(post1) ? toLatLngParam(propertyCoords(post1)) : null;
  const dest2Param = propertyCoords(post2) ? toLatLngParam(propertyCoords(post2)) : null;

  const route1 = useRenderRoute(mapsRef.current.first, originParam, dest1Param, ROUTE_PADDING);
  const route2 = useRenderRoute(mapsRef.current.second, originParam, dest2Param, ROUTE_PADDING);

  useEffect(() => {
    if (!container1Ref.current || !container2Ref.current) return;
    if (!supportsWebGL()) {
      setMapUnavailable(true);
      return;
    }

    goongJs.accessToken = GOONG_API_KEY;

    const createMap = (container, coords) => {
      const map = new goongJs.Map({
        container,
        style: GOONG_STYLE_URL,
        zoom: coords ? 14 : 10,
        center: coords || FALLBACK_CENTER,
      });
      // A listing without coordinates stays centred on the region rather than
      // pinning a marker at an address it does not have.
      if (coords) {
        new goongJs.Marker({ color: MARKER_COLORS.property }).setLngLat(coords).addTo(map);
      }
      return map;
    };

    let first;
    let second;
    try {
      first = createMap(container1Ref.current, propertyCoords(post1));
      second = createMap(container2Ref.current, propertyCoords(post2));
    } catch (mapError) {
      console.error("Comparison map initialization failed:", mapError);
      first?.remove();
      setMapUnavailable(true);
      return;
    }
    mapsRef.current = { first, second };

    return () => {
      first.remove();
      second.remove();
      mapsRef.current = { first: null, second: null };
      startMarkersRef.current = { first: null, second: null };
    };
  }, [post1, post2]);

  const handlePlaceSelect = (event, place) => {
    if (place) {
      setSelectedPlace(place);
      setError("");
    }
  };

  const addStartMarker = (map, slot, lngLat) => {
    if (!map) return;
    startMarkersRef.current[slot]?.remove();
    startMarkersRef.current[slot] = new goongJs.Marker({ element: createStartMarkerElement() })
      .setLngLat(lngLat)
      .addTo(map);
  };

  const handleSearch = async () => {
    if (!selectedPlace) {
      setError("Please select a starting location");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const encodedAddress = encodeURIComponent(selectedPlace.description);
      const response = await fetch(`/api/geocode?address=${encodedAddress}`);
      const geocodeData = await response.json();
      const location = geocodeData.results?.[0]?.geometry?.location;

      if (!location) {
        setError("Location not found. Please try a different address.");
        return;
      }

      addStartMarker(mapsRef.current.first, "first", [location.lng, location.lat]);
      addStartMarker(mapsRef.current.second, "second", [location.lng, location.lat]);
      setOriginParam(toLatLngParam([location.lng, location.lat]));
    } catch (searchError) {
      console.error("Error searching for location:", searchError);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const renderRouteStatus = (route) => {
    if (route.status === "idle") return null;

    return (
      <Box
        role="status"
        sx={{
          mt: 1,
          px: 1.25,
          py: 0.75,
          bgcolor: "var(--rt-border)",
          borderRadius: "var(--rt-radius-sm)",
          fontSize: 12,
          lineHeight: 1.7,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "var(--rt-ink)",
        }}
      >
        {route.status === "loading" && (
          <>
            <CircularProgress size={14} /> Finding a bike route…
          </>
        )}
        {route.status === "ready" &&
          (Number.isFinite(route.distance)
            ? `${(route.distance / 1000).toFixed(1)} km · ${Math.round(route.duration / 60)} min by bike`
            : "Bike route ready")}
        {route.status === "error" && "No bike route could be found from this location."}
      </Box>
    );
  };

  const panels = [
    { slot: "first", containerRef: container1Ref, label: post1?.name || "Property 1", route: route1 },
    { slot: "second", containerRef: container2Ref, label: post2?.name || "Property 2", route: route2 },
  ];

  if (mapUnavailable) {
    return (
      <Box sx={{ mt: 3, p: 2, bgcolor: "var(--rt-surface-tint)", borderRadius: "var(--rt-radius)" }}>
        <Typography variant="body2" sx={{ color: "var(--rt-muted)" }}>
          3D map unavailable in this browser.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          mb: 2,
          p: 2,
          bgcolor: "var(--rt-surface-tint)",
          borderRadius: "var(--rt-radius)",
        }}
      >
        <Typography
          variant="subtitle1"
          gutterBottom
          fontWeight="bold"
          sx={{ color: "var(--rt-ink)" }}
        >
          Compare Travel Routes
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Box sx={{ flexGrow: 1, minWidth: "250px" }}>
            <Autocomplete
              value={selectedPlace}
              onChange={handlePlaceSelect}
              inputValue={searchInput}
              onInputChange={(_, newInputValue) => setSearchInput(newInputValue)}
              options={suggestions}
              filterOptions={(x) => x}
              noOptionsText="No address found"
              getOptionLabel={(option) => option.description}
              isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
              renderOption={({ key, ...optionProps }, option) => (
                <ListItem key={key} {...optionProps}>
                  <PlaceOutlined sx={{ mr: 1, color: "var(--rt-muted)" }} />
                  <ListItemText
                    primary={option.structured_formatting?.main_text || option.description}
                    secondary={option.structured_formatting?.secondary_text}
                    primaryTypographyProps={{ fontWeight: "medium" }}
                  />
                </ListItem>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Enter your starting location"
                  placeholder="E.g. Đại Học Bách Khoa HCM"
                  size="small"
                  error={!!error}
                  helperText={error}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <LocationOn sx={{ color: "var(--rt-muted)", mr: 1 }} />,
                    endAdornment: (
                      <>
                        {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isSearching || !selectedPlace}
            startIcon={
              isSearching ? <CircularProgress size={18} color="inherit" /> : <DirectionsOutlined />
            }
            sx={{ minWidth: "120px" }}
          >
            {isSearching ? "Searching..." : "Show Routes"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {panels.map(({ slot, containerRef, label, route }) => (
          <Box key={slot} sx={{ flex: 1, minWidth: { xs: "100%", md: "48%" } }}>
            <Box
              sx={{
                p: 1,
                mb: 1,
                bgcolor: "var(--rt-surface-tint)",
                borderRadius: "var(--rt-radius-sm)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  bgcolor: "var(--rt-brand)",
                  borderRadius: "50%",
                  mr: 1,
                  flexShrink: 0,
                }}
              />
              <Typography variant="subtitle2" sx={{ color: "var(--rt-ink)", fontWeight: 600 }}>
                {label}
              </Typography>
            </Box>
            <Box
              ref={containerRef}
              sx={{
                height: 300,
                borderRadius: "var(--rt-radius)",
                overflow: "hidden",
                border: "1px solid var(--rt-border)",
              }}
            />
            {renderRouteStatus(route)}
          </Box>
        ))}
      </Box>

      {originParam && (
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1, color: "var(--rt-muted)" }}
        >
          Route information shows the fastest bike path from your starting point to each property.
        </Typography>
      )}
    </Box>
  );
};

export default ComparisonMap;
