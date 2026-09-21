"use client";
import goongJs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import { useEffect, useRef, useState } from "react";
import { Alert, Box } from "@mui/material";
import styleRentalMap from "@/utils/styleRentalMap";
import { GOONG_STYLE_URL } from "@/utils/goongStyle.mjs";

export default function LocationMap({ coordinates }) {
  const container = useRef(null);
  const [failed, setFailed] = useState(false);
  const [lng, lat] = coordinates;
  useEffect(() => {
    let instance;
    let resize;
    try {
      if (!goongJs.supported()) throw new Error("WebGL unavailable");
      instance = new goongJs.Map({
        container: container.current,
        center: [lng, lat],
        zoom: 14,
        style: GOONG_STYLE_URL,
        accessToken: process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY,
      });
      instance.scrollZoom.disable();
      instance.on("load", () => styleRentalMap(instance));
      instance.addControl(new goongJs.NavigationControl({ showCompass: false }), "top-right");
      new goongJs.Marker({ color: "#234c3e" }).setLngLat([lng, lat]).addTo(instance);
      instance.on("error", () => setFailed(true));
      resize = new ResizeObserver(() => instance.resize());
      resize.observe(container.current);
    } catch {
      setFailed(true);
    }
    return () => {
      resize?.disconnect();
      instance?.remove();
    };
  }, [lng, lat]);
  return (
    <Box>
      {!failed && (
        <Box sx={{ height: 320, borderRadius: 2, overflow: "hidden" }}>
          <div ref={container} style={{ height: "100%" }} aria-label="Listing location map" />
        </Box>
      )}
      <Alert severity={failed ? "warning" : "info"} sx={{ mt: 1, fontSize: 12, alignItems: "center", py: 0.5 }}>
        {failed
          ? "The map is unavailable."
          : "Unverified location. Confirm the exact address with the source before visiting."}
      </Alert>
    </Box>
  );
}
