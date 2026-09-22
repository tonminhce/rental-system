import usePlaceAutocomplete from "@/hooks/usePlaceAutocomplete";
import useRentalFilters from "@/hooks/useRentalFilters";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";

export default function AddressInput() {
  const [input, setInput, suggestions] = usePlaceAutocomplete();
  const [search, update] = useRentalFilters();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(null);
  const label = search.get("location") || "";
  useEffect(() => {
    setInput(label);
  }, [label, setInput]);
  useEffect(() => () => pending.current?.abort(), []);
  const select = async (_, place) => {
    pending.current?.abort();
    setError("");
    if (!place) {
      setBusy(false);
      update({ centerLat: null, centerLng: null, bounds: null, radius: null, location: null });
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    try {
      const response = await fetch(`/api/geocoding?address=${encodeURIComponent(place.description)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Geocoding failed");
      const data = await response.json();
      if (controller.signal.aborted) return;
      const point = data.results?.[0]?.geometry?.location;
      if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lng)) throw new Error("No coordinates");
      update({
        centerLat: point.lat,
        centerLng: point.lng,
        radius: 5,
        bounds: null,
        district: null,
        province: null,
        location: place.description,
      });
    } catch (e) {
      if (e.name !== "AbortError") setError("Couldn’t find this place. Please try again.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  return (
    <Autocomplete
      size="small"
      id="address-autocomplete"
      filterOptions={(x) => x}
      noOptionsText={input.length < 2 ? "Start typing a place" : "No places found"}
      onChange={select}
      value={label ? { description: label } : null}
      inputValue={input}
      onInputChange={(_, text, reason) => {
        if (reason !== "reset") setInput(text);
      }}
      loading={busy}
      options={suggestions}
      getOptionLabel={(option) => option.description || ""}
      isOptionEqualToValue={(option, value) => option.description === value.description}
      sx={{ width: { xs: "100%", sm: 300 }, flexGrow: 1 }}
      renderInput={(params) => (
        <TextField {...params} label="Search a neighborhood or place" error={!!error} helperText={error || undefined} />
      )}
    />
  );
}
