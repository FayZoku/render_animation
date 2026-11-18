import { loadFont } from "@remotion/google-fonts/Poppins";

// Poppins Black (heavy). Cadangan: font sistem tebal.
const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin", "latin-ext"] });
export const FONT_FAMILY = `${fontFamily}, "Arial Black", Impact, sans-serif`;
