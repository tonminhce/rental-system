"use client";
import Pagination from "@mui/material/Pagination";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import NotFound from "./NotFound";
import PropertyCard from "./PropertyCard";

export default function PropertyList({ properties, currentPage, totalPages, handlePageChange }) {
  if (!properties || properties.length === 0) {
    return <NotFound />;
  }

  return (
    <Grid container spacing={2}>
      {properties.map((property, idx) => {
        return (
          <Grid
            key={property.id}
            xs={12}
            sm={6}
            className="animate-fade-in-up"
            style={{ animationDelay: `${(idx % 12) * 50}ms` }}
          >
            <PropertyCard property={property} />
          </Grid>
        );
      })}
      <Grid xs={12} sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} sx={{ marginBottom: 2 }} />
      </Grid>
    </Grid>
  );
}
