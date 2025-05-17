"use client";
import FullscreenLoading from "@/components/FullscreenLoading";
import OwnerCard from "@/components/OwnerCard/OwnerCard";
import PostMap from "@/components/PostMap";
import PropertyImage from "@/components/PropertyImage/PropertyImage";
import { useGetPropertyByIdQuery, useGetPropertiesQuery } from "@/redux/features/properties/propertyApi";
import formatAddress from "@/utils/formatAddress";
import {
  BathtubOutlined,
  BedOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CropFree,
  FavoriteBorder,
  IosShare,
  MessageOutlined,
  PaidOutlined,
  CompareArrows,
  Close,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import PhoneIcon from "@mui/icons-material/Phone";
import { Typography, Drawer, List, ListItem, ListItemText, Button, Dialog, IconButton, DialogContent, Box, Tooltip, CircularProgress, Chip } from "@mui/material";
import "@scss/posts.scss";
import _ from "lodash";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import PostComparison from "@/components/PostComparison/PostComparison";
import SimplePagination from "@/components/Pagination/SimplePagination";
import usePricePrediction from "@/hooks/usePricePrediction";

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

export default function PostDetailPage({ params }) {
  const { data, isLoading } = useGetPropertyByIdQuery(params.slug);
  const post = data?.post;
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);
  const [selectedPostForComparison, setSelectedPostForComparison] = useState(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  const {
    predictedPrice,
    isPredicting,
    priceDifference,
    getPriceDifferenceText
  } = usePricePrediction(post);

  // Fetch properties with pagination
  const { data: propertiesData, isLoading: isLoadingProperties } = useGetPropertiesQuery({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    propertyType: post?.propertyType,
    transactionType: post?.transactionType,
  });

  const otherProperties = useMemo(() => {
    if (!propertiesData?.properties || !post) return [];
    return propertiesData.properties.filter(p => p.id !== post.id);
  }, [propertiesData?.properties, post]);

  const getPostSummary = ({ propertyType, address }) => {
    return `${_.capitalize(propertyType)} in ${formatAddress(address)}`;
  };

  const handleCompare = () => {
    setIsComparisonModalOpen(true);
    setIsCompareDrawerOpen(false);
  };

  const handleCloseModal = () => {
    setIsComparisonModalOpen(false);
  };

  const handleSelectPostForComparison = (property) => {
    setSelectedPostForComparison(property);
  };

  // Handle pagination - update to fetch new page from server
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Total pages comes from the API response now
  const totalPages = useMemo(() => {
    return propertiesData?.pagination?.total_pages || 1;
  }, [propertiesData?.pagination]);
  
  useEffect(() => {
    if (isCompareDrawerOpen) {
      setCurrentPage(1);
    }
  }, [isCompareDrawerOpen]);

  const features = [
    {
      label: "Price",
      value: post?.price ? `${post.price} triệu/tháng` : "Thoả thuận",
      icon: PaidOutlined,
      prediction: isPredicting ? (
        <CircularProgress size={16} />
      ) : priceDifference !== null ? (
        <Tooltip
          title={
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Predicted Price
              </Typography>
              <Typography variant="body2">
                {predictedPrice?.toFixed(2)} triệu/tháng
              </Typography>
            </Box>
          }
          arrow
          placement="right"
          sx={priceTagStyles.tooltip}
        >
          <Chip
            icon={priceDifference > 0 ? <TrendingUp /> : <TrendingDown />}
            label={getPriceDifferenceText()}
            size="small"
            sx={priceDifference > 0 ? priceTagStyles.chipHigher : priceTagStyles.chipLower}
          />
        </Tooltip>
      ) : null,
    },
    {
      label: "Bedroom",
      value: post?.bedrooms || 3 + " Beds",
      icon: BedOutlined,
    },
    {
      label: "Area",
      value: `${post?.area} m²`,
      icon: CropFree,
    },
    {
      label: "Bathroom",
      value: post?.bathrooms || 2 + " Baths",
      icon: BathtubOutlined,
    },
  ];

  if (isLoading) return <FullscreenLoading loading={isLoading} />;

  return (
    <div className="posts_wrapper">
      <div className="posts_container">
        <div className="posts_breadcrumbs">
          <Link href="/rent" className="posts_link">
            <ChevronLeftOutlined sx={{ fontSize: 20 }} />
            Back to Search
          </Link>
        </div>
        <Typography my={1} variant="h4" component="h1">
          {post?.name}
        </Typography>
        <Typography variant="body1" component="h2">
          {formatAddress(post.address)}
        </Typography>

        <div className="posts_gallery">
          <PropertyImage src={post.thumbnail} />
          <PropertyImage src={post.images[0].url} />
          <PropertyImage src={post.images[1].url} />
          <PropertyImage src={post.images[2].url} />
          <PropertyImage src={post.images[3].url} />
        </div>
        <div className="posts_body">
          {/* LEFT */}
          <div className="posts_left">
            {/* Overview */}
            <div className="posts_info">
              <h4 className="posts_summary">{getPostSummary(post)}</h4>
              <p className="posts_price">
                {post.price + " triệu/tháng"}
                {priceDifference !== null && (
                  <Tooltip
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Predicted Price
                        </Typography>
                        <Typography variant="body2">
                          {predictedPrice?.toFixed(2)} triệu/tháng
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="right"
                    sx={priceTagStyles.tooltip}
                  >
                    <Chip
                      icon={priceDifference > 0 ? <TrendingUp /> : <TrendingDown />}
                      label={getPriceDifferenceText()}
                      size="small"
                      sx={priceDifference > 0 ? priceTagStyles.chipHigher : priceTagStyles.chipLower}
                    />
                  </Tooltip>
                )}
              </p>
              <div className="posts_actions">
                <div className="posts_action">
                  <IosShare sx={{ fontSize: 20 }} />
                  Share
                </div>
                <div className="posts_action">
                  <FavoriteBorder sx={{ fontSize: 20 }} />
                  Save
                </div>
                <div className="posts_action" onClick={() => setIsCompareDrawerOpen(true)}>
                  <CompareArrows sx={{ fontSize: 20 }} />
                  Compare
                </div>
              </div>
            </div>
            {/* Features */}
            <div className="posts_feature">
              <h4 style={{ fontWeight: 500 }}>Home Highlights</h4>
              <div className="posts_featureList">
                {features.map((feature) => (
                  <div className="posts_featureItem" key={feature.label}>
                    <p className="posts_featureLabel">
                      {feature.icon && <feature.icon sx={{ fontSize: 20 }} />}
                      {feature.label}
                    </p>
                    <div className="posts_featureValue">
                      {feature.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Description */}
            <div className="posts_description">
              <h4>Home Description</h4>
              <p>{post.description}</p>
              <div className="posts_descriptionButton">
                Show more <ChevronRightOutlined />
              </div>
            </div>
            {/* Map */}
            <div className="posts_location">
              <h4>See on map</h4>
              <p>{formatAddress(post.address)}</p>

              <PostMap coordinates={post.coordinates?.coordinates} address={post.address} />
            </div>
          </div>
          {/* RIGHT */}
          <div className="posts_right">
            {/* Owner Card */}
            <div className="posts_card">
              <OwnerCard owner={post.contactName} />
              <div className="posts_cardActions">
                <button className="posts_cardButton posts_cardButton--active">
                  <PhoneIcon sx={{ fontSize: 25 }} />
                  {post.contactPhone}
                </button>
                <button className="posts_cardButton">
                  <MessageOutlined sx={{ fontSize: 20 }} />
                  Send message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Drawer */}
      <Drawer
        anchor="right"
        open={isCompareDrawerOpen}
        onClose={() => setIsCompareDrawerOpen(false)}
      >
        <div style={{ width: 300, padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Compare with
          </Typography>
          
          {isLoadingProperties ? (
            <Typography>Loading properties...</Typography>
          ) : otherProperties.length === 0 ? (
            <Typography>No other properties available for comparison</Typography>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List>
                  {otherProperties.map((property) => (
                    <ListItem 
                      button 
                      key={property.id} 
                      onClick={() => handleSelectPostForComparison(property)}
                      selected={selectedPostForComparison?.id === property.id}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&.Mui-selected': {
                          backgroundColor: '#f0f7ff',
                        },
                      }}
                    >
                      <ListItemText 
                        primary={property.name}
                        secondary={`${property.price} triệu/tháng · ${property.area} m²`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {totalPages > 1 && (
                <Box sx={{ pt: 1, borderTop: '1px solid #eee' }}>
                  <SimplePagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    size="small"
                    maxPageButtons={3}
                  />
                </Box>
              )}
            </Box>
          )}
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleCompare}
            disabled={!selectedPostForComparison}
            sx={{
              mt: 2,
              bgcolor: '#ff5722',
              '&:hover': {
                bgcolor: '#e64a19',
              },
            }}
          >
            Compare
          </Button>
        </div>
      </Drawer>

      {/* Comparison Modal */}
      <Dialog
        open={isComparisonModalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500',
              bgcolor: 'white',
              '&:hover': { bgcolor: 'grey.100' },
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>
          {selectedPostForComparison && (
            <PostComparison post1={post} post2={selectedPostForComparison} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
