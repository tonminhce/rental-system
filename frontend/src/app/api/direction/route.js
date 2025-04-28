export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const requestURL = new URL("https://rsapi.goong.io/Direction");

  requestURL.searchParams.append("api_key", process.env.GOONG_API_KEY);
  requestURL.searchParams.append("origin", searchParams.get("origin"));
  requestURL.searchParams.append("destination", searchParams.get("destination"));
  requestURL.searchParams.append("vehicle", searchParams.get("vehicle") ?? "car");

  const response = await fetch(requestURL.toString());
  const data = await response.json();

  return Response.json(data);
}
