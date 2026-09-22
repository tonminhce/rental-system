import { Op } from 'sequelize';
import {
  buildPostWhere,
  mapGrid,
  parseBounds,
  postCoordinates,
} from './post-filters';

describe('rental search predicates', () => {
  it('does not turn missing coordinates into a map pin at zero', () => {
    expect(postCoordinates({ latitude: null, longitude: null })).toBeNull();
    expect(postCoordinates({ latitude: 95, longitude: 106 })).toBeNull();
    expect(postCoordinates({ latitude: '10.8', longitude: '106.7' })).toEqual({
      type: 'Point',
      coordinates: [106.7, 10.8],
    });
  });
  it('rejects malformed, reversed, and out-of-range bounds', () => {
    for (const value of [
      '1,2,3',
      '3,2,1,4',
      '1,4,3,2',
      '-90,0,90,1',
      'NaN,1,2,3',
      '1,2,Infinity,3',
    ]) {
      expect(() => parseBounds(value)).toThrow();
    }
  });
  it('preserves a zero minimum and rejects inverted ranges', () => {
    expect(buildPostWhere({ minPrice: 0, maxPrice: 10 }).price[Op.gte]).toBe(0);
    expect(() => buildPostWhere({ minArea: 80, maxArea: 20 })).toThrow();
  });
  it('uses identical predicates across pages and sorting', () => {
    const filters = { district: 'Quận 1', minPrice: 3, maxPrice: 10 };
    expect(buildPostWhere({ ...filters, page: 1, limit: 12 })).toEqual(
      buildPostWhere({ ...filters, page: 9, limit: 80, sort: 'price_asc' }),
    );
  });
  it('intersects geographic bounds and a radius, rather than discarding one', () => {
    const where = buildPostWhere({
      bounds: '10,106,11,107',
      centerLat: 10.8,
      centerLng: 106.7,
      radius: 5,
    });
    expect(where[Op.and]).toHaveLength(2);
  });
  it('bounds grid groups to at most 63 even at a continent-sized viewport', () => {
    for (const box of [
      '10.7,106.6,10.9,106.9',
      '-85,-180,85,180',
      '10,106,10.000001,106.000001',
    ]) {
      const [s, w, n, e] = parseBounds(box);
      const grid = mapGrid(box);
      const cells =
        (Math.floor(n / grid.lat) - Math.floor(s / grid.lat) + 1) *
        (Math.floor(e / grid.lng) - Math.floor(w / grid.lng) + 1);
      expect(cells).toBeLessThanOrEqual(63);
    }
  });
});
