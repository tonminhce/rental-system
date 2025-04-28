"use client";
import { grey, orange } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: orange[800],
      contrastText: "#fff",
    },
    secondary: {
      main: "#f44336",
    },
    blue: {
      main: "#5F9DF7",
      contrastText: "#fff",
    },
  },
  typography: {
    button: {
      textTransform: "none",
      fontWeight: "normal",
    },
    h4: {
      fontWeight: 600,
      color: grey[900],
    },
  },
  components: {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
        },
      },
    },
  },
});
export default theme;
