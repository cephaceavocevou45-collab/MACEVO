import { useState } from "react";

export function useThemeState() {

  const [theme, setTheme] = useState("light");

  const [fontSize, setFontSize] = useState(16);

  const [zoom, setZoom] = useState(100);

  return {

    theme,
    setTheme,

    fontSize,
    setFontSize,

    zoom,
    setZoom,

  };

}