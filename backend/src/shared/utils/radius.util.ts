export const getRadius = (distance: number, unit: string): number => {
  const dividerMapping: { [key: string]: number } = {
    km: 6378.1,
    mi: 3963.2,
    m: 6378100,
  };
  const divider = dividerMapping[unit] ?? dividerMapping['km'];

  return distance / divider;
};

export const getLocationQueryObj = ({
  center,
  distance = 5,
  unit = 'km',
}: {
  center?: string;
  distance?: number;
  unit?: string;
}): { query: object, coordinates?: number[] } => {
  if (!center) return { query: {} };

  const [lng, lat] = center.split(',');
  const radius = getRadius(distance, unit);
  const coordinates = [Number(lng), Number(lat)];

  return {
    query: {
      $geoWithin: {
        $centerSphere: [coordinates, radius],
      },
    },
    coordinates
  };
};

// Helper function to get coordinates in the format GoongJS expects
export const getGoongJSCoordinates = (center?: string): number[] | null => {
  if (!center) return null;
  
  // Assuming center is in format "lng,lat"
  // Most JS mapping libraries (including GoongJS) expect [lat, lng] or [lng, lat] format
  const [lng, lat] = center.split(',').map(coord => parseFloat(coord));
  
  // Return [lat, lng] for GoongJS
  return [lat, lng]; 
};
