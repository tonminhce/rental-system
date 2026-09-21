import { Backdrop, CircularProgress } from "@mui/material";

/* Defaults to `true` so a caller that forgets the prop shows a spinner
   instead of a blank screen. */
export default function FullscreenLoading({ loading = true }) {
  if (!loading) return null;
  return (
    <Backdrop open sx={{ color: "var(--rt-on-brand)", zIndex: (t) => t.zIndex.modal + 20 }}>
      <CircularProgress size={64} sx={{ color: "var(--rt-on-brand)" }} />
    </Backdrop>
  );
}
