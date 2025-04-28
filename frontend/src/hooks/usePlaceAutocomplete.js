import { useEffect, useState } from "react";
import { debounce } from "lodash";

export default function usePlaceAutocomplete() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);

  const getAddressOptions = debounce(async () => {
    const response = await fetch(`/api/places/autocomplete?input=${input}`);
    const data = await response.json();
    setOptions(data?.predictions || []);
  }, 500);

  useEffect(() => {
    if (input) getAddressOptions();

    return () => {
      getAddressOptions.cancel();
    };
  }, [input]);

  return [input, setInput, options];
}
