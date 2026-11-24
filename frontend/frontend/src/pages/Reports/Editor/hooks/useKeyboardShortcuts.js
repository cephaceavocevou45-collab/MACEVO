import { useEffect } from "react";

export default function useKeyboardShortcuts(editor) {

  useEffect(() => {

    if (!editor) return;

    const handleKeyDown = (event) => {

      if (event.ctrlKey && event.key === "s") {

        event.preventDefault();

        console.log("Sauvegarde");

      }

    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [editor]);

}