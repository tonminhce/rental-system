// Keep streets, transit and neighborhood labels, but lower the visual weight of
// the base map so rental pins remain the primary interactive elements.
export default function styleRentalMap(map) {
  const fills = {
    "landcover-natural": "#e7eddf",
    "landuse-forest": "#e0e8d6",
    "landuse-airport": "#e8e5e8",
    "landuse-industrial": "#e7e8e3",
    "landuser-grass": "#e5ebdb",
    water: "#d1e2e6",
    ocean: "#d1e2e6",
    "water-shadow": "#bfd5dc",
    building_flat: "#e0e2da",
  };
  try {
    if (map.getLayer("background")) map.setPaintProperty("background", "background-color", "#f4f3ed");
    for (const [id, color] of Object.entries(fills))
      if (map.getLayer(id)) map.setPaintProperty(id, "fill-color", color);
    for (const id of ["poi-scalerank-3", "poi-scalerank-4"]) {
      if (map.getLayer(id)) {
        map.setPaintProperty(id, "text-opacity", 0.55);
        map.setPaintProperty(id, "icon-opacity", 0.5);
      }
    }
  } catch {
    /* A provider style update must not stop the map from loading. */
  }
}
