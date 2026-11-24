import { useEffect } from "react";

export default function useDocumentLoader(
  editor,
  documentContent
) {

  useEffect(() => {

    if (!editor) return;

    if (!documentContent) return;

    editor.commands.setContent(
      documentContent
    );

  }, [editor, documentContent]);

}