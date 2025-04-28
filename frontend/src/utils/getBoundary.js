import polyline from "@mapbox/polyline";
import { convex, polygon, circle } from "@turf/turf";

function getBoundaryBox(boundary) {
  if (!boundary) return null;

  const coordinates = polyline.decode(boundary);
  const boundaryGeoJSON = polygon([coordinates.map((coord) => [coord[1], coord[0]])]);
  const outerConvexHull = convex(boundaryGeoJSON);

  return { polygon: boundaryGeoJSON, convex: outerConvexHull };
}

function getCircleBoudingBox(center, radius) {
  const circleBoundary = circle(center, radius, { steps: 64, units: "kilometers" });
  return { polygon: circleBoundary, convex: circleBoundary };
}

export default function getBoundary(center, boundary = null) {
  if (boundary) return getBoundaryBox(boundary);

  return getCircleBoudingBox(center, 3);
}
