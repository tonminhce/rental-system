import { PRICE_SUGGESTIONS } from "@/constants/price";
import { getPriceOptionLabel, getPriceSelectLabel } from "@/utils/getPriceLabel";
import { ArrowDropDown, ArrowRight, CachedOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Slider,
  Stack,
  styled,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import React, { useEffect, useState } from "react";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";

const StyledButton = styled((props) => <Button size="small" variant="outlined" color="inherit" {...props} />)(
  ({ theme }) => ({
    borderColor: theme.palette.grey[400],
    fontSize: theme.typography.body1.fontSize,
  })
);

export default function PriceSelect() {
  const [bottomPrice, setBottomPrice] = useQueryParam("bp", withDefault(NumberParam, 0));
  const [topPrice, setTopPrice] = useQueryParam("tp", withDefault(NumberParam, 0));

  const [priceRange, setPriceRange] = useState([bottomPrice, topPrice]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const priceConfig = { min: 0, max: 100, step: 0.5 };

  const theme = useTheme();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePriceSelect = (newPriceRange) => {
    const newBottomPrice = Math.min(...newPriceRange);
    const newTopPrice = Math.max(...newPriceRange);

    setTopPrice(newTopPrice === 0 ? undefined : newTopPrice);
    setBottomPrice(newBottomPrice === 0 ? undefined : newBottomPrice);
    handleClose();
  };

  const handleReset = () => {
    setBottomPrice(undefined);
    setTopPrice(undefined);
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
      <StyledButton
        onClick={handleClick}
        aria-controls={open ? "price-select-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        sx={{ borderColor: open ? theme.palette.primary.main : grey[400] }}
      >
        {getPriceSelectLabel([bottomPrice, topPrice])} <ArrowDropDown color={grey[400]} />
      </StyledButton>
      <Menu onClose={handleClose} anchorEl={anchorEl} open={open}>
        <Box width={300}>
          <Box px={2}>
            <Typography variant="body1" color={grey[500]} gutterBottom>
              Price range
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={priceRange[0]}
                inputProps={{ type: "number", ...priceConfig }}
                onChange={(e) => setPriceRange((prev) => [e.target.value, prev[1]])}
              />
              <ArrowRight fontSize="large" />
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={priceRange[1]}
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
