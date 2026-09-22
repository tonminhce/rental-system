"use client";
import dynamic from "next/dynamic";
import { useGetPropertiesQuery } from "@/redux/features/properties/propertyApi";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { MapOutlined, ViewModuleOutlined } from "@mui/icons-material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { updateFilter } from "@/redux/features/filter/filterSlice";
import eventBus, { CHATBOT_EVENTS } from "@/utils/chatbotEventBus";
import { rentalFilters, rentalPage, RENTAL_FILTER_KEYS } from "@/utils/rentalSearch.mjs";
import useRentalFilters from "@/hooks/useRentalFilters";
import PropertyList from "./components/PropertyList";

const RentalMap = dynamic(() => import("./components/Map"), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height="100%" />,
});

export default function GetPropertiesPage({ transaction_type = "rent" }) {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [showMap, setShowMap] = useState(true);
  const [mobileView, setMobileView] = useState("list");
  const [expandedMap, setExpandedMap] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const resultsTop = useRef(null);
  const mapPanel = useRef(null);
  const pendingPage = useRef(null);
  const filterKey = JSON.stringify(rentalFilters(search, transaction_type));
  const filters = useMemo(() => JSON.parse(filterKey), [filterKey]);
  const page = rentalPage(search.get("page"));
  const query = useMemo(() => ({ ...filters, sort: filters.sort || "newest", page, limit: 12 }), [filters, page]);
  const { currentData: data, error, isFetching, refetch } = useGetPropertiesQuery(query);

  const [, update] = useRentalFilters();

  useEffect(() => {
    dispatch(updateFilter(query));
  }, [dispatch, query]);
  useEffect(() => {
    setSelectedProperty(null);
  }, [filterKey]);
  useEffect(() => {
    if (mobileView === "map" && window.matchMedia("(max-width: 959px)").matches) {
      mapPanel.current?.scrollIntoView({ block: "start" });
    }
  }, [mobileView]);
  useEffect(() => {
    const fromAssistant = (values) =>
      update(Object.fromEntries(Object.entries(values).filter(([key]) => RENTAL_FILTER_KEYS.includes(key))));
    const offLocation = eventBus.subscribe(CHATBOT_EVENTS.UPDATE_MAP_LOCATION, fromAssistant);
    const offFilters = eventBus.subscribe(CHATBOT_EVENTS.UPDATE_FILTERS, fromAssistant);
    return () => {
      offLocation();
      offFilters();
    };
  }, [update]);
  useEffect(() => {
    const totalPages = data?.pagination?.total_pages;
    if (totalPages !== undefined && page > Math.max(1, totalPages)) {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(Math.max(1, totalPages)));
      router.replace(`${pathname}?${params}`, { scroll: false });
    }
  }, [data, page, pathname, router]);
  useEffect(() => {
    if (data && pendingPage.current === page) {
      resultsTop.current?.scrollIntoView({ block: "start" });
      pendingPage.current = null;
    }
  }, [data, page]);

  const properties = useMemo(
    () => (data?.properties || []).map((p) => ({ ...p, thumbnail: p.images?.[0]?.url })),
    [data],
  );
  const center = useMemo(
    () => [Number(filters.centerLng) || 106.701, Number(filters.centerLat) || 10.786],
    [filters.centerLng, filters.centerLat],
  );
  const total = data?.pagination?.total_records ?? 0;
  const setPage = (_, nextPage) => {
    pendingPage.current = nextPage;
    const params = new URLSearchParams(search);
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params}`, { scroll: false });
  };
  const locate = (property) => {
    setSelectedProperty(property);
    setShowMap(true);
    setMobileView("map");
  };
  const searchArea = useCallback(
    (bounds) => {
      // A deliberate map search replaces the previous geographic area, while
      // retaining budget/type/size. The route origin remains the chosen place.
      update({ bounds, radius: null, district: null, province: null });
      setMobileView("list");
      setExpandedMap(false);
    },
    [update],
  );
  const clearSelection = useCallback(() => setSelectedProperty(null), []);
  useEffect(() => {
    if (!expandedMap) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") setExpandedMap(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [expandedMap]);

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography
            component="h1"
            sx={{ fontSize: { xs: 25, md: 30 }, letterSpacing: "-0.8px", fontWeight: 700, lineHeight: 1.35 }}
          >
            {filters.district ? `Homes in ${filters.district}` : "Find a place to call home."}
          </Typography>
          <Typography color="text.secondary" fontSize={13} sx={{ mt: 1 }}>
            A neighborhood you love. A space that fits your life.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={showMap ? <ViewModuleOutlined /> : <MapOutlined />}
          onClick={() => setShowMap(!showMap)}
          sx={{ whiteSpace: "nowrap", display: { xs: "none", md: "inline-flex" }, bgcolor: "white" }}
        >
          {showMap ? "Hide map" : "Show map"}
        </Button>
      </Stack>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        {filters.bounds && <Chip label="Selected map area" onDelete={() => update({ bounds: null })} />}
        {filters.district && <Chip label={filters.district} onDelete={() => update({ district: null })} />}
        <Typography fontSize={12} color="text.secondary" sx={{ alignSelf: "center" }}>
          Unverified inventory · Confirm availability and exact location with the source before visiting or paying.
        </Typography>
      </Stack>
      <ToggleButtonGroup
        exclusive
        value={mobileView}
        onChange={(_, value) => {
          if (value) {
            setMobileView(value);
            setShowMap(true);
          }
        }}
        size="small"
        fullWidth
        aria-label="Browse rentals by list or map"
        sx={{ mb: 2, display: { md: "none" }, bgcolor: "white", position: "sticky", top: 72, zIndex: 20 }}
      >
        <ToggleButton value="list">
          <ViewModuleOutlined sx={{ mr: 1, fontSize: 18 }} /> List
        </ToggleButton>
        <ToggleButton value="map">
          <MapOutlined sx={{ mr: 1, fontSize: 18 }} /> Map
        </ToggleButton>
      </ToggleButtonGroup>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: showMap ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box
          aria-busy={isFetching}
          sx={{ display: { xs: mobileView === "list" ? "block" : "none", md: "block" }, minWidth: 0 }}
        >
          <Stack
            ref={resultsTop}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            sx={{ mb: 2, scrollMarginTop: 100 }}
          >
            <Typography variant="body2" aria-live="polite" sx={{ fontSize: 13 }}>
              {error ? (
                "Homes unavailable"
              ) : isFetching ? (
                "Finding homes…"
              ) : total ? (
                <>
                  <strong>
                    {((page - 1) * 12 + 1).toLocaleString()}–{Math.min(page * 12, total).toLocaleString()}
                  </strong>{" "}
                  of {total.toLocaleString()} homes
                </>
              ) : (
                "No matching homes"
              )}
            </Typography>
            <TextField
              select
              size="small"
              label="Sort by"
              value={filters.sort || "newest"}
              onChange={(e) => update({ sort: e.target.value })}
              sx={{ minWidth: 145, "& .MuiInputBase-input": { fontSize: 12 } }}
            >
              <MenuItem value="newest">Newest first</MenuItem>
              <MenuItem value="price_asc">Price: low to high</MenuItem>
              <MenuItem value="price_desc">Price: high to low</MenuItem>
              <MenuItem value="area_desc">Largest first</MenuItem>
            </TextField>
          </Stack>
          {error ? (
            <Alert severity="error" action={<Button onClick={refetch}>Retry</Button>}>
              We couldn’t load homes. Please try again.
            </Alert>
          ) : !data && isFetching ? (
            <Stack spacing={2}>
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} variant="rounded" height={340} />
              ))}
            </Stack>
          ) : (
            <PropertyList
              properties={properties}
              totalPages={data?.pagination?.total_pages ?? 0}
              currentPage={page}
              handlePageChange={setPage}
              onLocate={locate}
              mapVisible={showMap}
            />
          )}
        </Box>
        {showMap && (
          <Box
            ref={mapPanel}
            aria-label="Rental locations map"
            sx={{
              display: { xs: mobileView === "map" ? "block" : "none", md: "block" },
              height: { xs: "calc(100dvh - 145px)", md: expandedMap ? "calc(100dvh - 114px)" : "calc(100vh - 125px)" },
              minHeight: 480,
              scrollMarginTop: 125,
              position: { md: expandedMap ? "fixed" : "sticky" },
              top: 100,
              ...(expandedMap ? { left: 20, right: 20, zIndex: 1100, boxShadow: "0 16px 60px #18352a35" } : {}),
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid var(--rt-border)",
            }}
          >
            <RentalMap
              center={center}
              filters={filters}
              selectedProperty={selectedProperty}
              onSearchArea={searchArea}
              onCloseSelection={clearSelection}
              expanded={expandedMap}
              onExpand={() => setExpandedMap((value) => !value)}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
