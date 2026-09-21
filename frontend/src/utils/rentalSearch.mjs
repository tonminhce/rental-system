export const RENTAL_FILTER_KEYS = [
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "centerLng",
  "centerLat",
  "radius",
  "bounds",
  "district",
  "province",
  "propertyType",
  "minBedrooms",
  "minBathrooms",
  "sort",
];

export function rentalFilters(search, transactionType = "rent") {
  const values = Object.fromEntries(
    [...search.entries()].filter(([key, value]) => RENTAL_FILTER_KEYS.includes(key) && value),
  );
  if (search.getAll("propertyType").length) values.propertyType = search.getAll("propertyType").join(",");
  return { ...values, transactionType };
}

export function updateRentalSearch(search, values) {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(values)) {
    params.delete(key);
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else if (value != null && value !== "") params.set(key, String(value));
  }
  params.delete("page");
  return params;
}

export function rentalPage(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
}

export function formatRent(price) {
  return Number(price) > 0
    ? `${Number(price).toLocaleString("en-US", { maximumFractionDigits: 2 })}M ₫`
    : "Ask for price";
}
