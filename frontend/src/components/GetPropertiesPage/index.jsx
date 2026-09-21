"use client";
import dynamic from "next/dynamic";
import { useGetPropertiesQuery } from "@/redux/features/properties/propertyApi";
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { MapOutlined, ViewModuleOutlined } from "@mui/icons-material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateFilter } from "@/redux/features/filter/filterSlice";
import eventBus, { CHATBOT_EVENTS } from "@/utils/chatbotEventBus";
import PropertyList from "./components/PropertyList";

const RentalMap = dynamic(() => import("./components/Map"), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height="100%" />,
});
const supported = [
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "centerLng",
  "centerLat",
  "radius",
  "bounds",
  "district",
  "propertyType",
];
export default function GetPropertiesPage({ transaction_type = "rent" }) {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [showMap, setShowMap] = useState(true);
  const query = useMemo(() => {
    const values = Object.fromEntries([...search.entries()].filter(([key, value]) => supported.includes(key) && value));
    if (search.getAll("propertyType").length) values.propertyType = search.getAll("propertyType").join(",");
    return {
      ...values,
      page: Math.max(1, Math.floor(Number(search.get("page")) || 1)),
      limit: 12,
      transactionType: transaction_type,
    };
  }, [search, transaction_type]);
  const { data, error, isLoading, isFetching, refetch } = useGetPropertiesQuery(query);
  useEffect(() => {
    dispatch(updateFilter(query));
  }, [dispatch, query]);
  useEffect(() => {
    const update = (values) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(values))
        if (supported.includes(key)) {
          if (value == null || value === "") params.delete(key);
          else params.set(key, String(value));
        }
      params.delete("page");
      router.push(`${pathname}?${params}`, { scroll: false });
    };
    const offLocation = eventBus.subscribe(CHATBOT_EVENTS.UPDATE_MAP_LOCATION, update);
    const offFilters = eventBus.subscribe(CHATBOT_EVENTS.UPDATE_FILTERS, update);
    return () => {
      offLocation();
      offFilters();
    };
  }, [pathname, router]);
  const properties = useMemo(
    () => (data?.properties || []).map((p) => ({ ...p, thumbnail: p.images?.[0]?.url })),
    [data],
  );
  const markers = useMemo(
    () =>
      properties
        .filter((p) => p.coordinates?.coordinates?.every(Number.isFinite))
        .map((p) => ({ ...p, image: p.thumbnail, displayed_address: p.displayedAddress })),
    [properties],
  );
  const center = useMemo(
    () => [Number(query.centerLng) || 106.701, Number(query.centerLat) || 10.786],
    [query.centerLng, query.centerLat],
  );
  const setPage = (_, page) => {
    const params = new URLSearchParams(search);
    params.set("page", page);
    router.push(`${pathname}?${params}`);
  };
  return (
    <Box sx={{ pb: 6 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        sx={{ mb: 3, mt: 1 }}
        className="animate-fade-in"
      >
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: 2, color: "text.secondary", fontSize: 10 }}>
            FIND YOUR NEXT CHAPTER
          </Typography>
          <Typography component="h1" variant="h4" sx={{ fontSize: { xs: 25, md: 32 }, my: 1 }}>
            Homes in {query.district || "Ho Chi Minh City"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error
              ? "Listings temporarily unavailable"
              : isFetching
                ? "Finding your next home…"
                : `${data?.pagination?.total_records ?? properties.length} homes to explore`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={showMap ? <ViewModuleOutlined /> : <MapOutlined />}
          onClick={() => setShowMap(!showMap)}
          sx={{ whiteSpace: "nowrap" }}
        >
          {showMap ? "Hide map" : "Show map"}
        </Button>
      </Stack>
      {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
        <Alert severity="info" sx={{ mb: 3, bgcolor: "#edf1e7", color: "#526047" }}>
          Local preview · Sample listings and illustrative photos, not verified availability.
        </Alert>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: showMap ? "1.15fr 1fr" : "1fr" }, gap: 3 }}>
        <Box aria-busy={isFetching}>
          {error ? (
            <Alert severity="error" action={<Button onClick={refetch}>Retry</Button>}>
              We couldn’t load homes. Please try again.
            </Alert>
          ) : isLoading ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} variant="rounded" height={230} />
              ))}
            </Stack>
          ) : (
            <PropertyList
              properties={properties}
              totalPages={data?.pagination?.total_pages ?? 0}
              currentPage={query.page}
              handlePageChange={setPage}
            />
          )}
        </Box>
        {showMap && (
          <Box
            aria-label="Rental locations map"
            sx={{
              height: { xs: 400, md: "calc(100vh - 180px)" },
              minHeight: 400,
              position: { md: "sticky" },
              top: 110,
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid #dce3d4",
            }}
          >
            <RentalMap center={center} markerList={markers} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
