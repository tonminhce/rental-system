import { goongRequest, validText, badRequest } from "@/server/goong";
export async function GET(request) {
  const place_id = request.nextUrl.searchParams.get("place_id");
  if (!validText(place_id)) return badRequest();
  return goongRequest("Place/Detail", { place_id });
}
