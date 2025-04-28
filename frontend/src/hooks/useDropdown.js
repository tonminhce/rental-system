import { useEffect, useRef, useState } from "react";

export default function useDropdown() {
  const elementRef = useRef(null);
  const [isOpened, setIsOpened] = useState(false);

  const toggleDropdown = () => setIsOpened((prev) => !prev);

  const handleClickOutside = (e) => {
    if (elementRef.current.contains(e.target)) {
      return;
    }

    toggleDropdown();
  };

  useEffect(() => {
    if (!isOpened || !elementRef.current) return;

    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, [elementRef, isOpened]);

  return [elementRef, isOpened, toggleDropdown];
}
