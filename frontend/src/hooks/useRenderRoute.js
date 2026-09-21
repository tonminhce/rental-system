import polyline from "@mapbox/polyline";
import { useEffect, useState } from "react";
import { startRentalRoute } from "@/utils/rentalRoute.mjs";

export default function useRenderRoute(map, origin, destination, fitPadding) {
  const [result, setResult] = useState({ status: "idle" });
  useEffect(() => {
    if (!map || !destination || !origin) {
      setResult({ status: "idle" });
      return;
    }
    setResult({ status: "loading" });
    const route = startRentalRoute({
      map,
      origin,
      destination,
      decode: polyline.decode,
      onResult: setResult,
      fitPadding,
    });
    return () => route.cancel();
  }, [map, origin, destination, fitPadding]);
  return result;
}
