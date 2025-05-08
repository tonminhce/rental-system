"use client";
import Map from "@/components/GetPropertiesPage/components/Map";
import useGetPropertyTypes from "@/hooks/useGetPropertyTypes";
import { useGetPropertiesQuery } from "@/redux/features/properties/propertyApi";
import { Box, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import { useSearchParams } from "next/navigation";
import { useMemo, useEffect } from "react";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";
import FullscreenLoading from "../FullscreenLoading";
import PropertyList from "./components/PropertyList";
import { useDispatch } from "react-redux";
import { updateFilter } from "@/redux/features/filter/filterSlice";
import eventBus, { CHATBOT_EVENTS } from '@/utils/chatbotEventBus';
import { useRouter } from 'next/navigation';
import { StringParam } from 'use-query-params';

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
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [, setCenterLat] = useQueryParam("centerLat", StringParam);
  const [, setCenterLng] = useQueryParam("centerLng", StringParam);
  const [, setRadius] = useQueryParam("radius", StringParam);
  
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const searchParam = useSearchParams();
  const propertyTypes = useGetPropertyTypes();
  
  const centerLat = searchParam.get("centerLat");
  const centerLng = searchParam.get("centerLng");
  const boundary = searchParam.get("bounds");
  
  const defaultLng = 106.660172;
  const defaultLat = 10.762622;

  const mapCenterLng = centerLng ? parseFloat(centerLng) : defaultLng;
  const mapCenterLat = centerLat ? parseFloat(centerLat) : defaultLat;

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

  useEffect(() => {
    const filterParams = {
      ...queryObj,
      page: currentPage,
      transactionType: transaction_type,
      propertyType: propertyTypes
    };
    
    if (filterParams.centerLat) filterParams.centerLat = parseFloat(filterParams.centerLat);
    if (filterParams.centerLng) filterParams.centerLng = parseFloat(filterParams.centerLng);
    if (filterParams.minPrice) filterParams.minPrice = parseFloat(filterParams.minPrice);
    if (filterParams.maxPrice) filterParams.maxPrice = parseFloat(filterParams.maxPrice);
    if (filterParams.minArea) filterParams.minArea = parseFloat(filterParams.minArea);
    if (filterParams.maxArea) filterParams.maxArea = parseFloat(filterParams.maxArea);
    if (filterParams.radius) filterParams.radius = parseFloat(filterParams.radius);
    
    dispatch(updateFilter(filterParams));
    
  }, [queryObj, currentPage, transaction_type, propertyTypes, dispatch]);

  useEffect(() => {
    const locationUnsubscribe = eventBus.subscribe(
      CHATBOT_EVENTS.UPDATE_MAP_LOCATION,
      (locationData) => {
        
        if (locationData.centerLat && locationData.centerLng) {
          setCenterLat(locationData.centerLat.toString());
          setCenterLng(locationData.centerLng.toString());
          
          if (locationData.radius) {
            setRadius(locationData.radius.toString());
          }
          
          window.dispatchEvent(new CustomEvent('refresh-properties'));
        }
      }
    );
    
    const filterUnsubscribe = eventBus.subscribe(
      CHATBOT_EVENTS.UPDATE_FILTERS,
      (filterData) => {
        console.log("GetPropertiesPage received filter update:", filterData);
        
        if (window.dispatchEvent) {
          try {
            const notifyEvent = new CustomEvent('show-notification', { 
              detail: { 
                message: "Map filters updated based on your query", 
                type: "success",
                duration: 3000
              } 
            });
            window.dispatchEvent(notifyEvent);
          } catch (e) {
            console.log("Could not show notification:", e);
          }
        }
        
        const searchParams = new URLSearchParams();
        
        if (filterData.centerLat) searchParams.set('centerLat', filterData.centerLat.toString());
        if (filterData.centerLng) searchParams.set('centerLng', filterData.centerLng.toString());
        if (filterData.radius) searchParams.set('radius', filterData.radius.toString());
        if (filterData.minPrice) searchParams.set('minPrice', filterData.minPrice.toString());
        if (filterData.maxPrice) searchParams.set('maxPrice', filterData.maxPrice.toString());
        if (filterData.minArea) searchParams.set('minArea', filterData.minArea.toString());
        if (filterData.maxArea) searchParams.set('maxArea', filterData.maxArea.toString());
        if (filterData.propertyType) searchParams.set('propertyType', filterData.propertyType);
        if (filterData.transactionType) searchParams.set('transactionType', filterData.transactionType);
        
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
        
        window.dispatchEvent(new CustomEvent('refresh-properties'));
      }
    );
    
    const handleRefresh = () => {
      const currentSearchParams = new URLSearchParams(window.location.search);
      dispatch(updateFilter({
        ...Object.fromEntries(currentSearchParams.entries())
      }));
    };
    
    window.addEventListener('refresh-properties', handleRefresh);
    
    return () => {
      locationUnsubscribe();
      filterUnsubscribe();
      window.removeEventListener('refresh-properties', handleRefresh);
    };
  }, [dispatch, setCenterLat, setCenterLng, setRadius]);

  const { data, error, isLoading } = useGetPropertiesQuery({
    page: currentPage,
    limit: pageSize,
    propertyType: propertyTypes,
    transactionType: transaction_type,
    radius: 1,
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
          <Map center={[mapCenterLng, mapCenterLat]} markerList={propertyMarkers} />
        </MapContainer>
      </Grid>
    </Grid>
  );
}
