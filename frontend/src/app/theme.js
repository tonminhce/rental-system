"use client";
import { createTheme } from "@mui/material/styles";
import { palette, radius, shadow, ease } from "@/styles/palette";

export default createTheme({
  palette: {
    primary: { main: palette.brand, dark: palette.brandHover, contrastText: palette.onBrand },
    secondary: { main: palette.gold, contrastText: palette.onBrand },
    background: { default: palette.bg, paper: palette.paper },
    text: { primary: palette.ink, secondary: palette.muted },
    divider: palette.border,
    error: { main: palette.danger, dark: palette.dangerHover },
    success: { main: palette.success },
  },
  shape: { borderRadius: radius.md },
  typography: {
    fontFamily: "var(--rt-font-sans)",
    button: { textTransform: "none", fontWeight: 600 },
    h1: { fontWeight: 500, letterSpacing: "-2.2px", lineHeight: 1.15 },
    h2: { fontWeight: 500, letterSpacing: "-1.1px", lineHeight: 1.25 },
    h3: { fontWeight: 600, letterSpacing: "-0.8px" },
    h4: { fontWeight: 600, letterSpacing: "-0.8px" },
    h5: { fontWeight: 600, letterSpacing: "-0.5px" },
    caption: { color: palette.muted },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, color: "primary" },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          minHeight: 40,
          textTransform: "none",
          fontWeight: 600,
          transition: `all 0.22s ${ease}`,
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(35, 76, 62, 0.14)",
          },
          "&:active": { transform: "translateY(0)", boxShadow: "none" },
        },
        containedPrimary: {
          backgroundColor: palette.brand,
          "&:hover": { backgroundColor: palette.brandHover },
        },
        containedError: {
          backgroundColor: palette.danger,
          "&:hover": { backgroundColor: palette.dangerHover },
        },
        outlinedPrimary: {
          borderColor: palette.brand,
          color: palette.brand,
          "&:hover": {
            borderColor: palette.brandHover,
            backgroundColor: "rgba(35, 76, 62, 0.05)",
          },
        },
        outlined: { borderColor: palette.borderStrong },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", transition: `box-shadow 0.25s ease, transform 0.25s ease` },
        rounded: { borderRadius: radius.lg },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
          border: `1px solid ${palette.border}`,
          boxShadow: shadow.md,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          margin: "2px 6px",
          padding: "8px 12px",
          fontSize: "0.875rem",
          transition: "all 0.15s ease",
          "&:hover": { backgroundColor: "rgba(35, 76, 62, 0.07)", color: palette.brand },
          "&.Mui-selected": {
            backgroundColor: "rgba(35, 76, 62, 0.1)",
            color: palette.brand,
            fontWeight: 600,
            "&:hover": { backgroundColor: "rgba(35, 76, 62, 0.14)" },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.xl,
          boxShadow: shadow.overlay,
          border: `1px solid ${palette.border}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: `1px solid ${palette.border}`,
          borderRadius: radius.lg,
          transition: `transform 0.3s ${ease}, box-shadow 0.3s ${ease}`,
        },
      },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 36, color: palette.brand } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: palette.paper,
          fontSize: 14,
          borderRadius: radius.md,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: palette.brand },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.brand,
            borderWidth: 2,
          },
        },
      },
    },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          fontWeight: 500,
          transition: `transform 0.15s ease, background-color 0.15s ease`,
        },
      },
    },
  },
});
