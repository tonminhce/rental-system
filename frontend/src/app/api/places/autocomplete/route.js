import { goongRequest, validText, badRequest } from "@/server/goong";
export async function GET(request) {
  const input = request.nextUrl.searchParams.get("input");
  if (!validText(input)) return badRequest();
  return goongRequest("Place/AutoComplete", { input, location: "10.7769,106.7009", limit: 6 });
}
