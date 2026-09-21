import { goongRequest, validText, validCoordinate, badRequest } from "@/server/goong";
export async function GET(request) {
  const query = request.nextUrl.searchParams;
  const address = query.get("address");
  const latlng = query.get("latlng") || `${query.get("lat")},${query.get("lng")}`;
  if (validText(address)) return goongRequest("Geocode", { address });
  if (validCoordinate(latlng)) return goongRequest("Geocode", { latlng });
  return badRequest();
}
