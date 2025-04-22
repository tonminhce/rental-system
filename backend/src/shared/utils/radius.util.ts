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
  distance = 20,
  unit = 'km',
}: {
  center?: string;
  distance?: number;
  unit?: string;
}): object => {
  if (!center) return {};

  const [lng, lat] = center.split(',');
  const radius = getRadius(distance, unit);

  return {
    $geoWithin: {
      $centerSphere: [[Number(lng), Number(lat)], radius],
    },
  };
};
