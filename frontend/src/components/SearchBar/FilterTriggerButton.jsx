import { Button, styled } from "@mui/material";

/* Shared trigger for the price and area filter menus. Rendered as a Button but
   sized to match the sibling `Select size="small"` in PropertyTypeSelect so the
   three filters read as one control group. */
export default styled((props) => <Button size="small" variant="outlined" color="inherit" {...props} />)(() => ({
  borderColor: "var(--rt-border-strong)",
  color: "var(--rt-muted)",
  fontSize: 14,
  fontWeight: 400,
  gap: "4px",
  "&:hover": {
    borderColor: "var(--rt-brand)",
    color: "var(--rt-brand)",
    backgroundColor: "rgba(var(--rt-brand-rgb), 0.04)",
  },
}));
