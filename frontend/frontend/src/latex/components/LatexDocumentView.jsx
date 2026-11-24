/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexDocumentView.jsx
 * Description : Vue Document du Workspace LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import { FileText } from "lucide-react";

import {useEditorContext} from "../../pages/Reports/Editor/EditorContext";

function LatexDocumentView() {

    const editor = useEditorContext();

    if (!editor) {

        return (

            <div
                className="
                    flex
                    items-center
                    justify-center
                    h-full
                    text-gray-500
                "
            >

                Aucun document ouvert.

            </div>

        );

    }

    return (

        <div
            className="
                flex
                flex-col
                h-full
            "
        >

            {/* ======================================================
                EN-TÊTE
            ====================================================== */}

            <header
                className="
                    flex
                    items-center
                    gap-2

                    px-4
                    py-3

                    border-b
                    border-gray-200

                    bg-gray-50
                "
            >

                <FileText size={18} />

                <span className="font-medium">

                    Document MACEVO

                </span>

            </header>

            {/* ======================================================
                CONTENU
            ====================================================== */}

            <div
                className="
                    flex-1
                    overflow-auto
                    bg-white
                    p-6
                "
            >

                <div

                    dangerouslySetInnerHTML={{

                        __html: editor.getHTML()

                    }}

                />

            </div>

        </div>

    );

}

export default LatexDocumentView;