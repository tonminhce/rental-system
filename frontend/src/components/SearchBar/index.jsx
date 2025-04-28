"use client";

import { Button, Stack, styled, TextField } from "@mui/material";
import { StringParam, useQueryParam } from "use-query-params";
import PriceSelect from "./PriceSelect";
import PropertyTypeSelect from "./PropertyTypeSelect";
import "./SearchBar.scss";
import AreaSelect from "./AreaSelect";
import AddressInput from "./AddressInput";

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
  function clearQueryParams() {
    // Get the current URL without the query parameters
    let url = window.location.origin + window.location.pathname;

    // Use the History API to change the URL without reloading the page
    window.history.pushState({ path: url }, "", url);
  }

  return (
    <SearchBarContainer>
      <AddressInput />

      <PropertyTypeSelect />
      <PriceSelect />
      <AreaSelect />
      <Button onClick={clearQueryParams} variant="contained" color="primary">
        Clear Filter
      </Button>
    </SearchBarContainer>
  );
}
