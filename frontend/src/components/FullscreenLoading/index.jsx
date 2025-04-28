import { Backdrop, CircularProgress } from "@mui/material";

export default function FullscreenLoading({ loading }) {
  return (
    loading && (
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: 10000 }}>
        <CircularProgress color="inherit" size={100} />
      </Backdrop>
    )
  );
}
