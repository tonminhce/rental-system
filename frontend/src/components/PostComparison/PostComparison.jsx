import React from "react";
import { Typography, Grid, Paper, Box, Divider, Chip, Tooltip, CircularProgress, Stack } from "@mui/material";
import {
  BathtubOutlined,
  BedOutlined,
  CropFree,
  PaidOutlined,
  CompareArrows,
  LocationOn,
  Phone,
  TrendingUp,
  TrendingDown,
  Analytics,
} from "@mui/icons-material";
import ComparisonMap from "./ComparisionMap";
import usePricePrediction from "@/hooks/usePricePrediction";
import formatAddress from "@/utils/formatAddress";
import { formatRent } from "@/utils/rentalSearch.mjs";

const priceTagStyles = {
  tooltip: {
    maxWidth: 220,
    backgroundColor: "var(--rt-paper)",
    color: "var(--rt-ink)",
    boxShadow: "0px 5px 15px rgba(var(--rt-brand-rgb), 0.2)",
    borderRadius: "8px",
    padding: "12px 16px",
    "& .MuiTooltip-arrow": {
      color: "var(--rt-paper)",
    },
  },
  chipHigher: {
    backgroundColor: "rgba(198, 40, 40, 0.08)",
    color: "var(--rt-danger)",
    border: "1px solid rgba(198, 40, 40, 0.2)",
    marginLeft: "8px",
    "&:hover": {
      backgroundColor: "rgba(198, 40, 40, 0.12)",
    },
  },
  chipLower: {
    backgroundColor: "rgba(46, 125, 50, 0.08)",
    color: "var(--rt-success)",
    border: "1px solid rgba(46, 125, 50, 0.2)",
    marginLeft: "8px",
    "&:hover": {
      backgroundColor: "rgba(46, 125, 50, 0.12)",
    },
  },
};

