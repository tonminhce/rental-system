import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { updateRentalSearch } from "@/utils/rentalSearch.mjs";

export default function useRentalFilters() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const update = useCallback(
    (values) => {
      router.push(`${pathname}?${updateRentalSearch(window.location.search, values)}`, { scroll: false });
    },
    [pathname, router],
  );
  return [search, update];
}
