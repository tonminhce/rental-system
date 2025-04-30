export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const requestURL = new URL("https://rsapi.goong.io/Place/AutoComplete");
  requestURL.searchParams.append("api_key", process.env.GOONG_API_KEY);
  requestURL.searchParams.append("input", searchParams.get("input"));

  const response = await fetch(requestURL.toString());
  const data = await response.json();

  return Response.json(data);
}
