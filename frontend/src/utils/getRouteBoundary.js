function calculateBoundsForRoute(routeCheckpoints) {
  var lats = routeCheckpoints.map((point) => point[0]);
  var lngs = routeCheckpoints.map((point) => point[1]);
  var bounds = [
    [Math.min(...lngs), Math.min(...lats)], // Southwest corner
    [Math.max(...lngs), Math.max(...lats)], // Northeast corner
  ];
  return bounds;
}

export default calculateBoundsForRoute;
