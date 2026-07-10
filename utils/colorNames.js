// Central color list + hex → name matcher.
// Never show raw hex to the user anywhere — always resolve through
// getColorName() first, whether the color came from a preset or a
// custom hex the vendor typed in.

export const COMMON_COLORS = [
  { name: "Black", hex: "#1a1a2e" },
  { name: "White", hex: "#ffffff" },
  { name: "Grey", hex: "#9ca3af" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Royal Blue", hex: "#2563eb" },
  { name: "Sky Blue", hex: "#7dd3fc" },
  { name: "Red", hex: "#dc2626" },
  { name: "Maroon", hex: "#7f1d1d" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Purple", hex: "#9333ea" },
  { name: "Green", hex: "#16a34a" },
  { name: "Olive", hex: "#65733f" },
  { name: "Mustard", hex: "#d4a017" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Beige", hex: "#e5ddd0" },
  { name: "Brown", hex: "#78350f" },
  { name: "Gold", hex: "#c9a227" },
];

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function distance(hexA, hexB) {
  try {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
  } catch {
    return Infinity;
  }
}

// Returns the closest matching color NAME for any hex code.
// Falls back to "Custom" only if the value isn't a valid hex at all.
export function getColorName(hex) {
  if (!hex) return "";
  if (!hex.startsWith("#")) return hex; // already a plain name somehow — pass through safely

  let closest = COMMON_COLORS[0];
  let minDist = Infinity;

  for (const c of COMMON_COLORS) {
    const d = distance(hex, c.hex);
    if (d < minDist) {
      minDist = d;
      closest = c;
    }
  }

  return closest.name;
}