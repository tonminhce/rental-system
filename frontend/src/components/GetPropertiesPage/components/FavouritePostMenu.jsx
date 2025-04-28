import { useGetFavouritesQuery, useRemoveFromFavouriteMutation } from "@/redux/features/properties/propertyApi";
import { CloseOutlined, DeleteOutline, FavoriteBorderOutlined } from "@mui/icons-material";
import { Menu, Divider, Stack, Typography, CardMedia, Box, Button, Link, IconButton } from "@mui/material";
import { grey } from "@mui/material/colors";
import Image from "next/image";
import NextLink from "next/link";
import { useEffect } from "react";

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
          key={property._id}
          py={1}
          sx={{
            textDecoration: "none",
            color: "inherit",
            cursor: "pointer",
            position: "relative",
            "&:hover": {
              backgroundColor: grey[200],
            },
            "&:hover .delete-icon": {
              display: "block",
            },
          }}
        >
          <Box style={{ position: "relative", height: "80px", width: "100px" }}>
            <Image src={property.thumbnail} width={100} height={80} alt={property.name} />
          </Box>
          <Typography key={property._id} variant="body2" ml={1} mr={3}>
            {property.name}
          </Typography>
          <CloseOutlined
            onClick={() => onDeleteFavourite(property._id)}
            className="delete-icon"
            sx={{
              display: "none",
              position: "absolute",
              right: 5,
              top: 25,
            }}
          />
        </Stack>
      ))}
      <Divider sx={{ my: 1 }} />

      <Link
        sx={{ margin: "6px auto 0", fontWeight: "roboto" }}
        component={NextLink}
        underline="none"
        href="/favourites"
      >
        View all posts
      </Link>
    </>
  );
}

export default function FavouritePostMenu({ anchorEl, open, onCancel }) {
  const { data, loading, refetch } = useGetFavouritesQuery();
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
    window.addEventListener("favourite-post-updated", refetch);

    return () => window.removeEventListener("favourite-post-updated", refetch);
  }, []);

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
          },
        },
      }}
    >
      <Stack direction="column" p={1}>
        <Typography variant="body1" fontWeight="bold" component="h6" align="center">
          Your favourite posts
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
