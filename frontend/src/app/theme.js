"use client";
import { createTheme } from "@mui/material/styles";
export default createTheme({
  palette: {
    primary: { main: "#234c3e", dark: "#16392e", contrastText: "#ffffff" },
    secondary: { main: "#9b6647" },
    blue: { main: "#466b5b", contrastText: "#fff" },
    background: { default: "#fbfaf7", paper: "#ffffff" },
    text: { primary: "#26372d", secondary: "#70796b" },
    divider: "#e3e7dc",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-sans), Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
    h4: { fontWeight: 600, letterSpacing: "-0.8px" },
    h5: { fontWeight: 600, letterSpacing: "-0.5px" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8, minHeight: 40 } },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 36 } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: "#fff", fontSize: 14 } } },
    MuiCard: { styleOverrides: { root: { boxShadow: "none", borderColor: "#e3e7dc" } } },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});
