import usePlaceAutocomplete from "@/hooks/usePlaceAutocomplete";
import { setLocationFilter } from "@/redux/features/filter/filterSlice";
import { useDispatch } from "react-redux";
import { Autocomplete, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { StringParam, useQueryParam } from "use-query-params";
import eventBus, { CHATBOT_EVENTS } from '@/utils/chatbotEventBus';

export default function AddressInput() {
  const [addressInput, setAddressInput, suggestions] = usePlaceAutocomplete();
  const [address, setAddress] = useState(null);
  const [formattedAddress, setFormattedAddress] = useState(null);
  const [, setCenterLat] = useQueryParam("centerLat", StringParam);
  const [, setCenterLng] = useQueryParam("centerLng", StringParam);
  const [, setBoundary] = useQueryParam("bounds", StringParam);
  const dispatch = useDispatch();

  const handleAddressChange = (_, address) => {
    setAddress(address);
  };

  // Listen for chatbot location updates
  useEffect(() => {
    const handleLocationUpdate = (data) => {
      console.log("Received location update from chatbot:", data);
      if (data.centerLat && data.centerLng) {
        // Update query params directly
        setCenterLat(data.centerLat.toString());
        setCenterLng(data.centerLng.toString());
        setBoundary(null);
        
        // Update redux store
        dispatch(setLocationFilter({
          centerLat: data.centerLat,
          centerLng: data.centerLng,
          bounds: null
        }));
        
        // If we have a location name from the chatbot, use it
        if (data.locationName && data.locationName !== "Searched Location") {
          // Create a mock place object that matches the expected structure
          const mockPlace = {
            place_id: `chatbot-${Date.now()}`,
            description: data.locationName,
          };
          
          setFormattedAddress(data.locationName);
          setAddressInput(data.locationName);
          setAddress(mockPlace); // This ensures the autocomplete value is updated
        } else {
          // Otherwise, reverse geocode to get the formatted address
          fetch(`/api/geocoding?lat=${data.centerLat}&lng=${data.centerLng}`)
            .then(response => response.json())
            .then(responseData => {
              if (responseData.results && responseData.results[0] && responseData.results[0].formatted_address) {
                const formattedAddr = responseData.results[0].formatted_address;
                
                // Create a mock place object that matches the expected structure
                const mockPlace = {
                  place_id: `chatbot-${Date.now()}`,
                  description: formattedAddr,
                };
                
                setFormattedAddress(formattedAddr);
                setAddressInput(formattedAddr);
                setAddress(mockPlace); // This ensures the autocomplete value is updated
                
                console.log("Updated address input to:", formattedAddr);
              }
            })
            .catch(error => console.error("Error reverse geocoding:", error));
        }
      }
    };

    // Subscribe to chatbot location updates
    eventBus.subscribe(CHATBOT_EVENTS.UPDATE_MAP_LOCATION, handleLocationUpdate);

    return () => {
      eventBus.unsubscribe(CHATBOT_EVENTS.UPDATE_MAP_LOCATION, handleLocationUpdate);
    };
  }, [dispatch, setCenterLat, setCenterLng, setBoundary]);

  useEffect(() => {
    const getGeoData = async (address) => {
      const url = `/api/geocoding?address=${encodeURIComponent(address)}`;
      const response = await fetch(url.toString());
      const data = await response.json();
      
      // Store the formatted address
      if (data.results && data.results[0] && data.results[0].formatted_address) {
        setFormattedAddress(data.results[0].formatted_address);
        setAddressInput(data.results[0].formatted_address);
      }
      
      return data.results[0].geometry;
    };

    if (address?.place_id) {
      getGeoData(address.description)
        .then((geometry) => {
          const { location, boundary } = geometry;
          const { lng, lat } = location;
          setCenterLng(lng.toString());
          setCenterLat(lat.toString());

          if (boundary) {
            setBoundary(boundary);
          } else {
            setBoundary(null);
          }
          
          dispatch(setLocationFilter({
            centerLat: lat,
            centerLng: lng,
            bounds: boundary || null
          }));
        })
        .catch((e) => {
          console.error("Error getting geodata:", e);
          setCenterLat(null);
          setCenterLng(null);
          setBoundary(null);
          
          dispatch(setLocationFilter({
            centerLat: null,
            centerLng: null,
            bounds: null
          }));
        });
    } else if (!address) {
      setCenterLat(null);
      setCenterLng(null);
      setBoundary(null);
      
      dispatch(setLocationFilter({
        centerLat: null,
        centerLng: null,
        bounds: null
      }));
    }
  }, [address, setCenterLat, setCenterLng, setBoundary, dispatch]);

  return (
    <Autocomplete
      size="small"
      id="address-autocomplete"
      filterOptions={(x) => x}
      noOptionsText="No address found"
      onChange={handleAddressChange}
      value={address}
      inputValue={addressInput}
      onInputChange={(_, newInputValue) => {
        setAddressInput(newInputValue);
      }}
      options={suggestions}
      getOptionLabel={(option) => option.description || ""}
      isOptionEqualToValue={(option, value) => 
        option.place_id === value.place_id || 
        option.description === value.description
      }
      sx={{ width: 300 }}
      renderInput={(params) => (
        <TextField {...params} variant="outlined" label="Search for city, neighborhood or location" />
      )}
    />
  );
}