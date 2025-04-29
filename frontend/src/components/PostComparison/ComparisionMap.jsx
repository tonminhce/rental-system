import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Autocomplete,
  CircularProgress,
  ListItem,
  ListItemText
} from '@mui/material';
import goongJs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
import polyline from "@mapbox/polyline";
import { DirectionsOutlined, LocationOn, PlaceOutlined } from '@mui/icons-material';
import usePlaceAutocomplete from "@/hooks/usePlaceAutocomplete";

const GOONG_API_KEY = process.env.NEXT_PUBLIC_GOONG_API_KEY || process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;


const ComparisonMap = ({ post1, post2 }) => {
  const mapContainer1Ref = useRef(null);
  const mapContainer2Ref = useRef(null);
  const map1Ref = useRef(null);
  const map2Ref = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [startCoordinates, setStartCoordinates] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  
  const [searchInput, setSearchInput, suggestions] = usePlaceAutocomplete();
  
  useEffect(() => {
    if (!mapContainer1Ref.current || !mapContainer2Ref.current) return;
    
    goongJs.accessToken = GOONG_API_KEY;
    
    const getCoordinates = (post) => {
      if (!post?.coordinates?.coordinates) return [106.660172, 10.762622];
      return [post.coordinates.coordinates[1], post.coordinates.coordinates[0]];
    };

    const map1Coordinates = getCoordinates(post1);
    const map1 = new goongJs.Map({
      container: mapContainer1Ref.current,
      style: "https://tiles.goong.io/assets/goong_light_v2.json",
      zoom: 14,
      center: map1Coordinates
    });
    
    // Add marker for property 1 location
    new goongJs.Marker({
      color: '#4285F4' 
    })
      .setLngLat(map1Coordinates)
      .addTo(map1);
    
    const map2Coordinates = getCoordinates(post2);
    const map2 = new goongJs.Map({
      container: mapContainer2Ref.current,
      style: "https://tiles.goong.io/assets/goong_light_v2.json",
      zoom: 14,
      center: map2Coordinates
    });
    
    // Add marker for property 2 location
    new goongJs.Marker({
      color: '#EA4335' // Red marker for property 2
    })
      .setLngLat(map2Coordinates)
      .addTo(map2);
    
    map1Ref.current = map1;
    map2Ref.current = map2;
    
    return () => {
      if (map1Ref.current) map1Ref.current.remove();
      if (map2Ref.current) map2Ref.current.remove();
    };
  }, [post1, post2]);

  // Handle suggestion selection
  const handlePlaceSelect = (event, place) => {
    if (place) {
      setSelectedPlace(place);
      setError('');
    }
  };

  // Handle geocoding and route rendering
  const handleSearch = async () => {
    if (!selectedPlace) {
      setError('Please select a starting location');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Get coordinates from the selected place
      const encodedAddress = encodeURIComponent(selectedPlace.description);
      const response = await fetch(`/api/geocode?address=${encodedAddress}`);
      const geocodeData = await response.json();

      if (!geocodeData.results || geocodeData.results.length === 0) {
        setError('Location not found. Please try a different address.');
        setIsSearching(false);
        return;
      }

      const location = geocodeData.results[0];
      const startCoords = [location.geometry.location.lng, location.geometry.location.lat];
      setStartCoordinates(startCoords);

      // Add green marker for starting point on both maps
      addStartMarker(map1Ref.current, startCoords);
      addStartMarker(map2Ref.current, startCoords);

      // Now get routes for both properties using the backend API
      const getDestCoords = (post) => {
        if (!post?.coordinates?.coordinates) return null;
        return [post.coordinates.coordinates[1], post.coordinates.coordinates[0]];
      };
      
      const dest1Coords = getDestCoords(post1);
      const dest2Coords = getDestCoords(post2);
      
      if (dest1Coords) {
        const originStr = `${startCoords[1]},${startCoords[0]}`;
        const destStr = `${dest1Coords[1]},${dest1Coords[0]}`;
        // Use bike as default vehicle
        renderRouteWithVehicle(map1Ref.current, originStr, destStr, 'bike', '#4285F4');
      }
      
      if (dest2Coords) {
        const originStr = `${startCoords[1]},${startCoords[0]}`;
        const destStr = `${dest2Coords[1]},${dest2Coords[0]}`;
        // Use bike as default vehicle
        renderRouteWithVehicle(map2Ref.current, originStr, destStr, 'bike', '#EA4335');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const renderRouteWithVehicle = (mapInstance, origin, destination, vehicle, color) => {
    try {
      if (mapInstance.getLayer('route-layer')) {
        mapInstance.removeLayer('route-layer');
      }
      if (mapInstance.getSource('route')) {
        mapInstance.removeSource('route');
      }
    } catch (error) {
      console.error('Error cleaning up route:', error);
    }
    
    const renderRouteWithParams = async () => {
      try {
        // Always use bike as the vehicle type
        const routeUrl = `/api/direction?origin=${origin}&destination=${destination}&vehicle=bike`;
        const routeResponse = await fetch(routeUrl);
        const routeData = await routeResponse.json();
  
        if (!routeData.routes || routeData.routes.length === 0) {
          console.error('No route found');
          return;
        }
  
        const route = routeData.routes[0];
        const routeGeometry = route.overview_polyline.points;
        const decodedRoute = polyline.decode(routeGeometry);
        
        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: decodedRoute.map(point => [point[1], point[0]])
            }
          }
        });
  
        mapInstance.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': color,
            'line-width': 6,
            'line-opacity': 0.7
          }
        });
  
        const bounds = new goongJs.LngLatBounds();
        const startCoords = origin.split(',').reverse().map(parseFloat);
        const endCoords = destination.split(',').reverse().map(parseFloat);
        bounds.extend(startCoords);
        bounds.extend(endCoords);
  
        mapInstance.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 }
        });
  
        new goongJs.Popup({ closeButton: false, closeOnClick: false })
          .setLngLat(endCoords)
          .setHTML(`
            <div style="font-family: Arial, sans-serif; padding: 5px;">
              <strong>Distance:</strong> ${(route.legs[0].distance.value / 1000).toFixed(1)} km<br>
              <strong>Duration:</strong> ${Math.round(route.legs[0].duration.value / 60)} mins
            </div>
          `)
          .addTo(mapInstance);
      } catch (error) {
        console.error('Error rendering route:', error);
      }
    };
    
    renderRouteWithParams();
  };

  // Cải thiện hàm addStartMarker để đảm bảo marker hiển thị trên cả hai map
  const addStartMarker = (mapInstance, coords) => {
    // Tạo marker mới cho mỗi map, không xóa marker cũ
    // Sử dụng ID duy nhất cho mỗi instance để tránh xung đột
    const markerId = mapInstance === map1Ref.current ? 'start-marker-1' : 'start-marker-2';
    
    // Tạo marker mới
    const marker = new goongJs.Marker({
      color: '#34A853',
      element: createMarkerElement(markerId, 'Start')
    });
    
    // Thêm vào map
    marker.setLngLat(coords).addTo(mapInstance);
  };

  const createMarkerElement = (className, label) => {
    const element = document.createElement('div');
    element.className = className;
    element.style.width = '30px';
    element.style.height = '30px';
    element.style.borderRadius = '50%';
    element.style.backgroundColor = '#34A853';
    element.style.border = '2px solid white';
    element.style.display = 'flex';
    element.style.justifyContent = 'center';
    element.style.alignItems = 'center';
    element.style.color = 'white';
    element.style.fontWeight = 'bold';
    element.style.fontSize = '14px';
    element.innerHTML = 'A';
    element.title = label;
    
    return element;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Compare Travel Routes
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1, minWidth: '250px' }}>
            <Autocomplete
              value={selectedPlace}
              onChange={handlePlaceSelect}
              inputValue={searchInput}
              onInputChange={(_, newInputValue) => setSearchInput(newInputValue)}
              options={suggestions}
              getOptionLabel={(option) => option.description}
              isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
              renderOption={(props, option) => (
                <ListItem {...props}>
                  <PlaceOutlined sx={{ mr: 1, color: '#666' }} />
                  <ListItemText 
                    primary={option.structured_formatting?.main_text || option.description}
                    secondary={option.structured_formatting?.secondary_text}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItem>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Enter your starting location"
                  variant="outlined"
                  placeholder="E.g. Đại Học Bách Khoa HCM"
                  size="small"
                  error={!!error}
                  helperText={error}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <LocationOn sx={{ color: '#34A853', mr: 1 }} />,
                    endAdornment: (
                      <>
                        {isSearching ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSearch}
            disabled={isSearching || !selectedPlace}
            startIcon={<DirectionsOutlined />}
            sx={{ minWidth: '120px' }}
          >
            {isSearching ? 'Searching...' : 'Show Routes'}
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '48%' } }}>
          <Box sx={{ 
            p: 1, 
            mb: 1, 
            bgcolor: '#E3F2FD', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                bgcolor: '#4285F4', 
                borderRadius: '50%',
                mr: 1 
              }} 
            />
            <Typography variant="subtitle2">
              {post1?.name || 'Property 1'}
            </Typography>
          </Box>
          <Box 
            ref={mapContainer1Ref} 
            sx={{ 
              height: 300, 
              borderRadius: 1, 
              overflow: 'hidden',
              border: '1px solid #e0e0e0'
            }} 
          />
        </Box>
        
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '48%' } }}>
          <Box sx={{ 
            p: 1, 
            mb: 1, 
            bgcolor: '#FFEBEE', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                bgcolor: '#EA4335', 
                borderRadius: '50%',
                mr: 1 
              }} 
            />
            <Typography variant="subtitle2">
              {post2?.name || 'Property 2'}
            </Typography>
          </Box>
          <Box 
            ref={mapContainer2Ref} 
            sx={{ 
              height: 300, 
              borderRadius: 1, 
              overflow: 'hidden',
              border: '1px solid #e0e0e0'
            }} 
          />
        </Box>
      </Box>
      
      {startCoordinates && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          Route information shows the fastest path by bike from your starting point to each property.
        </Typography>
      )}
    </Box>
  );
};

export default ComparisonMap; 