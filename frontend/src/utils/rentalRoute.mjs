// Cancellation also guards providers that resolve after their signal is aborted.
export function startRentalRoute({
  map,
  origin,
  destination,
  decode,
  onResult,
  // Tuned for the tall search map; smaller maps pass a tighter inset.
  fitPadding = { top: 80, bottom: 260, left: 45, right: 45 },
  request = fetch,
}) {
  const controller = new AbortController();
  let active = true;
  const remove = () => {
    try {
      if (map.getLayer("route-layer")) map.removeLayer("route-layer");
      if (map.getSource("route")) map.removeSource("route");
    } catch {
      /* The map may already have been destroyed by its owner. */
    }
  };
  remove();
  const done = (async () => {
    try {
      const params = new URLSearchParams({ origin, destination, vehicle: "bike" });
      const response = await request(`/api/direction?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Route request failed");
      const data = await response.json();
      if (!active) return;
      const route = data.routes?.[0];
      if (!route?.overview_polyline?.points) throw new Error("No route found");
      const coordinates = decode(route.overview_polyline.points).map(([lat, lng]) => [lng, lat]);
      if (coordinates.length < 2 || coordinates.some((p) => !p.every(Number.isFinite)))
        throw new Error("Invalid route");
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        },
      });
      map.addLayer({
        id: "route-layer",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#234c3e", "line-width": 5, "line-opacity": 0.85 },
      });
      const lngs = coordinates.map((p) => p[0]);
      const lats = coordinates.map((p) => p[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: fitPadding, maxZoom: 15, duration: 450 }
      );
      const leg = route.legs?.[0];
      onResult({ status: "ready", distance: leg?.distance?.value, duration: leg?.duration?.value });
    } catch (error) {
      if (active && error.name !== "AbortError") {
        remove();
        onResult({ status: "error" });
      }
    }
  })();
  return {
    done,
    cancel() {
      active = false;
      controller.abort();
      remove();
    },
  };
}
