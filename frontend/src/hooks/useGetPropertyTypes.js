import { PROPERTY_TYPES } from "@/constants/propertyTypes";
import _ from "lodash";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function useGetPropertyTypes() {
  const searchParam = useSearchParams();
  const propertyTypesQuery = searchParam.getAll("propertyType") ?? [];
  const propertyTypes = useMemo(() =>
    propertyTypesQuery ? _.intersection(Object.keys(PROPERTY_TYPES), propertyTypesQuery) : []
  );
  return propertyTypes;
}
