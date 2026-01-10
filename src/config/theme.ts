import { Platform } from "react-native";

// Merriweather font family - a beautiful, elegant serif font perfect for journaling and logging apps
// It has a classic, readable, diary-like quality that makes it ideal for recording memories
export const FONTS = {
  regular: "Merriweather_400Regular",
  bold: "Merriweather_700Bold",
  italic: "Merriweather_400Regular_Italic",
  boldItalic: "Merriweather_700Bold_Italic",
  // Fallback to system fonts if Merriweather fails to load
  regularFallback: Platform.select({
    ios: "Georgia",
    android: "serif",
    default: "serif",
  }),
  boldFallback: Platform.select({
    ios: "Georgia-Bold",
    android: "serif",
    default: "serif",
  }),
  italicFallback: Platform.select({
    ios: "Georgia-Italic",
    android: "serif",
    default: "serif",
  }),
  boldItalicFallback: Platform.select({
    ios: "Georgia-BoldItalic",
    android: "serif",
    default: "serif",
  }),
};

// Helper function to get font family with fallback
export const getFontFamily = (
  weight: "regular" | "medium" | "semiBold" | "bold" = "regular",
  italic: boolean = false
): string => {
  // Merriweather only has regular and bold variants
  // Map medium to regular, semiBold to bold for better visual hierarchy
  let fontWeight: "regular" | "bold" = "regular";
  if (weight === "medium") {
    fontWeight = "regular"; // Use regular for medium (you can still use fontWeight: "500" in styles)
  } else if (weight === "semiBold" || weight === "bold") {
    fontWeight = "bold";
  }

  const fontMap: Record<
    "regular" | "bold",
    {
      normal: string;
      italic: string;
      fallbackNormal: string;
      fallbackItalic: string;
    }
  > = {
    regular: {
      normal: FONTS.regular,
      italic: FONTS.italic,
      fallbackNormal: FONTS.regularFallback || "serif",
      fallbackItalic: FONTS.italicFallback || "serif",
    },
    bold: {
      normal: FONTS.bold,
      italic: FONTS.boldItalic,
      fallbackNormal: FONTS.boldFallback || "serif",
      fallbackItalic: FONTS.boldItalicFallback || "serif",
    },
  };

  const variant = italic ? "italic" : "normal";
  return fontMap[fontWeight][variant];
};
