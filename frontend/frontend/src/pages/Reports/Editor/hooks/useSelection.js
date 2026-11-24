import { useEffect } from "react";

export default function useSelection(
  editor,
  setSelectedText
) {

  useEffect(() => {

    if (!editor) return;

    const updateSelection = () => {

      const { from, to } = editor.state.selection;

      const text = editor.state.doc.textBetween(
        from,
        to,
        " "
      );

      setSelectedText(text);

    };

    editor.on(
      "selectionUpdate",
      updateSelection
    );

    return () => {

      editor.off(
        "selectionUpdate",
        updateSelection
      );

    };

  }, [editor, setSelectedText]);

}