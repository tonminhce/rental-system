import usePlaceAutocomplete from "@/hooks/usePlaceAutocomplete";
import { setLocationFilter } from "@/redux/features/filter/filterSlice";
import { useDispatch } from "react-redux";
import { Autocomplete, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { StringParam, useQueryParam } from "use-query-params";

export default function AddressInput() {
  const [addressInput, setAddressInput, suggestions] = usePlaceAutocomplete();
  const [address, setAddress] = useState(null);
  const [, setCenterLat] = useQueryParam("centerLat", StringParam);
  const [, setCenterLng] = useQueryParam("centerLng", StringParam);
  const [, setBoundary] = useQueryParam("bounds", StringParam);
  const dispatch = useDispatch();

  const handleAddressChange = (_, address) => {
    setAddress(address);
  };

  useEffect(() => {
    const getGeoData = async (address) => {
      const url = `/api/geocoding?address=${address}`;
      const response = await fetch(url.toString());
      const data = await response.json();
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
          setCenterLat(null);
          setCenterLng(null);
          setBoundary(null);
          
          dispatch(setLocationFilter({
            centerLat: null,
            centerLng: null,
            bounds: null
          }));
        });
    } else {
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
      getOptionLabel={(option) => option.description}
      isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
      sx={{ width: 300 }}
      renderInput={(params) => (
        <TextField {...params} variant="outlined" label="Search for city, neighborhood or location" />
      )}
    />
  );
}