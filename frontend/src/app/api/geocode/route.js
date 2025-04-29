export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  
  if (!address) {
    return Response.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  try {
    const requestURL = new URL('https://rsapi.goong.io/Geocode');
    
    // Use the server-side API key
    requestURL.searchParams.append('api_key', process.env.GOONG_API_KEY);
    requestURL.searchParams.append('address', address);
    
    const response = await fetch(requestURL.toString());
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    );
  }
} 