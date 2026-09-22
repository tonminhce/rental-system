"use client";
import FullscreenLoading from "@/components/FullscreenLoading";
import OwnerCard from "@/components/OwnerCard/OwnerCard";
import PostMap from "@/components/PostMap";
import PropertyImage from "@/components/PropertyImage/PropertyImage";
import { useGetPropertyByIdQuery, useGetPropertiesQuery } from "@/redux/features/properties/propertyApi";
import formatAddress from "@/utils/formatAddress";
import { PROPERTY_TYPES } from "@/constants/propertyTypes";
import { formatRent } from "@/utils/rentalSearch.mjs";
import clsx from "clsx";
import {
  BathtubOutlined,
  BedOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CropFree,
  FavoriteBorder,
  Favorite,
  IosShare,
  MessageOutlined,
  PaidOutlined,
  CompareArrows,
  Close,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import PhoneIcon from "@mui/icons-material/Phone";
import {
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import "@scss/posts.scss";
import _ from "lodash";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import PostComparison from "@/components/PostComparison/PostComparison";
import SimplePagination from "@/components/Pagination/SimplePagination";
import usePricePrediction from "@/hooks/usePricePrediction";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useAddToFavouriteMutation, useRemoveFromFavouriteMutation } from "@/redux/features/properties/propertyApi";

const priceTagStyles = {
  tooltip: {
    maxWidth: 220,
    backgroundColor: "#fff",
    color: "rgba(0, 0, 0, 0.87)",
    boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
    padding: "12px 16px",
    "& .MuiTooltip-arrow": {
      color: "#fff",
    },
  },
  chipHigher: {
    backgroundColor: "rgba(244, 67, 54, 0.08)",
    color: "var(--rt-danger)",
    border: "1px solid rgba(244, 67, 54, 0.2)",
    marginLeft: "8px",
    "&:hover": {
      backgroundColor: "rgba(244, 67, 54, 0.12)",
    },
  },
  chipLower: {
    backgroundColor: "rgba(76, 175, 80, 0.08)",
    color: "var(--rt-success)",
    border: "1px solid rgba(76, 175, 80, 0.2)",
    marginLeft: "8px",
    "&:hover": {
      backgroundColor: "rgba(76, 175, 80, 0.12)",
    },
  },
};

export default function PostDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error, refetch } = useGetPropertyByIdQuery(slug);
  const router = useRouter();
  const authenticated = useSelector((state) => state.auth.isAuthenticated);
  const [addFavorite] = useAddToFavouriteMutation();
  const [removeFavorite] = useRemoveFromFavouriteMutation();
  const [actionMessage, setActionMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const post = data?.post;
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);
  const [selectedPostForComparison, setSelectedPostForComparison] = useState(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { predictedPrice, isPredicting, priceDifference, getPriceDifferenceText } = usePricePrediction(post);

  // Fetch properties with pagination
  const { data: propertiesData, isLoading: isLoadingProperties } = useGetPropertiesQuery(
    {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      propertyType: post?.propertyType,
      transactionType: post?.transactionType,
    },
    { skip: !post },
  );

  const otherProperties = useMemo(() => {
    if (!propertiesData?.properties || !post) return [];
    return propertiesData.properties.filter((p) => p.id !== post.id);
  }, [propertiesData?.properties, post]);

  const getPostSummary = ({ propertyType, address }) => {
    const typeLabel = PROPERTY_TYPES[propertyType]?.label || _.capitalize(propertyType) || "Home";
    return `${typeLabel} in ${formatAddress(address)}`;
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
      value: formatRent(post?.price),
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
                {predictedPrice != null ? `${formatRent(predictedPrice)} / month` : "—"}
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
      value: post?.bedrooms ?? "Not listed",
      icon: BedOutlined,
    },
    {
      label: "Area",
      value: Number(post?.area) > 0 ? `${Number(post.area)} m²` : "Not listed",
      icon: CropFree,
    },
    {
      label: "Bathroom",
      value: post?.bathrooms ?? "Not listed",
      icon: BathtubOutlined,
    },
  ];

  if (isLoading) return <FullscreenLoading loading={isLoading} />;
  if (error || !post)
    return (
      <main id="main-content" style={{ padding: 48 }}>
        <Typography variant="h4">This home couldn’t be loaded.</Typography>
        <Button onClick={refetch}>Try again</Button>
        <Button component={Link} href="/rent">
          Browse homes
        </Button>
      </main>
    );
  const photos = post.images || [];
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionMessage("Link copied to clipboard.");
    } catch {
      setActionMessage("Copy this page’s address from your browser to share this home.");
    }
  };
  const save = async () => {
    if (!authenticated) {
      router.push(`/login?returnURL=/posts/${post.id}`);
      return;
    }
    setSaving(true);
    try {
      await (post.isFavourite ? removeFavorite(post.id) : addFavorite(post.id)).unwrap();
      refetch();
      window.dispatchEvent(new Event("favourite-post-updated"));
    } catch {
      setActionMessage("Couldn’t update saved homes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main id="main-content" className="posts_wrapper">
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
          {post.displayedAddress || formatAddress(post.address || post)}
        </Typography>

        {post.sourceUrl ? (
          <Typography sx={{ mt: 2, color: "text.secondary" }} variant="body2">
            Imported listing · Photos and availability have not been verified.
          </Typography>
        ) : (
          process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
            <Typography sx={{ mt: 2, color: "text.secondary" }} variant="body2">
              Sample listing · Photos are illustrative. This is not a verified rental offer.
            </Typography>
          )
        )}
        <div className={`posts_gallery ${photos.length <= 1 ? "posts_gallery--single" : ""}`}>
          {photos.length ? (
            photos
              .slice(0, 4)
              .map((photo, index) => (
                <PropertyImage
                  key={photo.id || index}
                  src={photo.url}
                  alt={`${post.name} — photo ${index + 1}`}
                  priority={index === 0}
                />
              ))
          ) : (
            <Box sx={{ p: 5 }}>No photos have been added to this home.</Box>
          )}
        </div>
        <div className="posts_body">
          {/* LEFT */}
          <div className="posts_left">
            {/* Overview */}
            <div className="posts_info">
              <h2 className="posts_summary">{getPostSummary(post)}</h2>
              <p className="posts_price">
                {formatRent(post.price)}
                {Number(post.price) > 0 && " / month"}
                {priceDifference !== null && (
                  <Tooltip
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Predicted Price
                        </Typography>
                        <Typography variant="body2">
                          {predictedPrice != null ? `${formatRent(predictedPrice)} / month` : "—"}
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
                <button className="posts_action" onClick={share}>
                  <IosShare sx={{ fontSize: 20 }} />
                  Share
                </button>
                <button
                  className={clsx("posts_action", post.isFavourite && "posts_action--saved")}
                  onClick={save}
                  disabled={saving}
                  aria-pressed={Boolean(post.isFavourite)}
                >
                  {post.isFavourite ? (
                    <Favorite sx={{ fontSize: 20 }} />
                  ) : (
                    <FavoriteBorder sx={{ fontSize: 20 }} />
                  )}
                  {post.isFavourite ? "Saved" : "Save"}
                </button>
                <button className="posts_action" onClick={() => setIsCompareDrawerOpen(true)}>
                  <CompareArrows sx={{ fontSize: 20 }} />
                  Compare
                </button>
              </div>
            </div>
            {actionMessage && (
              <Typography role="status" variant="body2" sx={{ mb: 2 }}>
                {actionMessage}
              </Typography>
            )}
            {/* Features */}
            <div className="posts_feature">
              <h2>Home Highlights</h2>
              <div className="posts_featureList">
                {features.map((feature) => (
                  <div className="posts_featureItem" key={feature.label}>
                    <p className="posts_featureLabel">
                      {feature.icon && <feature.icon sx={{ fontSize: 20 }} />}
                      {feature.label}
                    </p>
                    <div className="posts_featureValue">{feature.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Description */}
            <div className={clsx("posts_description", !descriptionExpanded && "posts_description--clamped")}>
              <h2>Home Description</h2>
              <p>{post.description}</p>
              {post.description?.length > 320 && (
                <button
                  type="button"
                  className="posts_descriptionButton"
                  aria-expanded={descriptionExpanded}
                  onClick={() => setDescriptionExpanded((open) => !open)}
                >
                  {descriptionExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
            {/* Map */}
            <div className="posts_location">
              <h2>See on map</h2>
              <p>{formatAddress(post.address)}</p>

              <PostMap coordinates={post.coordinates?.coordinates} />
            </div>
          </div>
          {/* RIGHT */}
          <div className="posts_right">
            {/* Owner Card */}
            <div className="posts_card">
              <OwnerCard owner={post.contactName} />
              <div className="posts_cardActions">
                {post.contactPhone ? (
                  <a
                    href={`tel:${post.contactPhone.replace(/[^+\d]/g, "")}`}
                    className="posts_cardButton posts_cardButton--active"
                  >
                    <PhoneIcon sx={{ fontSize: 25 }} />
                    {post.contactPhone}
                  </a>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No phone number listed yet.
                  </Typography>
                )}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<MessageOutlined />}
                  onClick={() => setIsInquiryOpen(true)}
                  sx={{ mt: 1.5, py: 1, textTransform: "none", fontWeight: 600 }}
                >
                  Message the owner
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Owner Dialog */}
      <Dialog
        open={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="listing-inquiry-title"
      >
        <DialogTitle id="listing-inquiry-title" sx={{ fontWeight: 600 }}>
          Message about this listing
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Regarding: <strong>{post.name}</strong>
          </Typography>
          <TextField
            label="Your message"
            placeholder="Hi, I’m interested in this listing. Is it still available, and when could I visit?…"
            multiline
            rows={4}
            fullWidth
            value={inquiryMessage}
            onChange={(e) => setInquiryMessage(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsInquiryOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!inquiryMessage.trim()}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(inquiryMessage);
                setActionMessage("Message copied to your clipboard. Paste it when you contact the owner.");
              } catch {
                setActionMessage("Couldn’t copy your message. Select and copy it manually instead.");
              }
              setIsInquiryOpen(false);
              setInquiryMessage("");
            }}
          >
            Copy message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comparison Drawer */}
      <Drawer
        anchor="right"
        open={isCompareDrawerOpen}
        onClose={() => setIsCompareDrawerOpen(false)}
        ModalProps={{ "aria-labelledby": "compare-drawer-title" }}
      >
        <div style={{ width: 300, padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" id="compare-drawer-title" gutterBottom>
            Compare with
          </Typography>

          {isLoadingProperties ? (
            <Typography>Loading properties...</Typography>
          ) : otherProperties.length === 0 ? (
            <Typography>No other properties available for comparison</Typography>
          ) : (
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                <List>
                  {otherProperties.map((property) => (
                    <ListItem
                      button
                      key={property.id}
                      onClick={() => handleSelectPostForComparison(property)}
                      selected={selectedPostForComparison?.id === property.id}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        transition: "all 0.15s ease",
                        "&:hover": {
                          backgroundColor: "rgba(var(--rt-brand-rgb), 0.06)",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "rgba(var(--rt-brand-rgb), 0.12)",
                          color: "var(--rt-brand)",
                        },
                      }}
                    >
                      <ListItemText
                        primary={property.name}
                        secondary={`${formatRent(property.price)} · ${property.area ? `${Number(property.area)} m²` : "Area n/a"}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {totalPages > 1 && (
                <Box sx={{ pt: 1, borderTop: "1px solid var(--rt-border)" }}>
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
              bgcolor: "var(--rt-brand)",
              "&:hover": {
                bgcolor: "var(--rt-brand-hover)",
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
        aria-labelledby="comparison-modal-title"
      >
        <DialogTitle id="comparison-modal-title" sx={{ position: "absolute", left: -20000 }}>
          Property comparison
        </DialogTitle>
        <DialogContent sx={{ p: 0, position: "relative" }}>
          <IconButton
            onClick={handleCloseModal}
            aria-label="Close comparison"
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "var(--rt-muted)",
              bgcolor: "var(--rt-paper)",
              "&:hover": { bgcolor: "var(--rt-surface-tint)" },
              zIndex: 1,
            }}
          >
            <Close />
          </IconButton>
          {selectedPostForComparison && <PostComparison post1={post} post2={selectedPostForComparison} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
