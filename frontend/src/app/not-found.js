"use client";

import Link from "next/link";
import { Box, Button, Container, Stack } from "@mui/material";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";

export default function NotFound() {
  return (
    <Container component="main" id="main-content" maxWidth="sm" sx={{ py: 14, textAlign: "center" }}>
      <Box className="animate-fade-in">
        <p className="eyebrow" style={{ justifyContent: "center" }}>
          404 · Page not found
        </p>
        <Stack component="h1" spacing={2} sx={{ mt: 1.5 }}>
          <Box component="span" sx={{ fontSize: { xs: 30, sm: 40 }, fontWeight: 600, letterSpacing: "-0.8px" }}>
            This address doesn’t lead home.
          </Box>
          <Box
            component="span"
            sx={{ display: "block", fontSize: 15, color: "var(--rt-muted)", maxWidth: 420, mx: "auto" }}
          >
            The page may have been moved or the link is out of date. Try one of these instead.
          </Box>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <Button component={Link} href="/rent" variant="contained" startIcon={<SearchOutlined />}>
            Find a home
          </Button>
          <Button component={Link} href="/roommate" variant="outlined" startIcon={<GroupOutlined />}>
            Find a roommate
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
