/**
 * JS mirror of src/scss/_tokens.scss.
 *
 * SCSS owns the palette; this module exists for the places that cannot read a
 * CSS custom property — the MUI theme object (which computes contrast from
 * real values) and canvas/map SDKs such as Goong markers and loaders.
 * Keep the two files in step; everything else should use `var(--rt-*)`.
 */
export const palette = {
  brand: "#234c3e",
  brandHover: "#17382a",
  brandActive: "#122e22",
  brandMuted: "#4a6b57",
  brandAccent: "#739572",
  brandInk: "#345337",
  ink: "#25332c",
  muted: "#6b7266",
  faint: "#8a9184",
  onBrand: "#ffffff",
  bg: "#fbfaf7",
  paper: "#ffffff",
  surface: "#f5f6f0",
  surfaceTint: "#eef1e8",
  surfaceSand: "#f5f4e9",
  border: "#e2e7dc",
  borderStrong: "#c9d3c2",
  onDark: "#ffffff",
  onDarkMuted: "#c4cfb8",
  onDarkAccent: "#dbe7b9",
  danger: "#c62828",
  dangerHover: "#a71f1f",
  success: "#2e7d32",
  gold: "#9b6647",
  goldHover: "#7d5a3b",
  goldBright: "#b18a5c",
};

export const radius = { sm: 6, md: 8, lg: 12, xl: 16 };

export const shadow = {
  sm: "0 2px 8px rgba(35, 76, 62, 0.06)",
  md: "0 8px 28px rgba(35, 76, 62, 0.09)",
  lg: "0 16px 36px rgba(35, 76, 62, 0.12)",
  overlay: "0 20px 48px -8px rgba(35, 76, 62, 0.2)",
};

export const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
