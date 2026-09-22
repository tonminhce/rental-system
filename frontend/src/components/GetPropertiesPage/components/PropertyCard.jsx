"use client";
import { useAddToFavouriteMutation, useRemoveFromFavouriteMutation } from "@/redux/features/properties/propertyApi";
import {
  CropFreeOutlined,
  FavoriteOutlined,
  FavoriteBorderOutlined,
  BedOutlined,
  ArrowOutward,
  PlaceOutlined,
} from "@mui/icons-material";
import { Alert, Button, IconButton, Snackbar } from "@mui/material";
import { formatRent } from "@/utils/rentalSearch.mjs";
import { PROPERTY_TYPES } from "@/constants/propertyTypes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./PropertyCard.scss";

export default function PropertyCard({ property, onLocate }) {
  const { id, name, price, area, thumbnail, bedrooms, district, displayedAddress, propertyType, isFavourite } =
    property;
  const router = useRouter();
  const [saved, setSaved] = useState(!!isFavourite);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [thumbnail]);
  const [error, setError] = useState("");
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const [add, addState] = useAddToFavouriteMutation();
  const [remove, removeState] = useRemoveFromFavouriteMutation();
  useEffect(() => {
    setSaved(!!isFavourite);
  }, [isFavourite]);
  const toggle = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const before = saved;
    setSaved(!before);
    try {
      await (before ? remove(id) : add(id)).unwrap();
      window.dispatchEvent(new CustomEvent("favourite-post-updated", { detail: { postId: id, isFavourite: !before } }));
    } catch {
      setSaved(before);
      setError("Couldn’t update your saved homes. Please try again.");
    }
  };
  const type = PROPERTY_TYPES[propertyType]?.label || "Rental home";
  return (
    <article className="property-card">
      <div className="property-image">
        <Link href={`/posts/${id}`} aria-label={`View ${name}`}>
          {thumbnail && !imageFailed ? (
            <img src={thumbnail} alt={name || "Rental home"} loading="lazy" onError={() => setImageFailed(true)} />
          ) : (
            <div className="property-image-empty">
              <BedOutlined />
              <span>Photo not available</span>
            </div>
          )}
        </Link>
        <span className="property-type">{type}</span>
        <IconButton
          aria-label={saved ? `Unsave ${name}` : `Save ${name}`}
          aria-pressed={saved}
          onClick={toggle}
          disabled={addState.isLoading || removeState.isLoading}
          className={`save-home ${saved ? "saved" : ""}`}
        >
          {saved ? <FavoriteOutlined /> : <FavoriteBorderOutlined />}
        </IconButton>
      </div>
      <div className="property-content">
        <p className="property-location">{district || displayedAddress || "Ho Chi Minh City"}</p>
        <Link href={`/posts/${id}`} className="property-title">
          {name || displayedAddress || "Rental home"}
        </Link>
        <div className="property-specs">
          <span>
            <BedOutlined /> {bedrooms ?? "—"} bed
          </span>
          <span>
            <CropFreeOutlined /> {area ? `${Number(area)} m²` : "Area not listed"}
          </span>
        </div>
        <div className="property-bottom">
          <p>
            <strong>{formatRent(price)}</strong>
            {Number(price) > 0 && <span> / month</span>}
          </p>
          {onLocate &&
          property.coordinates?.coordinates?.length === 2 &&
          property.coordinates.coordinates.every(Number.isFinite) ? (
            <Button
              className="locate-home"
              size="small"
              startIcon={<PlaceOutlined />}
              onClick={() => onLocate(property)}
              aria-label={`Show ${name} on map`}
            >
              Map
            </Button>
          ) : (
            <Link href={`/posts/${id}`} aria-label={`Details for ${name}`}>
              <ArrowOutward />
            </Link>
          )}
        </div>
      </div>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError("")}>
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </article>
  );
}
