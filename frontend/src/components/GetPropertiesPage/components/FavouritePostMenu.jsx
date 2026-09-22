import { useGetFavouritesQuery, useRemoveFromFavouriteMutation } from "@/redux/features/properties/propertyApi";
import { CloseOutlined, FavoriteBorderOutlined } from "@mui/icons-material";
import { Menu, Divider, Stack, Typography, CardMedia, Box, Button, Link, IconButton } from "@mui/material";
import { grey } from "@mui/material/colors";
import Image from "next/image";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import NextLink from "next/link";

function NoFavouritePostContent() {
  return (
    <Stack direction="column" p={1} alignItems="center">
      <Typography variant="body2" component="h6" align="center" position="relative">
        Click <FavoriteBorderOutlined sx={{ position: "absolute", top: 0 }} />{" "}
        <Box sx={{ width: 25, display: "inline-block" }}></Box> to add post to favourite
      </Typography>

      <Typography variant="body2">and view them here</Typography>
    </Stack>
  );
}

function FavouritePostsContent({ properties = [], onDeleteFavourite }) {
  return (
    <>
      {properties.map((property) => (
        <Stack
          direction="row"
          key={property.id}
          py={1}
          px={1}
          alignItems="center"
          sx={{
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer",
            position: "relative",
            borderRadius: "8px",
            transition: "background-color 0.2s ease",
            "&:hover": {
              backgroundColor: "rgba(var(--rt-brand-rgb), 0.06)",
            },
            "&:hover .delete-icon": {
              display: "block",
            },
          }}
        >
          <Box style={{ position: "relative", height: "70px", width: "90px", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
            {property?.images?.[0]?.url && (
              <Image src={property.images[0].url} fill sizes="90px" style={{ objectFit: "cover" }} alt={property.name} />
            )}
          </Box>
          <Typography
            component={NextLink}
            href={`/posts/${property.id}`}
            key={property.id}
            variant="body2"
            ml={1.5}
            mr={3}
            sx={{
              fontWeight: 500,
              textDecoration: "none",
              color: "var(--rt-ink)",
              "&:hover": { color: "var(--rt-brand)" },
            }}
          >
            {property.name}
          </Typography>
          <CloseOutlined
            onClick={() => onDeleteFavourite(property.id)}
            className="delete-icon"
            sx={{
              display: "none",
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 18,
              color: "var(--rt-muted)",
              transition: "color 0.2s ease",
              "&:hover": { color: "var(--rt-danger)" },
            }}
          />
        </Stack>
      ))}
    </>
  );
}

export default function FavouritePostMenu({ anchorEl, open, onCancel }) {
  const authenticated = useSelector((state) => state.auth.isAuthenticated);
  const { data, isLoading: loading, refetch } = useGetFavouritesQuery(undefined, { skip: !authenticated });
  const [removeFromFavourite] = useRemoveFromFavouriteMutation();

  const handleDeleteFavourite = async (postId) => {
    try {
      await removeFromFavourite(postId).unwrap();
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    window.addEventListener("favourite-post-updated", refetch);

    return () => window.removeEventListener("favourite-post-updated", refetch);
  }, [authenticated, refetch]);

  return (
    <Menu
      id="favourite-posts-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onCancel}
      disableScrollLock={true}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      slotProps={{
        paper: {
          style: {
            width: "380px",
            borderRadius: "14px",
            border: "1px solid var(--rt-border)",
            boxShadow: "0 12px 36px rgba(var(--rt-brand-rgb), 0.14)",
          },
        },
      }}
    >
      <Stack direction="column" p={1.5}>
        <Typography variant="body1" fontWeight="700" color="var(--rt-brand)" component="h6" align="center">
          Saved Homes
        </Typography>

        <Divider sx={{ my: 1 }} />
        {data && data?.properties?.length > 0 ? (
          <FavouritePostsContent properties={data.properties} onDeleteFavourite={handleDeleteFavourite} />
        ) : (
          <NoFavouritePostContent />
        )}
      </Stack>
    </Menu>
  );
}
