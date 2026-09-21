# Rental discovery follow-up — 2026-09-21

## Design decision

The map represents the filtered inventory in its current viewport, not the current list page. A map is a geographic browsing surface; the list remains the accessible, sortable, paginated way to inspect every result.

The first clustered implementation was too dense. The revised design budgets 8–20 prominent pins according to the available map area (about 12–13 in the checked desktop split view, 8 on mobile). Nearby groups merge when their centers are less than 80 screen pixels apart. This is a local design choice, not a claim that this number is universally optimal.

Sources consulted:

- [Airbnb: How search results work](https://www.airbnb.com/help/article/39) explicitly distinguishes geographic map results from list results.
- [Learning to Rank for Maps at Airbnb](https://arxiv.org/html/2407.00091v1), sections 3 and 6, discusses visual attention, fewer salient pins, and tiers of map information. We borrow the progressive-disclosure principle, not Airbnb's ranking algorithm or conversion claims.
- [Mapbox: HTML clusters](https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/) and [Goong source documentation](https://document.goong.io/tutorial-Source.html) describe clustered map sources and drill-down. Our database-side grouping keeps full inventory out of browser memory.

## Behavior

- Light count clusters at overview scale; individual price pills when a group resolves to one home. Merging preserves all counts and bounds, not a random sample.
- Tapping a group zooms in; Search this area deliberately changes the list's geographic filter and resets pagination. Price/type/size filters stay intact.
- Filters and pages live in the URL. Filter updates are atomic; sorting and pagination have a unique ID tie-breaker. Page changes do not move the map.
- Card Map buttons select one home. Close, Escape, changing selection/filter, hiding the map, and unmounting cancel pending routes and remove the layer/source. Other pins are hidden while routing.
- Expanded desktop map and mobile List/Map switch; ResizeObserver keeps the map sized correctly. Wheel zoom is disabled so page scrolling is predictable; buttons/pinch still zoom.
- Be Vietnam Pro supplies Vietnamese typography. Rental cards have larger metadata and multi-line titles; medium desktop widths use horizontal cards.
- Detail pages have a separate single-location map and do not query the whole inventory.

## API and limits

`GET /api/posts/map?mapBounds=south,west,north,east` shares price/type/status/geographic predicates with `GET /api/posts`. Bounds and sorting inputs are validated. The database returns at most 63 grid groups, with count, center and extent; individual groups of one also carry a minimal home preview. Descriptions, photos, contact data, and entire listing payloads are not loaded for every map point.

Grid grouping is approximate aggregation, not an exact building boundary. A group search uses its enclosing rectangle and may include additional homes. Pagination parameters never affect map counts. Migration `20260921010000-map-search-index.js` adds viewport and stable-order indexes. Production-scale concurrency/load testing is still required; no 100k production-readiness claim is made.

## Verification

- Frontend production build and backend build succeed.
- 13 frontend regression checks cover count-preserving decluttering, spacing, page/filter behavior, route cleanup/races/failure, concurrent session refresh, and the imported-photo host allowlist.
- 9 backend unit checks cover filters, bounds, coordinates, bounded grouping, and passwords.
- Read-only `backend/scripts/smoke-map.cjs` checks exact map/list count agreement, page independence, stable pages, sorting and radius/bounds intersection against local data.
- Extended `backend/scripts/smoke-local.cjs` checks roommate onboarding, profile create/update, suggestions and absence of email/phone in the public directory, then removes only its own disposable account.
- Browser acceptance: later list page leaves pins unchanged; price filter returns to page 1; live bike route closes cleanly; expanded and 390px mobile maps render with reduced density.
- Photo defect: detail pages used Next's optimizer, but `cdn.chotot.com` was absent from its allowlist, returning HTTP 400 despite the source image returning 200. Added the explicit HTTPS host (no wildcard host), gallery error/retry UI, and priority loading for the leading photo. Rental-card image error state resets when its URL changes.

## Inventory release blocker

The inherited local database contains 4,089 active listings, not just the six original previews. The inherited import scripts assigned a random or fixed HCMC point when coordinates were missing. Future imports now preserve missing coordinates as null; list/detail APIs no longer convert null into zero. These legacy importers are limited to the local database.

Existing imported coordinates have NOT been overwritten or repaired. Inventory is labeled unverified; availability, rental-vs-sale classification, source rights, price/area units, contacts, and coordinates require a provenance audit before public release. No new bulk crawl/import was launched in this follow-up. The pre-existing crawler process was not stopped or replaced, and its completion count was not verified.
