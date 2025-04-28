"use client";
import React from "react";
import ReactMapGL from "@goongmaps/goong-map-react";
import "@goongmaps/goong-js/dist/goong-js.css";

export default function ReactMap() {
  return (
    <ReactMapGL
      width={500}
      latitude={37.7577}
      longitude={-122.4376}
      zoom={8}
      goongApiAccessToken={process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY}
    />
  );
}
