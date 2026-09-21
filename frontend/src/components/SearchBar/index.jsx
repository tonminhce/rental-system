"use client";

import { Box, Button, Stack, styled } from "@mui/material";
import { TuneOutlined } from "@mui/icons-material";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import PriceSelect from "./PriceSelect";
import PropertyTypeSelect from "./PropertyTypeSelect";
import "./SearchBar.scss";
import AreaSelect from "./AreaSelect";
import AddressInput from "./AddressInput";
import { useDispatch } from "react-redux";
import { clearFilters } from "@/redux/features/filter/filterSlice";

const SearchBarContainer = styled(Stack)(() => ({
  position: "relative",
  padding: 16,
  flexDirection: "row",
  alignItems: "center",
  border: "1px solid var(--rt-border)",
  borderRadius: 14,
  flexWrap: "wrap",
  backgroundColor: "var(--rt-paper)",
  width: "100%",
  gap: 12,
  boxShadow: "0 4px 20px rgba(var(--rt-brand-rgb), 0.05)",
  transition: "box-shadow 0.3s ease, border-color 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 28px rgba(var(--rt-brand-rgb), 0.09)",
    borderColor: "var(--rt-border-strong)",
  },
}));

export default function SearchBar() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  function clearAllFilters() {
    dispatch(clearFilters());
    router.push(pathname, { scroll: false });
  }

  return (
    <SearchBarContainer>
      <AddressInput />
      <Button
        startIcon={<TuneOutlined />}
        aria-expanded={filtersOpen}
        aria-controls="rental-filter-options"
        onClick={() => setFiltersOpen(!filtersOpen)}
        sx={{ display: { xs: "inline-flex", sm: "none" } }}
      >
        Filters
      </Button>
      <Box
        id="rental-filter-options"
        sx={{
          display: { xs: filtersOpen ? "flex" : "none", sm: "flex" },
          flexWrap: "wrap",
          gap: 1.5,
          alignItems: "center",
        }}
      >
        <PropertyTypeSelect />
        <PriceSelect />
        <AreaSelect />
        <Button
          onClick={clearAllFilters}
          variant="text"
          sx={{
            color: "var(--rt-muted)",
            fontWeight: 600,
            transition: "all 0.2s ease",
            "&:hover": {
              color: "var(--rt-brand)",
              backgroundColor: "rgba(var(--rt-brand-rgb), 0.05)",
            },
          }}
        >
          Reset filters
        </Button>
      </Box>
    </SearchBarContainer>
  );
}
