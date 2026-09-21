"use client";
import SearchBar from "@/components/SearchBar";
import { Box, Container } from "@mui/material";

export default function PropertyLayout({ children }) {
  return (
    <Container
      component="main"
      id="main-content"
      maxWidth="xl"
      sx={{ position: "relative", pt: 3, px: { xs: 2.5, md: 5 } }}
    >
      <SearchBar />
      <Box height={24}></Box>

      {children}
    </Container>
  );
}
