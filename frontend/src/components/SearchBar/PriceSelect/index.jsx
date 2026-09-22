import { PRICE_SUGGESTIONS } from "@/constants/price";
import { getPriceOptionLabel, getPriceSelectLabel } from "@/utils/getPriceLabel";
import { ArrowDropDown, ArrowRight, CachedOutlined } from "@mui/icons-material";
import { Box, Button, Divider, Menu, MenuItem, Slider, Stack, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import useRentalFilters from "@/hooks/useRentalFilters";
import FilterTriggerButton from "../FilterTriggerButton";

export default function PriceSelect() {
  const [search, update] = useRentalFilters();
  const bottomPrice = Number(search.get("minPrice")) || 0;
  const topPrice = Number(search.get("maxPrice")) || 0;

  const [priceRange, setPriceRange] = useState([bottomPrice, topPrice]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const priceConfig = { min: 0, max: 100, step: 0.5 };
  const hasPrice = bottomPrice > 0 || topPrice > 0;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePriceSelect = (newPriceRange) => {
    const newBottomPrice = Math.min(...newPriceRange);
    const newTopPrice = Math.max(...newPriceRange);

    update({ minPrice: newBottomPrice || null, maxPrice: newTopPrice || null });
    handleClose();
  };

  const handleReset = () => {
    update({ minPrice: null, maxPrice: null });
    handleClose();
  };

  const handleSliderChange = (event, newPriceRange) => {
    setPriceRange(newPriceRange);
  };

  // Sync local price range with query params
  useEffect(() => {
    setPriceRange([bottomPrice, topPrice]);
  }, [topPrice, bottomPrice]);

  return (
    <>
      <FilterTriggerButton
        onClick={handleClick}
        aria-controls={open ? "price-select-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{ borderColor: open ? "var(--rt-brand)" : undefined, color: hasPrice ? "var(--rt-ink)" : undefined }}
      >
        {getPriceSelectLabel([bottomPrice, topPrice])}
        <ArrowDropDown sx={{ color: "var(--rt-faint)", fontSize: 20 }} />
      </FilterTriggerButton>
      <Menu onClose={handleClose} anchorEl={anchorEl} open={open}>
        <Box width={300}>
          <Box px={2}>
            <Typography variant="body2" sx={{ color: "var(--rt-muted)" }} gutterBottom>
              Monthly rent · million ₫
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={priceRange[0]}
                label="Minimum"
                inputProps={{ type: "number", ...priceConfig }}
                onChange={(e) => setPriceRange((prev) => [e.target.value, prev[1]])}
              />
              <ArrowRight fontSize="large" />
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={priceRange[1]}
                label="Maximum"
                inputProps={{ type: "number", ...priceConfig }}
                onChange={(e) => setPriceRange((prev) => [prev[0], e.target.value])}
              />
            </Stack>
            <Slider {...priceConfig} value={priceRange} onChange={handleSliderChange} valueLabelDisplay="auto" />
          </Box>

          <Divider />

          <Box height={170} sx={{ overflowY: "scroll" }}>
            {PRICE_SUGGESTIONS.map((range) => (
              <MenuItem key={range.toString()} onClick={() => handlePriceSelect(range)}>
                {getPriceOptionLabel(range)}
              </MenuItem>
            ))}
          </Box>

          <Divider />

          <Stack direction="row" justifyContent="space-between" px={1} pt={1}>
            <Button onClick={handleReset} color="inherit">
              <CachedOutlined sx={{ fontSize: 20 }} />
              Reset
            </Button>
            <Button onClick={() => handlePriceSelect(priceRange)} variant="contained">
              Apply
            </Button>
          </Stack>
        </Box>
      </Menu>
    </>
  );
}
