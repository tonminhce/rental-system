import { useEffect, useState } from "react";

export default function useFormInput(initialValue) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");

  // Clear error when value changes
  useEffect(() => {
    setError("");
  }, [value]);

  return [value, setValue, error, setError];
}
