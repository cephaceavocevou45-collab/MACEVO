import { useState } from "react";

export function useSelectionState() {

  const [selectedText, setSelectedText] = useState("");

  const [cursorPosition, setCursorPosition] = useState(0);

  const [selectionRange, setSelectionRange] = useState(null);

  return {

    selectedText,
    setSelectedText,

    cursorPosition,
    setCursorPosition,

    selectionRange,
    setSelectionRange,

  };

}