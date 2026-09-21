import { useEffect, useState } from "react";

export default function usePlaceAutocomplete() {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    if (input.trim().length < 2) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Autocomplete unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setOptions(data.predictions || []);
      } catch {
        if (!controller.signal.aborted) setOptions([]);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input]);
  return [input, setInput, options];
}
