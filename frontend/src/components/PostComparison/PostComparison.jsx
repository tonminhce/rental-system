import React from 'react';
import { Typography, Grid, Paper, Box, Divider, Chip, Tooltip, CircularProgress } from '@mui/material';
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

const priceTagStyles = {
  tooltip: {
    maxWidth: 220,
    backgroundColor: '#fff',
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    '& .MuiTooltip-arrow': {
      color: '#fff'
    }
  },
  chipHigher: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    color: '#f44336',
    border: '1px solid rgba(244, 67, 54, 0.2)',
    marginLeft: '8px',
    '&:hover': {
      backgroundColor: 'rgba(244, 67, 54, 0.12)',
    }
  },
  chipLower: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    color: '#4caf50',
    border: '1px solid rgba(76, 175, 80, 0.2)',
    marginLeft: '8px',
    '&:hover': {
      backgroundColor: 'rgba(76, 175, 80, 0.12)',
    }
  }
};

const PostComparison = ({ post1, post2 }) => {
  const getPricePredictionData = (post) => {
    if (!post?.price) return null;
    
    const actualPrice = parseFloat(post.price);
    const predictedPrice = actualPrice * (Math.random() * 0.4 + 0.8); // Random value between 80% and 120% of actual price
    const priceDifference = ((actualPrice - predictedPrice) / predictedPrice) * 100;
    
    return {
      predictedPrice,
      priceDifference,
      isPredicting: false
    };
  };

  const getPriceDifferenceText = (priceDiff) => {
    if (priceDiff === null) return "";
    const absPercentage = Math.abs(priceDiff).toFixed(1);
    return priceDiff > 0 ? `${absPercentage}% above market` : `${absPercentage}% below market`;
  };

  const prediction1 = getPricePredictionData(post1);
  const prediction2 = getPricePredictionData(post2);

  const features = [
    {
      label: "Price",
      value1: post1?.price ? `${post1.price} triệu/tháng` : "Negotiable",
      value2: post2?.price ? `${post2.price} triệu/tháng` : "Negotiable",
      icon: PaidOutlined,
    },
    {
      label: "Price Prediction",
      isPriceTag: true,
      prediction1,
      prediction2,
      icon: Analytics,
    },
    {
      label: "Bedroom",
      value1: post1?.bedrooms ? `${post1.bedrooms} Beds` : "No information",
      value2: post2?.bedrooms ? `${post2.bedrooms} Beds` : "No information",
      icon: BedOutlined,
    },
    {
      label: "Area",
      value1: post1?.area ? `${post1.area} m²` : "No information",
      value2: post2?.area ? `${post2.area} m²` : "No information",
      icon: CropFree,
    },
    {
      label: "Bathroom",
      value1: post1?.bathrooms ? `${post1.bathrooms} Baths` : "No information",
      value2: post2?.bathrooms ? `${post2.bathrooms} Baths` : "No information",
      icon: BathtubOutlined,
    },
    {
      label: "Location",
      value1: post1?.displayedAddress,
      value2: post2?.displayedAddress,
      icon: LocationOn,
      isLocation: true,
    },
    {
      label: "Contact",
      value1: post1?.contactPhone || "No phone number",
      value2: post2?.contactPhone || "No phone number",
      icon: Phone,
      isContact: true,
    },
  ];

  const highlightDifference = (value1, value2, featureType) => {
    // Don't highlight location values
    if (featureType === 'location') {
      return {};
    }
    
    // Handle price, bedrooms, area, bathrooms
    if (['price', 'bedrooms', 'area', 'bathrooms'].includes(featureType)) {
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
        if (featureType === 'price') {
          // For price: lower is better (green), higher is worse (red)
          if (num1 < num2) {
            return { color: '#4caf50', fontWeight: 'bold' }; // green for lower price
          } else {
            return { color: '#f44336', fontWeight: 'bold' }; // red for higher price
          }
        } else {
          // For other features: higher is better (green), lower is worse (red)
          if (num1 < num2) {
            return { color: '#f44336', fontWeight: 'bold' }; // red for lower value
          } else {
            return { color: '#4caf50', fontWeight: 'bold' }; // green for higher value
          }
        }
      }
    }
    
    // For non-numeric or equal values, return empty styles
    return {};
  };

  const renderPriceTag = (prediction) => {
    if (!prediction) return null;
    
    if (prediction.isPredicting) {
      return <CircularProgress size={16} />;
    }
    
    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Predicted Price
            </Typography>
            <Typography variant="body2">
              {prediction.predictedPrice.toFixed(2)} triệu/tháng
            </Typography>
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
    <Paper elevation={3} sx={{ p: 3, mt: 2, maxWidth: '100%' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <CompareArrows sx={{ mr: 1, color: '#666' }} />
        <Typography variant="h6" color="#333">
          Property Comparison
        </Typography>
      </Box>

      <Grid container>
        {/* Headers */}
        <Grid container sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: '8px 8px 0 0' }}>
          <Grid item xs={4}>
            <Typography variant="subtitle2" color="#666">
              Description
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" fontWeight="bold" color="#333">
              {post1?.name || "Property 1"}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" fontWeight="bold" color="#333">
              {post2?.name || "Property 2"}
            </Typography>
          </Grid>
        </Grid>

        {/* Features */}
        {features.map((feature, index) => (
          <React.Fragment key={feature.label}>
            <Grid container sx={{
              p: 2,
              backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
              '&:hover': { backgroundColor: '#f0f7ff' }
            }}>
              <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
                {feature.icon && <feature.icon sx={{ mr: 1, color: '#666' }} />}
                <Typography color="#666">{feature.label}</Typography>
              </Grid>
              <Grid item xs={4}>
                {feature.isPriceTag ? (
                  renderPriceTag(feature.prediction1)
                ) : feature.isContact && feature.value1 && feature.value1 !== "No phone number" ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ color: '#4CAF50' }} />
                    <Typography component="a" href={`tel:${feature.value1}`} sx={{
                      color: '#4CAF50',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}>
                      {feature.value1}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={highlightDifference(feature.value1, feature.value2, feature.label.toLowerCase())}>
                    {feature.value1}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={4}>
                {feature.isPriceTag ? (
                  renderPriceTag(feature.prediction2)
                ) : feature.isContact && feature.value2 && feature.value2 !== "No phone number" ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ color: '#4CAF50' }} />
                    <Typography component="a" href={`tel:${feature.value2}`} sx={{
                      color: '#4CAF50',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}>
                      {feature.value2}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={highlightDifference(feature.value2, feature.value1, feature.label.toLowerCase())}>
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
      <Box mt={2} pt={2} borderTop="1px solid #eee">
        <Typography variant="caption" color="#666" display="flex" alignItems="center">
          <Box component="span" sx={{
            width: 10,
            height: 10,
            backgroundColor: '#ff6b6b',
            borderRadius: '50%',
            display: 'inline-block',
            mr: 1
          }} />
          Lower values are highlighted in red
        </Typography>
      </Box>
    </Paper>
  );
};

export default PostComparison; 