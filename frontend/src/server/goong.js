import "server-only";

// A per-process ceiling is defense-in-depth; use a shared edge limiter for deployment.
let windowStart = 0;
let calls = 0;
export async function goongRequest(endpoint, params) {
  if (!process.env.GOONG_API_KEY) return Response.json({ error: "Maps service is not configured" }, { status: 503 });
  const now = Date.now();
  if (now - windowStart > 60000) {
    windowStart = now;
    calls = 0;
  }
  if (++calls > 180) return Response.json({ error: "Please try again shortly" }, { status: 429 });
  const url = new URL(`https://rsapi.goong.io/${endpoint}`);
  for (const [key, value] of Object.entries(params))
    if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, value);
  url.searchParams.set("api_key", process.env.GOONG_API_KEY);
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) return Response.json({ error: "Maps service is temporarily unavailable" }, { status: 502 });
    return Response.json(await response.json());
  } catch {
    return Response.json({ error: "Maps service is temporarily unavailable" }, { status: 502 });
  }
}
export const validText = (value) => typeof value === "string" && value.trim().length > 0 && value.length <= 250;
export function validCoordinate(value) {
  if (!value || !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(value)) return false;
  const [lat, lng] = value.split(",").map(Number);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
export const badRequest = () => Response.json({ error: "Invalid or missing map query" }, { status: 400 });
