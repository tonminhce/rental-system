function getCircleBoudingBox(center, radius) {
  const earthRadius = 6371; // Earth's radius in kilometers

  const lat = center[1];
  const lon = center[0];

  const maxLat = lat + (radius / earthRadius) * (180 / Math.PI);
  const minLat = lat - (radius / earthRadius) * (180 / Math.PI);

  const maxLon = lon + ((radius / earthRadius) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);
  const minLon = lon - ((radius / earthRadius) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);

  return [
    [minLon, minLat], // Southwest corner
    [maxLon, maxLat], // Northeast corner
  ];
}

export default getCircleBoudingBox;
