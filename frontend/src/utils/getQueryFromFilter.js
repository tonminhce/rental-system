export default function getQueryFromFilter(filter) {
  let queries = [];
  const { keyword, address, price, property_type } = filter;
  if (keyword) queries.push(`q=${keyword}`);
  if (address.province && address.province !== "All")
    queries.push(`address.province=${address.province}`);
  if (address?.districts.length !== 0)
    queries.push(`address.district=${address.districts[0]}`);
  if (price?.min) queries.push(`price[gt]=${price.min}`);
  if (price?.max) queries.push(`price[lt]=${price.max}`);
  if (property_type && property_type !== "all")
    queries.push(`property_type=${property_type}`);

  return queries.length > 0 ? "?" + queries.join("&") : "";
}
