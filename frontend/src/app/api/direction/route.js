import { goongRequest, validCoordinate, badRequest } from "@/server/goong";
export async function GET(request) {
  const query = request.nextUrl.searchParams;
  const origin = query.get("origin"),
    destination = query.get("destination"),
    vehicle = query.get("vehicle") || "car";
  if (
    !validCoordinate(origin) ||
    !validCoordinate(destination) ||
    !["car", "bike", "taxi", "truck", "hd"].includes(vehicle)
  )
    return badRequest();
  return goongRequest("Direction", { origin, destination, vehicle });
}
