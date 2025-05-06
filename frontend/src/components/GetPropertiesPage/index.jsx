"use client";
import Map from "@/components/GetPropertiesPage/components/Map";
import useGetPropertyTypes from "@/hooks/useGetPropertyTypes";
import { useGetPropertiesQuery } from "@/redux/features/properties/propertyApi";
import { Box, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";
import FullscreenLoading from "../FullscreenLoading";
import PropertyList from "./components/PropertyList";

const MapContainer = styled(Box)(({ theme }) => ({
  position: "sticky",
  width: "100%",
  height: "80vh",
  borderRadius: 2,
  overflow: "hidden",
  marginLeft: theme.spacing(2),
  top: 116,
}));

export default function GetPropertiesPage({ transaction_type = "rent" }) {
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useQueryParam("page", withDefault(NumberParam, 1));

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    // window.scrollTo({ top: 0 });
  };

  const searchParam = useSearchParams();
  const propertyTypes = useGetPropertyTypes();
  const centerQs = searchParam.get("center");
  const boundary = searchParam.get("bounds");
  const [centerLng, centerLat] = centerQs
    ? centerQs.split(",").map((v) => parseFloat(v))
    : [106.660172, 10.762622];

  const supportedQuery = ["minPrice", "maxPrice", "minArea", "maxArea", "centerLng", "centerLat", "radius", "bounds"];
  const queryObj = useMemo(() => {
    const res = {};
    searchParam.forEach((value, key) => {
      if (supportedQuery.includes(key)) {
        res[key] = value;
      }
    });
    return res;
  }, [searchParam]);

  const { data, error, isLoading } = useGetPropertiesQuery({
    page: currentPage,
    limit: pageSize,
    propertyType: propertyTypes,
    transactionType: transaction_type,
    radius: 5,
    ...queryObj,
  });

  const transformedProperties = (data?.properties ?? []).map((property) => ({
    ...property,
    thumbnail: property.images?.length > 0 ? property.images[0].url : "https://www.pngitem.com/pimgs/m/152-1527570_default-house-icon-hd-png-download.png",
    address: {
      street: property.street || "",
      district: property.district || "",
      province: property.province || "",
      ward: property.ward || "",
    },
  }));

  const propertyMarkers = (data?.properties ?? []).map((property) => ({
    coordinates: property.coordinates,
    name: property.name,
    price: property.price,
    image: property.images?.length > 0 ? property.images[0].url : "https://www.pngitem.com/pimgs/m/152-1527570_default-house-icon-hd-png-download.png",
    id: property.id,
    displayed_address: property.displayedAddress,
    area: property.area || 0,
    bedrooms: property.bedrooms || 1,
    bathrooms: property.bathrooms || 1
  }));

  return (
    <Grid container>
      <Grid xs={12} sm={6} md={7}>
        {isLoading ? (
          <FullscreenLoading loading={isLoading} />
        ) : (
          <PropertyList
            properties={transformedProperties}
            totalPages={data?.pagination?.total_pages ?? 0}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
          />
        )}
      </Grid>
      <Grid xs={12} sm={6} md={5} sx={{ position: "relative" }}>
        <MapContainer>
          <Map center={[centerLng, centerLat]} markerList={propertyMarkers} />
        </MapContainer>
      </Grid>
    </Grid>
  );
}
