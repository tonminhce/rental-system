import React from 'react';
import { Typography, Grid, Paper, Box, Divider } from '@mui/material';
import {
  BathtubOutlined,
  BedOutlined,
  CropFree,
  PaidOutlined,
  CompareArrows,
  LocationOn,
  Phone,
} from "@mui/icons-material";
import ComparisonMap from "./ComparisionMap";


const PostComparison = ({ post1, post2 }) => {
  const features = [
    {
      label: "Price",
      value1: post1?.price ? `${post1.price} triệu/tháng` : "Negotiable",
      value2: post2?.price ? `${post2.price} triệu/tháng` : "Negotiable",
      icon: PaidOutlined,
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

  const highlightDifference = (value1, value2) => {
    return value1 !== value2 ? { color: '#ff6b6b', fontWeight: 'bold' } : {};
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
                <feature.icon sx={{ mr: 1, color: '#666' }} />
                <Typography color="#666">{feature.label}</Typography>
              </Grid>
              <Grid item xs={4}>
                {feature.isContact && feature.value1 && feature.value1 !== "No phone number" ? (
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
                  <Typography sx={highlightDifference(feature.value1, feature.value2)}>
                    {feature.value1}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={4}>
                {feature.isContact && feature.value2 && feature.value2 !== "No phone number" ? (
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
                  <Typography sx={highlightDifference(feature.value1, feature.value2)}>
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
          Different values are highlighted in red
        </Typography>
      </Box>
    </Paper>
  );
};

export default PostComparison; 