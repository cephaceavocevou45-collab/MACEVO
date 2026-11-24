import { useEffect } from "react";

export default function useAutoSave(
  editor,
  enabled,
  delay = 3000,
  onSave
) {
  useEffect(() => {
    if (!editor || !enabled) return;

    const timeout = setTimeout(() => {
      if (typeof onSave === "function") {
        onSave(editor.getJSON());
      }
    }, delay);

    return () => clearTimeout(timeout);

  }, [editor, enabled, delay, onSave]);
}