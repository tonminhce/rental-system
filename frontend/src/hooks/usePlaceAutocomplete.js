import { useEffect, useState } from "react";
import { debounce } from "lodash";

export default function usePlaceAutocomplete() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);

  const getAddressOptions = debounce(async () => {
    if (!input || input.trim() === "") {
      setOptions([]);
      return;
    }

    const encodedInput = encodeURIComponent(input.trim());
    const response = await fetch(`/api/places/autocomplete?input=${encodedInput}`);
    const data = await response.json();
    setOptions(data?.predictions || []);
  }, 500);

  useEffect(() => {
    if (input && input.trim() !== "") {
      getAddressOptions();
    } else {
      setOptions([]);
    }

    return () => {
      getAddressOptions.cancel();
    };
  }, [input]);

  return [input, setInput, options];
}
