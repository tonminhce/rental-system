"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { useCreatePostMutation } from "@/redux/features/createPost/createPostApi";

export default function PublishPage() {
  const user = useSelector((state) => state.auth.user);
  const authenticated = useSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [error, setError] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    try {
      setLocationBusy(true);
      const locationResponse = await fetch(
        `/api/geocoding?address=${encodeURIComponent(`${values.street}, ${values.district}, Ho Chi Minh City`)}`,
      );
      const locationData = await locationResponse.json();
      const location = locationData.results?.[0]?.geometry?.location;
      if (!location) throw new Error("We couldn’t locate that address. Please check the street and district.");
      const result = await createPost({
        ...values,
        price: Number(values.price),
        area: Number(values.area),
        bedrooms: Number(values.bedrooms),
        bathrooms: Number(values.bathrooms),
        transactionType: "rent",
        province: "Ho Chi Minh City",
        latitude: location.lat,
        longitude: location.lng,
        displayedAddress: `${values.street}, ${values.district}, Ho Chi Minh City`,
        images: [],
      }).unwrap();
      router.push(`/posts/${result.data.post.id}`);
    } catch (cause) {
      setError(cause?.data?.message || cause.message || "Your listing couldn’t be published. Please try again.");
    } finally {
      setLocationBusy(false);
    }
  };
  return (
    <Container component="main" id="main-content" maxWidth="md" sx={{ py: 5 }}>
      <Box className="animate-fade-in">
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          MAKE ROOM FOR SOMEONE’S NEXT CHAPTER
        </Typography>
        <Typography component="h1" variant="h4" sx={{ my: 2 }}>
          List your property.
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Share the essentials. Help someone find a place to call home.
        </Typography>
      </Box>
      {!authenticated ? (
        <Paper variant="outlined" sx={{ p: 4 }} className="animate-fade-in-up">
          <Typography variant="h6">Start with a property-owner account</Typography>
          <Typography sx={{ my: 2 }}>Log in or create an owner account to publish a rental listing.</Typography>
          <Button component={Link} href="/login?returnURL=/landlord/publish" variant="contained">
            Log in
          </Button>
          <Button component={Link} href="/signup?returnURL=/landlord/publish" sx={{ ml: 2 }}>
            Create an account
          </Button>
        </Paper>
      ) : user?.role !== "rental" ? (
        <Alert severity="info" className="animate-fade-in-up">
          Publishing is available to property-owner accounts. Your current account is a renter account.
        </Alert>
      ) : (
        <Paper
          component="form"
          onSubmit={submit}
          variant="outlined"
          className="animate-fade-in-up"
          sx={{ p: { xs: 2.5, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}
        >
          <TextField
            name="name"
            label="Listing title"
            required
            inputProps={{ maxLength: 100 }}
            sx={{ gridColumn: "1 / -1" }}
          />
          <TextField name="propertyType" label="Property type" select defaultValue="apartment">
            {["apartment", "house", "room", "villa"].map((type) => (
              <MenuItem value={type} key={type}>
                {type[0].toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField name="district" label="District" required select defaultValue="Bình Thạnh">
            {["Bình Thạnh", "Thủ Đức", "Quận 1", "Quận 3", "Quận 7", "Tân Bình"].map((district) => (
              <MenuItem value={district} key={district}>
                {district}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            name="street"
            label="Street address"
            required
            sx={{ gridColumn: "1 / -1" }}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            name="price"
            label="Rent (million VND / month)"
            type="number"
            required
            inputProps={{ min: 0.1, step: 0.1, max: 100000 }}
          />
          <TextField name="area" label="Area (m²)" type="number" required inputProps={{ min: 1, max: 100000 }} />
          <TextField
            name="bedrooms"
            label="Bedrooms"
            type="number"
            required
            defaultValue={1}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            name="bathrooms"
            label="Bathrooms"
            type="number"
            required
            defaultValue={1}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            name="contactName"
            label="Contact name"
            required
            defaultValue={user?.name}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            name="contactPhone"
            label="Contact phone"
            type="tel"
            required
            inputProps={{ maxLength: 32, pattern: "[+0-9 ()-]{8,32}" }}
          />
          <TextField
            name="description"
            label="Describe your property"
            required
            multiline
            minRows={4}
            inputProps={{ maxLength: 5000 }}
            sx={{ gridColumn: "1 / -1" }}
          />
          <Alert severity="info" sx={{ gridColumn: "1 / -1" }}>
            Your address and contact details will appear publicly when you publish. Photo uploads are not available in
            this version.
          </Alert>
          {error && (
            <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>
              {error}
            </Alert>
          )}
          <Button type="submit" variant="contained" disabled={isLoading || locationBusy} sx={{ gridColumn: "1 / -1" }}>
            {isLoading || locationBusy ? "Publishing…" : "Publish rental listing"}
          </Button>
        </Paper>
      )}
    </Container>
  );
}
