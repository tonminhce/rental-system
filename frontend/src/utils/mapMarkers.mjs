// Merge screen-neighbor groups, rather than hiding records. Every input home's
// count and bounding box survives, so zooming/searching can still reach them all.
export function declutterMarkers(markers, project, { maxMarkers = 16, minDistance = 76 } = {}) {
  const groups = markers
    .map((marker) => ({ ...marker, coordinates: [...marker.coordinates], bounds: [...marker.bounds] }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)));
  while (groups.length > 1) {
    let nearest = Infinity;
    let pair;
    const pixels = groups.map((group) => project(group.coordinates));
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const distance = Math.hypot(pixels[i].x - pixels[j].x, pixels[i].y - pixels[j].y);
        if (distance < nearest) {
          nearest = distance;
          pair = [i, j];
        }
      }
    }
    if (!pair || (groups.length <= Math.max(1, maxMarkers) && nearest >= minDistance)) break;
    const [i, j] = pair;
    const a = groups[i];
    const b = groups[j];
    const count = a.count + b.count;
    groups[i] = {
      key: `${a.key}|${b.key}`,
      count,
      coordinates: [0, 1].map((axis) => (a.coordinates[axis] * a.count + b.coordinates[axis] * b.count) / count),
      bounds: [
        Math.min(a.bounds[0], b.bounds[0]),
        Math.min(a.bounds[1], b.bounds[1]),
        Math.max(a.bounds[2], b.bounds[2]),
        Math.max(a.bounds[3], b.bounds[3]),
      ],
    };
    groups.splice(j, 1);
  }
  return groups;
}
