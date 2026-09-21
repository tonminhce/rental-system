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
  paddingBottom: theme.spacing(2),
  border: "1px solid #e0e6d8",
  borderRadius: 12,
  flexWrap: "wrap",
  backgroundColor: "#fff",
  width: "100%",
  gap: theme.spacing(2),
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
      <Button onClick={clearAllFilters} variant="text" color="primary">
        Reset filters
      </Button>
    </SearchBarContainer>
  );
}
