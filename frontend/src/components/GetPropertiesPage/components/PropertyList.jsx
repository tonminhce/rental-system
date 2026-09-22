"use client";
import Pagination from "@mui/material/Pagination";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import NotFound from "./NotFound";
import PropertyCard from "./PropertyCard";

export default function PropertyList({ properties, currentPage, totalPages, handlePageChange, onLocate, mapVisible }) {
  if (!properties || properties.length === 0) {
    return <NotFound />;
  }

  return (
    <Grid container spacing={2} className={mapVisible ? "rental-results--split" : "rental-results--wide"}>
      {properties.map((property, idx) => {
        return (
          <Grid
            key={property.id}
            xs={12}
            sm={6}
            md={mapVisible ? 12 : 4}
            lg={mapVisible ? 6 : 4}
            className="animate-fade-in-up"
            style={{ animationDelay: `${(idx % 12) * 50}ms` }}
          >
            <PropertyCard property={property} onLocate={onLocate} />
          </Grid>
        );
      })}
      <Grid xs={12} sx={{ display: "flex", justifyContent: "center" }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          siblingCount={0}
          boundaryCount={1}
          sx={{ my: 3 }}
        />
      </Grid>
    </Grid>
  );
}
