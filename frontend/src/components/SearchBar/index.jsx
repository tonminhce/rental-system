"use client";

import { Button, Stack, styled, TextField } from "@mui/material";
import { StringParam, useQueryParam } from "use-query-params";
import PriceSelect from "./PriceSelect";
import PropertyTypeSelect from "./PropertyTypeSelect";
import "./SearchBar.scss";
import AreaSelect from "./AreaSelect";
import AddressInput from "./AddressInput";
import { useDispatch } from "react-redux";
import { clearFilters } from "@/redux/features/filter/filterSlice";

const SearchBarContainer = styled(Stack)(({ theme }) => ({
  position: "relative",
  padding: 16,
  flexDirection: "row",
  alignItems: "center",
  border: "1px solid #e0e6d8",
  borderRadius: 14,
  flexWrap: "wrap",
  backgroundColor: "#fff",
  width: "100%",
  gap: theme.spacing(1.5),
  boxShadow: "0 4px 20px rgba(35, 76, 62, 0.05)",
  transition: "box-shadow 0.3s ease, border-color 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 28px rgba(35, 76, 62, 0.09)",
    borderColor: "#c9d5bf",
  },
}));

export default function SearchBar() {
  const dispatch = useDispatch();

  function clearAllFilters() {
    let url = window.location.origin + window.location.pathname;
    window.history.pushState({ path: url }, "", url);
    dispatch(clearFilters());
    window.location.reload();
  }

  return (
    <SearchBarContainer>
      <AddressInput />

      <PropertyTypeSelect />
      <PriceSelect />
      <AreaSelect />
      <Button
        onClick={clearAllFilters}
        variant="text"
        sx={{
          color: "#70796b",
          fontWeight: 600,
          transition: "all 0.2s ease",
          "&:hover": {
            color: "#234c3e",
            backgroundColor: "rgba(35, 76, 62, 0.05)",
          },
        }}
      >
        Reset filters
      </Button>
    </SearchBarContainer>
  );
}
