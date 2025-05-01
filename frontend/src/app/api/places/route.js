export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get('input');
  
  if (!input) {
    return Response.json({ error: 'Input parameter is required' }, { status: 400 });
  }

  try {
    const requestURL = new URL('https://rsapi.goong.io/Place/AutoComplete');
    
    // Use the server-side API key
    requestURL.searchParams.append('api_key', process.env.GOONG_API_KEY);
    requestURL.searchParams.append('input', input);
    
    // Optional parameters
    const location = searchParams.get('location');
    if (location) {
      requestURL.searchParams.append('location', location);
    }

    const radius = searchParams.get('radius');
    if (radius) {
      requestURL.searchParams.append('radius', radius);
    }

    const more_compound = searchParams.get('more_compound');
    if (more_compound) {
      requestURL.searchParams.append('more_compound', more_compound);
    }
    
    const response = await fetch(requestURL.toString());
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return Response.json(
      { error: 'Failed to get place suggestions' },
      { status: 500 }
    );
  }
} 