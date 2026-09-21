import { BadRequestException } from '@nestjs/common';
import { Op, literal, WhereOptions } from 'sequelize';
import { GetPostsDto } from './dto/get-posts.dto';

export function parseBounds(value: string): number[] {
  const box = value.split(',').map(Number);
  if (
    box.length !== 4 ||
    !box.every(Number.isFinite) ||
    box[0] < -85 ||
    box[2] > 85 ||
    box[1] < -180 ||
    box[3] > 180 ||
    box[0] >= box[2] ||
    box[1] >= box[3]
  ) {
    throw new BadRequestException(
      'Bounds must be south,west,north,east within valid map coordinates',
    );
  }
  return box;
}

export function postCoordinates(post: {
  latitude: unknown;
  longitude: unknown;
}) {
  if (post.latitude == null || post.longitude == null) return null;
  const lat = Number(post.latitude);
  const lng = Number(post.longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 85 ||
    Math.abs(lng) > 180 ||
    (lat === 0 && lng === 0)
  )
    return null;
  return { type: 'Point', coordinates: [lng, lat] };
}

export function boundsWhere(value: string): WhereOptions {
  const [south, west, north, east] = parseBounds(value);
  return {
    latitude: { [Op.between]: [south, north] },
    longitude: { [Op.between]: [west, east] },
  };
}

export function distanceSql(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    throw new BadRequestException('Invalid center');
  return `(6371 * acos(LEAST(1, GREATEST(-1,
    cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) +
    sin(radians(${lat})) * sin(radians(latitude))))))`;
}

// One predicate for the list and map: pagination must never change the map's inventory.
export function buildPostWhere(query: GetPostsDto) {
  const where: any = { status: 'active' };
  for (const [field, min, max] of [
    ['price', query.minPrice, query.maxPrice],
    ['area', query.minArea, query.maxArea],
  ] as const) {
    if (min !== undefined && max !== undefined && min > max)
      throw new BadRequestException(`Invalid ${field} range`);
    if (min !== undefined || max !== undefined)
      where[field] = {
        ...(min !== undefined ? { [Op.gte]: min } : {}),
        ...(max !== undefined ? { [Op.lte]: max } : {}),
      };
  }
  for (const field of ['transactionType', 'province', 'district', 'ward']) {
    if (query[field]) where[field] = query[field];
  }
  if (query.propertyType)
    where.propertyType = { [Op.in]: query.propertyType.split(',') };
  if (query.minBedrooms !== undefined)
    where.bedrooms = { [Op.gte]: query.minBedrooms };
  if (query.minBathrooms !== undefined)
    where.bathrooms = { [Op.gte]: query.minBathrooms };
  const intersections: any[] = [];
  if (
    query.centerLat !== undefined &&
    query.centerLng !== undefined &&
    query.radius !== undefined
  ) {
    intersections.push(
      literal(
        `${distanceSql(query.centerLat, query.centerLng)} <= ${Number(query.radius)}`,
      ),
    );
  }
  if (query.bounds) intersections.push(boundsWhere(query.bounds));
  if (intersections.length) where[Op.and] = intersections;
  return where;
}

// A power-of-two grid keeps cells stable while panning and bounds the response to
// at most 9 × 7 groups, regardless of whether the database holds 1k or 100k homes.
export function mapGrid(value: string) {
  const [south, west, north, east] = parseBounds(value);
  const step = (span: number, cells: number) =>
    Math.max(0.0000001, 2 ** Math.ceil(Math.log2(span / cells)));
  return { lat: step(north - south, 8), lng: step(east - west, 6) };
}
