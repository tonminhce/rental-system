import test from "node:test";
import assert from "node:assert/strict";
import { rentalFilters, rentalPage, updateRentalSearch, formatRent } from "../src/utils/rentalSearch.mjs";
import { startRentalRoute } from "../src/utils/rentalRoute.mjs";
import { declutterMarkers } from "../src/utils/mapMarkers.mjs";

test("decluttering preserves every home without overlapping labels", () => {
  const markers = Array.from({ length: 60 }, (_, i) => ({
    key: String(i),
    count: i + 1,
    coordinates: [(i % 6) * 50, Math.floor(i / 6) * 50],
    bounds: [i, i, i + 1, i + 1],
  }));
  const project = ([x, y]) => ({ x, y });
  const groups = declutterMarkers(markers, project, { maxMarkers: 12, minDistance: 80 });
  assert.ok(groups.length <= 12);
  assert.equal(
    groups.reduce((n, m) => n + m.count, 0),
    markers.reduce((n, m) => n + m.count, 0),
  );
  for (let i = 0; i < groups.length; i++)
    for (let j = i + 1; j < groups.length; j++) {
      assert.ok(
        Math.hypot(
          groups[i].coordinates[0] - groups[j].coordinates[0],
          groups[i].coordinates[1] - groups[j].coordinates[1],
        ) >= 80,
      );
    }
  assert.deepEqual(declutterMarkers([...markers].reverse(), project, { maxMarkers: 12, minDistance: 80 }), groups);
  assert.equal(markers.length, 60);
});
test("a solitary home keeps its details and true location", () => {
  const marker = {
    key: "1",
    id: 8,
    count: 1,
    price: 4,
    coordinates: [106.7, 10.8],
    bounds: [10.8, 106.7, 10.8, 106.7],
  };
  assert.deepEqual(
    declutterMarkers([marker], ([x, y]) => ({ x, y })),
    [marker],
  );
});

test("map filters do not depend on list pagination", () => {
  assert.deepEqual(
    rentalFilters(new URLSearchParams("page=1&limit=12&maxPrice=5")),
    rentalFilters(new URLSearchParams("page=20&limit=100&maxPrice=5")),
  );
});
test("filter updates preserve other filters and reset page atomically", () => {
  const updated = updateRentalSearch("page=8&district=Quận+1&minPrice=3&propertyType=room", {
    minPrice: 0,
    maxPrice: 8,
    propertyType: ["house", "room"],
  });
  assert.equal(updated.get("page"), null);
  assert.equal(updated.get("district"), "Quận 1");
  assert.equal(updated.get("minPrice"), "0");
  assert.equal(updated.get("maxPrice"), "8");
  assert.deepEqual(updated.getAll("propertyType"), ["house", "room"]);
});
test("page validation rejects invalid URLs", () => {
  for (const input of ["-1", "0", "NaN", "Infinity", "1.5", "9007199254740992"]) assert.equal(rentalPage(input), 1);
  assert.equal(rentalPage("12"), 12);
  assert.equal(formatRent(0), "Ask for price");
});

function fixture() {
  const layers = new Map();
  const sources = new Map();
  const results = [];
  const map = {
    getLayer: (id) => layers.get(id),
    getSource: (id) => sources.get(id),
    removeLayer: (id) => layers.delete(id),
    removeSource: (id) => {
      assert.equal(layers.size, 0);
      sources.delete(id);
    },
    addLayer: (layer) => layers.set(layer.id, layer),
    addSource: (id, source) => sources.set(id, source),
    fitBounds() {},
  };
  return {
    map,
    layers,
    sources,
    results,
    origin: "10.8,106.7",
    destination: "10.9,106.8",
    decode: () => [
      [10.8, 106.7],
      [10.9, 106.8],
    ],
    onResult: (r) => results.push(r),
  };
}
const response = () => ({
  ok: true,
  json: async () => ({
    routes: [
      { overview_polyline: { points: "encoded" }, legs: [{ distance: { value: 2000 }, duration: { value: 300 } }] },
    ],
  }),
});

test("closing the home removes the route layer and source", async () => {
  const f = fixture();
  const route = startRentalRoute({ ...f, request: async () => response() });
  await route.done;
  assert.equal(f.layers.size, 1);
  assert.equal(f.results[0].status, "ready");
  route.cancel();
  route.cancel();
  assert.equal(f.layers.size, 0);
  assert.equal(f.sources.size, 0);
});
test("closing while a route is pending prevents a late response from drawing", async () => {
  const f = fixture();
  let resolve;
  let signal;
  const route = startRentalRoute({
    ...f,
    request: (_, options) => {
      signal = options.signal;
      return new Promise((done) => {
        resolve = done;
      });
    },
  });
  route.cancel();
  resolve(response());
  await route.done;
  assert.equal(signal.aborted, true);
  assert.equal(f.layers.size, 0);
  assert.equal(f.results.length, 0);
});
test("switching homes cannot let the previous route overwrite the new one", async () => {
  const f = fixture();
  let resolve;
  const first = startRentalRoute({
    ...f,
    request: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  first.cancel();
  const second = startRentalRoute({ ...f, destination: "11,107", request: async () => response() });
  await second.done;
  resolve(response());
  await first.done;
  assert.equal(f.results.length, 1);
  assert.equal(f.layers.size, 1);
  second.cancel();
  assert.equal(f.sources.size, 0);
});
test("provider failure is visible and leaves no route behind", async () => {
  const f = fixture();
  const route = startRentalRoute({ ...f, request: async () => ({ ok: false }) });
  await route.done;
  assert.deepEqual(f.results, [{ status: "error" }]);
  assert.equal(f.layers.size, 0);
});
