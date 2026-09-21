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
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 40,
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(35, 76, 62, 0.14)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        containedPrimary: {
          backgroundColor: "#234c3e",
          "&:hover": {
            backgroundColor: "#17382a",
          },
        },
        outlinedPrimary: {
          borderColor: "#234c3e",
          color: "#234c3e",
          "&:hover": {
            borderColor: "#17382a",
            backgroundColor: "rgba(35, 76, 62, 0.05)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          transition: "box-shadow 0.25s ease, transform 0.25s ease",
        },
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: "1px solid #e8ece1",
          boxShadow: "0 10px 30px -4px rgba(35, 76, 62, 0.12), 0 4px 12px -2px rgba(35, 76, 62, 0.06)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "2px 6px",
          padding: "8px 12px",
          fontSize: "0.875rem",
          transition: "all 0.15s ease",
          "&:hover": {
            backgroundColor: "rgba(35, 76, 62, 0.07)",
            color: "#234c3e",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(35, 76, 62, 0.1)",
            color: "#234c3e",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(35, 76, 62, 0.14)",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 20px 48px -8px rgba(35, 76, 62, 0.2)",
          border: "1px solid #e8ece1",
        },
      },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 36, color: "#234c3e" } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          fontSize: 14,
          borderRadius: 8,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#234c3e",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#234c3e",
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #e3e7dc",
          borderRadius: 12,
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        },
      },
    },
    MuiTooltip: { defaultProps: { arrow: true } },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          transition: "transform 0.15s ease, background-color 0.15s ease",
        },
      },
    },
  },
});
