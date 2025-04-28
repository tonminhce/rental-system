import { ArrowDropDown, ArrowRight, CachedOutlined } from "@mui/icons-material";
import { Box, Button, Divider, Menu, Slider, Stack, styled, TextField, Typography, useTheme } from "@mui/material";
import { grey } from "@mui/material/colors";
import React, { useEffect, useState } from "react";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";

const StyledButton = styled((props) => <Button size="small" variant="outlined" color="inherit" {...props} />)(
  ({ theme }) => ({
    borderColor: theme.palette.grey[400],
    fontSize: theme.typography.body1.fontSize,
  })
);

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
  const [bottomArea, setBottomArea] = useQueryParam("minArea", withDefault(NumberParam, 0));
  const [topArea, setTopArea] = useQueryParam("maxArea", withDefault(NumberParam, 0));

  const [areaRange, setAreaRange] = useState([bottomArea, topArea]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const areaConfig = { min: 0, max: 50000, step: 1 };

  const theme = useTheme();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAreaSelect = (newAreaRange) => {
    const newBottomArea = Math.min(...newAreaRange);
    const newTopArea = Math.max(...newAreaRange);

    setTopArea(newTopArea === 0 ? undefined : newTopArea);
    setBottomArea(newBottomArea === 0 ? undefined : newBottomArea);
    handleClose();
  };

  const handleReset = () => {
    setBottomArea(undefined);
    setTopArea(undefined);
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
      <StyledButton
        onClick={handleClick}
        aria-controls={open ? "area-select-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{ borderColor: open ? theme.palette.primary.main : grey[400] }}
      >
        {getAreaLabel([bottomArea, topArea])} <ArrowDropDown color={grey[400]} />
      </StyledButton>
      <Menu onClose={handleClose} anchorEl={anchorEl} open={open}>
        <Box width={300}>
          <Box px={2}>
            <Typography variant="body1" color={grey[500]} gutterBottom>
              Area (m<sup>2</sup>)
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={areaRange[0]}
                inputProps={{ type: "number", ...areaConfig }}
                onChange={(e) => setAreaRange((prev) => [e.target.value, prev[1]])}
              />
              <ArrowRight fontSize="large" />
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={areaRange[1]}
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