const PostComparison = ({ post1, post2 }) => {
  const prediction1 = usePricePrediction(post1);
  const prediction2 = usePricePrediction(post2);

  const getPriceDifferenceText = (priceDiff) => {
    if (priceDiff === null || priceDiff === undefined) return "";
    const absPercentage = Math.abs(priceDiff).toFixed(1);
    if (priceDiff > 0) return `${absPercentage}% higher than predicted`;
    if (priceDiff < 0) return `${absPercentage}% lower than predicted`;
    return "Same as predicted price";
  };

  const features = [
    {
      key: "price",
      label: "Price",
      value1: post1?.price ? `${formatRent(post1.price)} / month` : "Negotiable",
      value2: post2?.price ? `${formatRent(post2.price)} / month` : "Negotiable",
      icon: PaidOutlined,
    },
    {
      key: "prediction",
      label: "Price Prediction",
      isPriceTag: true,
      prediction1,
      prediction2,
      icon: Analytics,
    },
    {
      key: "bedrooms",
      label: "Bedroom",
      value1: post1?.bedrooms ? `${post1.bedrooms} Beds` : "No information",
      value2: post2?.bedrooms ? `${post2.bedrooms} Beds` : "No information",
      icon: BedOutlined,
    },
    {
      key: "area",
      label: "Area",
      value1: post1?.area ? `${Number(post1.area)} m²` : "No information",
      value2: post2?.area ? `${Number(post2.area)} m²` : "No information",
      icon: CropFree,
    },
    {
      key: "bathrooms",
      label: "Bathroom",
      value1: post1?.bathrooms ? `${post1.bathrooms} Baths` : "No information",
      value2: post2?.bathrooms ? `${post2.bathrooms} Baths` : "No information",
      icon: BathtubOutlined,
    },
    {
      key: "location",
      label: "Location",
      value1: post1?.displayedAddress || formatAddress(post1?.address || post1),
      value2: post2?.displayedAddress || formatAddress(post2?.address || post2),
      icon: LocationOn,
    },
    {
      key: "contact",
      label: "Contact",
      value1: post1?.contactPhone || "No phone number",
      value2: post2?.contactPhone || "No phone number",
      icon: Phone,
      isContact: true,
    },
  ];

  const highlightDifference = (value1, value2, featureKey) => {
    // Don't highlight location values
    if (featureKey === "location") {
      return {};
    }

    // Handle price, bedrooms, area, bathrooms
    if (["price", "bedrooms", "area", "bathrooms"].includes(featureKey)) {
      // Extract numeric values for comparison
      const getNumericValue = (value) => {
        if (!value) return null;
        const match = value.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
      };

      const num1 = getNumericValue(value1);
      const num2 = getNumericValue(value2);

      // If we can extract numbers from both values, compare them
      if (num1 !== null && num2 !== null && num1 !== num2) {
        if (featureKey === "price") {
          // For price: lower is better (green), higher is worse (red)
          if (num1 < num2) {
            return { color: "var(--rt-success)", fontWeight: "bold" }; // green for lower price
          } else {
            return { color: "var(--rt-danger)", fontWeight: "bold" }; // red for higher price
          }
        } else {
          // For other features: higher is better (green), lower is worse (red)
          if (num1 < num2) {
            return { color: "var(--rt-danger)", fontWeight: "bold" }; // red for lower value
          } else {
            return { color: "var(--rt-success)", fontWeight: "bold" }; // green for higher value
          }
        }
      }
    }

    // For non-numeric or equal values, return empty styles
    return {};
  };

  const renderPriceTag = (prediction) => {
    if (prediction?.isPredicting) {
      return <CircularProgress size={16} />;
    }

    if (prediction?.predictedPrice == null || prediction?.priceDifference == null) {
      return (
        <Typography variant="body2" sx={{ color: "var(--rt-muted)" }}>
          Not available
        </Typography>
      );
    }

    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Predicted Price
            </Typography>
            <Typography variant="body2">{formatRent(prediction.predictedPrice)} / month</Typography>
          </Box>
        }
        arrow
        placement="right"
        sx={priceTagStyles.tooltip}
      >
        <Chip
          icon={prediction.priceDifference > 0 ? <TrendingUp /> : <TrendingDown />}
          label={getPriceDifferenceText(prediction.priceDifference)}
          size="small"
          sx={prediction.priceDifference > 0 ? priceTagStyles.chipHigher : priceTagStyles.chipLower}
        />
      </Tooltip>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, maxWidth: "100%" }}>
      <Box display="flex" alignItems="center" mb={2}>
        <CompareArrows sx={{ mr: 1, color: "var(--rt-muted)" }} />
        <Typography variant="h6" sx={{ color: "var(--rt-ink)" }}>
          Property Comparison
        </Typography>
      </Box>

      <Grid container>
        {/* Headers */}
        <Grid container sx={{ backgroundColor: "var(--rt-surface-tint)", p: 2, borderRadius: "10px 10px 0 0", borderBottom: "1px solid var(--rt-border)" }}>
          <Grid item xs={4}>
            <Typography variant="subtitle2" sx={{ color: "var(--rt-muted)", fontWeight: 600 }}>
              Feature / Detail
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--rt-brand)" }}>
              {post1?.name || "Property 1"}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "var(--rt-brand)" }}>
              {post2?.name || "Property 2"}
            </Typography>
          </Grid>
        </Grid>

        {/* Features */}
        {features.map((feature, index) => (
          <React.Fragment key={feature.key}>
            <Grid
              container
              sx={{
                p: 2,
                backgroundColor: index % 2 === 0 ? "var(--rt-paper)" : "var(--rt-bg)",
                transition: "background-color 0.2s ease",
                "&:hover": { backgroundColor: "rgba(var(--rt-brand-rgb), 0.05)" },
              }}
            >
              <Grid item xs={4} sx={{ display: "flex", alignItems: "center" }}>
                {feature.icon && <feature.icon sx={{ mr: 1, color: "var(--rt-brand)" }} />}
                <Typography sx={{ color: "var(--rt-ink)", fontWeight: 500 }}>{feature.label}</Typography>
              </Grid>
              <Grid item xs={4}>
                {feature.isPriceTag ? (
                  renderPriceTag(feature.prediction1)
                ) : feature.isContact && feature.value1 && feature.value1 !== "No phone number" ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone sx={{ color: "var(--rt-brand)", fontSize: 18 }} />
                    <Typography
                      component="a"
                      href={`tel:${feature.value1}`}
                      sx={{
                        color: "var(--rt-brand)",
                        fontWeight: 600,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {feature.value1}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={highlightDifference(feature.value1, feature.value2, feature.key)}>
                    {feature.value1}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={4}>
                {feature.isPriceTag ? (
                  renderPriceTag(feature.prediction2)
                ) : feature.isContact && feature.value2 && feature.value2 !== "No phone number" ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone sx={{ color: "var(--rt-brand)", fontSize: 18 }} />
                    <Typography
                      component="a"
                      href={`tel:${feature.value2}`}
                      sx={{
                        color: "var(--rt-brand)",
                        fontWeight: 600,
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {feature.value2}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={highlightDifference(feature.value2, feature.value1, feature.key)}>
                    {feature.value2}
                  </Typography>
                )}
              </Grid>
            </Grid>
            {index < features.length - 1 && (
              <Grid item xs={12}>
                <Divider />
              </Grid>
            )}
          </React.Fragment>
        ))}

        {/* Route Comparison */}
        <Grid item xs={12} sx={{ mt: 3 }}>
          <ComparisonMap post1={post1} post2={post2} />
        </Grid>
      </Grid>

      {/* Legend */}
      <Box mt={2} pt={2} borderTop="1px solid var(--rt-border)">
        <Stack direction="row" spacing={2.5} useFlexGap flexWrap="wrap">
          <Typography variant="caption" sx={{ color: "var(--rt-muted)", display: "flex", alignItems: "center" }}>
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                backgroundColor: "var(--rt-success)",
                borderRadius: "50%",
                display: "inline-block",
                mr: 1,
              }}
            />
            Better value for you
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--rt-muted)", display: "flex", alignItems: "center" }}>
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                backgroundColor: "var(--rt-danger)",
                borderRadius: "50%",
                display: "inline-block",
                mr: 1,
              }}
            />
            Weaker value for you
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

export default PostComparison;
