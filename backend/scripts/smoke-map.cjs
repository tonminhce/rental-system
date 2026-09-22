// Read-only local API checks. No accounts or listings are written.
const assert = require('node:assert/strict');
const root = 'http://127.0.0.1:8100/api';
async function get(path, expected = 200) {
  const response = await fetch(root + path);
  assert.equal(response.status, expected, path);
  const body = await response.json();
  return body.data;
}
async function main() {
  const filters = 'transactionType=rent&bounds=8,102,24,110';
  const first = await get(`/posts?${filters}&page=1&limit=12&sort=newest`);
  const second = await get(`/posts?${filters}&page=2&limit=12&sort=newest`);
  assert.ok(second.data.every((p) => !first.data.some((a) => a.id === p.id)));
  const wholeMap = await get(`/posts/map?${filters}&mapBounds=8,102,24,110`);
  assert.equal(wholeMap.total, first.pagination.total_records);
  assert.equal(
    wholeMap.markers.reduce((n, m) => n + m.count, 0),
    wholeMap.total,
  );
  assert.ok(wholeMap.markers.length <= 63);
  assert.ok(
    wholeMap.total > 12,
    'Map must represent more than a single list page',
  );
  const pageMap = await get(
    `/posts/map?${filters}&mapBounds=8,102,24,110&page=2&limit=1`,
  );
  assert.deepEqual(pageMap, wholeMap);
  const subset = await get(
    `/posts/map?${filters}&mapBounds=8,102,24,110&maxPrice=5&propertyType=room`,
  );
  const subsetList = await get(
    `/posts?${filters}&maxPrice=5&propertyType=room`,
  );
  assert.equal(subset.total, subsetList.pagination.total_records);
  const radiusFilters =
    'transactionType=rent&centerLat=10.78&centerLng=106.7&radius=5&bounds=10.7,106.6,10.9,106.8';
  const radiusMap = await get(
    `/posts/map?${radiusFilters}&mapBounds=10.7,106.6,10.9,106.8`,
  );
  const radiusList = await get(`/posts?${radiusFilters}`);
  assert.equal(radiusMap.total, radiusList.pagination.total_records);
  const ascending = await get(
    '/posts?transactionType=rent&sort=price_asc&limit=100',
  );
  assert.ok(
    ascending.data.every(
      (p, i, a) => i === 0 || Number(p.price) >= Number(a[i - 1].price),
    ),
  );
  for (const path of [
    '/posts/map',
    '/posts/map?mapBounds=11,106,10,107',
    '/posts/map?mapBounds=0,0,90,200',
    '/posts?sort=arbitrary',
    '/posts?minPrice=50&maxPrice=1',
  ])
    await get(path, 400);
  console.log(
    `PASS: ${wholeMap.total} mapped homes; ${wholeMap.markers.length} groups; page independence, exact counts, shared filters, radius intersection, stable pagination, sorting, validation.`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
