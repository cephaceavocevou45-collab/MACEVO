/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexCodeView.jsx
 * Description : Vue du code LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import { useEffect } from "react";
import { FileCode2 } from "lucide-react";

import useLatex from "../hooks/useLatex";
import { useEditorContext } from "../../pages/Reports/Editor/EditorContext";
import latexEngine from "../../core/document/engines/export/latex/LatexEngine";

function LatexCodeView() {

    const editor = useEditorContext();

    const {

        latex,
        setLatex,

    } = useLatex();

    useEffect(() => {

        if (!editor) {

            return;

        }

        generateLatex();

        editor.on("update", generateLatex);

        return () => {

            editor.off("update", generateLatex);

        };

    }, [editor]);

    async function generateLatex() {

        if (!editor) {

            return;

        }

        try {

            const html = editor.getHTML();

            const result = await latexEngine.export(html);

            setLatex(result.content ?? "");

        } catch (error) {

            console.error("Erreur génération LaTeX :", error);

            setLatex("");

        }

    }

    return (

        <div
            className="
                flex
                flex-col
                h-full
            "
        >

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

                <FileCode2 size={18} />

                <span className="font-medium">

                    Code LaTeX

                </span>

            </header>

            <textarea

                value={latex}

                readOnly

                spellCheck={false}

                className="
                    flex-1
                    p-6
                    resize-none
                    outline-none
                    font-mono
                    text-sm
                    bg-[#1e1e1e]
                    text-green-400
                "

            />

        </div>

    );

}

export default LatexCodeView;