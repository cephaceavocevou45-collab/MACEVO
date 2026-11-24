import { useEffect } from "react";

export default function useWordCount(
  editor,
  setWordCount,
  setCharacterCount
) {
  useEffect(() => {
    if (!editor) return;

    const update = () => {

      setWordCount(editor.storage.characterCount.words());

      setCharacterCount(
        editor.storage.characterCount.characters()
      );

    };

    update();

    editor.on("update", update);

    return () => {
      editor.off("update", update);
    };

  }, [editor, setWordCount, setCharacterCount]);
}