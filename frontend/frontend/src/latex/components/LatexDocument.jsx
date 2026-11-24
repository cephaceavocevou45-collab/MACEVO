/**
 * ===========================================================
 * MACEVO
 *
 * -----------------------------------------------------------
 * Fichier : LatexDocument.jsx
 * Description : Vue éditable du document MACEVO dans Workspace LaTeX
 * Version : 2.0.1
 * ===========================================================
 */

import { EditorContent } from "@tiptap/react";
import { useEditorContext } from "../../pages/Reports/Editor/EditorContext";

function LatexDocument() {
    const { editor } = useEditorContext();

    /*
     * L'éditeur n'est pas encore disponible.
     */
    if (!editor) {
        return (
            <div className="flex h-full items-center justify-center text-gray-400">
                Initialisation du document...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* ==================================================
                EN-TÊTE
            ================================================== */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-gray-50">
                <span className="font-semibold text-gray-800">
                    Document MACEVO
                </span>
            </header>

            {/* ==================================================
                DOCUMENT ÉDITABLE (Conteneur de scroll vertical)
            ================================================== */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                <EditorContent
                    editor={editor}
                    className="w-full flex flex-col items-center gap-6"
                />
            </div>
        </div>
    );
}

export default LatexDocument;