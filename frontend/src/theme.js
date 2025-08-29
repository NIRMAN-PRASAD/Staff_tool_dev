// frontend/src/theme.js

import { createTheme } from '@mui/material/styles';

// Your Design System Tokens
export const COLORS = {
  primary: "#7634AE",
  primary600: "#673a8fff",
  primary700: "#562681",
  primary200: "#d9bdf2",
  secondary: "#f0f0f0",
  text: "#3e3e3e",
  white: "#ffffff",
  error: "#ff4d4f",
  success: "#52c41a",
  warning: "#faad14",
  info: "#1890ff"
};

export const RADII = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "16px",
  full: "9999px"
};

export const SHADOWS = {
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 2px 6px rgba(0,0,0,0.1)",
  lg: "0 4px 12px rgba(0,0,0,0.15)",
  xl: "0 8px 24px rgba(0,0,0,0.2)"
};

export const TYPOGRAPHY = {
  fonts: {
    primary: "'Roboto', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
  },
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.5rem",
    xxl: "2rem"
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700
  },
};

// Create a theme instance that uses your design tokens
const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.primary,
      light: COLORS.primary600,
      dark: COLORS.primary700,
    },
    secondary: {
      main: COLORS.secondary,
    },
    error: { main: COLORS.error },
    warning: { main: COLORS.warning },
    info: { main: COLORS.info },
    success: { main: COLORS.success },
    text: {
        primary: COLORS.text,
        secondary: '#6c757d',
    },
    background: {
        default: '#ffffff' // Set default background to white
    }
  },
  shape: {
    borderRadius: parseInt(RADII.md, 10), // Use your medium radius as the default
  },
  spacing: 8, // MUI's spacing unit is 8px by default, aligns well with your system
  typography: {
    fontFamily: TYPOGRAPHY.fonts.primary,
    h5: {
        fontSize: TYPOGRAPHY.sizes.xl,
        fontWeight: TYPOGRAPHY.weights.bold,
    },
    body2: {
        fontSize: TYPOGRAPHY.sizes.sm,
    },
    // You can continue to define other variants like h1, h2, subtitle1, etc.
  },
  shadows: [
    "none",
    SHADOWS.sm,
    SHADOWS.md,
    SHADOWS.lg,
    SHADOWS.xl,
    // MUI expects an array of 25 shadows. We'll reuse the last one for the rest.
    SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, // 5-9
    SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, // 10-14
    SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, // 15-19
    SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, SHADOWS.xl, // 20-24
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: RADII.md, // Use your defined radius
          textTransform: 'none',
          fontWeight: TYPOGRAPHY.weights.bold,
          padding: '10px 20px',
          boxShadow: 'none',
        },
        containedPrimary: {
            '&:hover': {
                backgroundColor: COLORS.primary600,
            }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: RADII.md,
          },
        },
      },
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: RADII.lg, // Use large radius for paper elements
            }
        }
    }
  }
});

export default theme;