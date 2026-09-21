import { ArrowDropDown, ArrowRight, CachedOutlined } from "@mui/icons-material";
import { Box, Button, Divider, Menu, Slider, Stack, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import useRentalFilters from "@/hooks/useRentalFilters";
import FilterTriggerButton from "../FilterTriggerButton";

const getAreaLabel = (range) => {
  const [bottomArea, topArea] = range;

  if (bottomArea == 0 && topArea == 0) {
    return "Any area range";
  } else if (bottomArea == 0) {
    return `≤ ${topArea} m²`;
  } else if (topArea == 0) {
    return `≥ ${bottomArea} m²`;
  } else if (topArea == bottomArea) {
    return `=${topArea} m²`;
  }
  return `${bottomArea}-${topArea} m²`;
};

export default function AreaSelect() {
  const [search, update] = useRentalFilters();
  const bottomArea = Number(search.get("minArea")) || 0;
  const topArea = Number(search.get("maxArea")) || 0;

  const [areaRange, setAreaRange] = useState([bottomArea, topArea]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const areaConfig = { min: 0, max: 500, step: 5 };
  const hasArea = bottomArea > 0 || topArea > 0;

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAreaSelect = (newAreaRange) => {
    const newBottomArea = Math.min(...newAreaRange);
    const newTopArea = Math.max(...newAreaRange);

    update({ minArea: newBottomArea || null, maxArea: newTopArea || null });
    handleClose();
  };

  const handleReset = () => {
    update({ minArea: null, maxArea: null });
    handleClose();
  };

  const handleSliderChange = (event, newAreaRange) => {
    setAreaRange(newAreaRange);
  };

  useEffect(() => {
    setAreaRange([bottomArea, topArea]);
  }, [topArea, bottomArea]);

  return (
    <>
      <FilterTriggerButton
        onClick={handleClick}
        aria-controls={open ? "area-select-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{ borderColor: open ? "var(--rt-brand)" : undefined, color: hasArea ? "var(--rt-ink)" : undefined }}
      >
        {getAreaLabel([bottomArea, topArea])}
        <ArrowDropDown sx={{ color: "var(--rt-faint)", fontSize: 20 }} />
      </FilterTriggerButton>
      <Menu onClose={handleClose} anchorEl={anchorEl} open={open}>
        <Box width={300}>
          <Box px={2}>
            <Typography variant="body2" sx={{ color: "var(--rt-muted)" }} gutterBottom>
              Area (m<sup>2</sup>)
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={areaRange[0]}
                label="Minimum"
                inputProps={{ type: "number", ...areaConfig }}
                onChange={(e) => setAreaRange((prev) => [e.target.value, prev[1]])}
              />
              <ArrowRight fontSize="large" />
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={areaRange[1]}
                label="Maximum"
                inputProps={{ type: "number", ...areaConfig }}
                onChange={(e) => setAreaRange((prev) => [prev[0], e.target.value])}
              />
            </Stack>
            <Slider {...areaConfig} value={areaRange} onChange={handleSliderChange} valueLabelDisplay="auto" />
          </Box>

          <Divider />

          <Stack direction="row" justifyContent="space-between" px={1} pt={1}>
            <Button onClick={handleReset} color="inherit">
              <CachedOutlined sx={{ fontSize: 20 }} />
              Reset
            </Button>
            <Button onClick={() => handleAreaSelect(areaRange)} variant="contained">
              Apply
            </Button>
          </Stack>
        </Box>
      </Menu>
    </>
  );
}
