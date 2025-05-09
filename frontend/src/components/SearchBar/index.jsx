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
  position: "fixed",
  paddingTop: 20,
  top: 60,
  flexDirection: "row",
  paddingBottom: theme.spacing(2),
  zIndex: 100,
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
      <Button onClick={clearAllFilters} variant="contained" color="primary">
        Clear Filter
      </Button>
    </SearchBarContainer>
  );
}
