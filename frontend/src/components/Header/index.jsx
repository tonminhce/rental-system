"use client";
import NextLink from "next/link";
import { useSelector } from "react-redux";
// import HeaderLink from "./HeaderLink";
import useMenu from "@/hooks/useMenu";
import { FavoriteBorderOutlined, NotificationsOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Container, IconButton, Link, Stack, styled, Tooltip, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import FavouritePostMenu from "../GetPropertiesPage/components/FavouritePostMenu";
import AccountMenu from "./components/AccountMenu";

const HeaderLink = ({ children, ...props }) => (
  <Link component={NextLink} underline="none" {...props}>
    {children}
  </Link>
);

const HeaderWrapper = styled((props) => <Container maxWidth="xl" {...props} />)(({ theme }) => ({
  height: "60px",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  position: "fixed",
  zIndex: 1000,
  backgroundColor: "white",
  boxShadow: "rgba(239, 108, 0, 0.1) 0px 0px 10px 0px",
}));

function Header() {
  const router = useRouter();
  const user = useSelector((state) => state.auth.user);
  const userName = useMemo(() => user?.name || "User", [user]);

  const [open, anchorEl, handleClick, handleClose] = useMenu();
  const [isFavouriteMenuOpen, favouriteBtn, handleOpenFavouriteMenu, handleCloseFavouriteMenu] = useMenu();

  return (
    <>
      <HeaderWrapper>
        <Stack direction="row" spacing={3} alignItems="center">
          <HeaderLink href="/" sx={{ fontSize: 28, fontWeight: 600, width: 120 }}>
            renTalk
          </HeaderLink>
        </Stack>

        <Stack direction="row" spacing={1}>
          {/* <Button onClick={() => router.push("/landlord/publish")} size="large" color="inherit">
            <Typography sx={{ fontSize: 16, fontWeight: 500 }}>Create New Post</Typography>
          </Button> */}

          {user ? (
            <>
              <Tooltip title="List of saved post">
                <IconButton onClick={handleOpenFavouriteMenu}>
                  <FavoriteBorderOutlined />
                </IconButton>
              </Tooltip>

              {/* <IconButton>
                <NotificationsOutlined />
              </IconButton> */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  border: 1,
                  borderColor: grey[300],
                  px: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                }}
                onClick={handleClick}
              >
                <Avatar src={user?.avatar} sx={{ width: 30, height: 30 }} />
                <Typography>{userName}</Typography>
              </Stack>
            </>
          ) : (
            <Button onClick={() => router.push("/login")} variant="outlined">
              Sign Up or Login
            </Button>
          )}
        </Stack>
        <AccountMenu anchorEl={anchorEl} open={open} handleClose={handleClose} />
      </HeaderWrapper>

      <FavouritePostMenu anchorEl={favouriteBtn} open={isFavouriteMenuOpen} onCancel={handleCloseFavouriteMenu} />
      <Box sx={{ width: "100%", height: "60px" }}></Box>
    </>
  );
}

export default Header;
