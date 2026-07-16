import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4CAF50",
      dark: "#2E7D32",
      light: "#E8F5E9",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#263238",
      dark: "#1C2526",
      light: "#455A64",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1C2526",
      secondary: "#607D8B",
    },
    success: {
      main: "#2E7D32",
      light: "#E8F5E9",
    },
    error: {
      main: "#C62828",
      light: "#FFEBEE",
    },
    warning: {
      main: "#EF6C00",
      light: "#FFF3E0",
    },
    info: {
      main: "#00695C",
      light: "#E0F2F1",
    },
  },

  typography: {
    fontFamily: [
      "Inter",
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),

    h3: {
      fontWeight: 800,
      color: "#1C2526",
    },

    h4: {
      fontWeight: 800,
      color: "#1C2526",
    },

    h5: {
      fontWeight: 700,
      color: "#1C2526",
    },

    h6: {
      fontWeight: 700,
      color: "#1C2526",
    },

    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },

  shape: {
    borderRadius: 14,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F5F7FA",
          color: "#1C2526",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1C2526",
          color: "#FFFFFF",
        },
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 72,
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "none",
        },
        containedPrimary: {
          backgroundColor: "#4CAF50",
          color: "#FFFFFF",
          "&:hover": {
            backgroundColor: "#2E7D32",
            boxShadow: "none",
          },
        },
        outlinedPrimary: {
          borderColor: "#4CAF50",
          color: "#2E7D32",
          "&:hover": {
            borderColor: "#2E7D32",
            backgroundColor: "#E8F5E9",
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow:
            "0 8px 24px rgba(28, 37, 38, 0.08)",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow:
            "0 8px 24px rgba(28, 37, 38, 0.08)",
          border: "1px solid rgba(38, 50, 56, 0.08)",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 10,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 800,
          color: "#263238",
          backgroundColor: "#F5F7FA",
        },
      },
    },
  },
});

export default theme;