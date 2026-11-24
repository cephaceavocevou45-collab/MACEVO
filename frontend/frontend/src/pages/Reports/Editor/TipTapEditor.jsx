import { EditorContent } from "@tiptap/react";
import { useEditorContext } from "./EditorContext";

export default function TipTapEditor() {
    const { editor } = useEditorContext();

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Chargement de l'éditeur...
            </div>
        );
    }

    return (
        <EditorContent
            editor={editor}
            className="
                prose
                prose-lg
                max-w-none
                min-h-full
                focus:outline-none
            "
        />
    );
}