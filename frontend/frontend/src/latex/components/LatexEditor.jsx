/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexEditor.jsx
 * Description : Éditeur du code LaTeX
 * Version : 6.0.0
 * ==========================================================
 */

import useLatex from "../hooks/useLatex";


import { useEditorContext } from "../../pages/Reports/Editor/EditorContext";
import latexWorkspaceController from "../controllers/LatexWorkspaceController";


function LatexEditor() {

    const context = useLatex();

    const {editor} = useEditorContext();


    const {

        latex,
        dirty,
        compiling,

    } = context;


    /* ======================================================
       MODIFICATION DU CODE LATEX
    ====================================================== */

    function handleChange(event) {

        latexWorkspaceController.updateLatex(

            event.target.value,

            {
                ...context,

                editor,

            }

        );

    }


    return (

        <div
            className="
                flex
                flex-col

                h-full

                bg-white
            "
        >

            {/* ======================================================
                EN-TÊTE
            ====================================================== */}

            <header
                className="
                    flex
                    items-center
                    justify-between

                    px-4
                    py-3

                    border-b
                    border-gray-300

                    bg-gray-50
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-3
                    "
                >

                    <span className="font-semibold">

                        Code LaTeX

                    </span>


                    {

                        dirty && (

                            <span
                                className="
                                    text-xs

                                    px-2
                                    py-1

                                    rounded

                                    bg-orange-100
                                    text-orange-700
                                "
                            >

                                Modifié

                            </span>

                        )

                    }


                    {

                        compiling && (

                            <span
                                className="
                                    text-xs

                                    px-2
                                    py-1

                                    rounded

                                    bg-blue-100
                                    text-blue-700
                                "
                            >

                                Compilation...

                            </span>

                        )

                    }

                </div>


                <span
                    className="
                        text-xs

                        uppercase

                        tracking-wider

                        text-gray-500
                    "
                >

                    TEX

                </span>

            </header>


            {/* ======================================================
                ZONE D'ÉDITION
            ====================================================== */}

            <textarea

                className="macevo-latex-code flex-1 resize-none outline-none p-6 font-mono text-sm leading-7 bg-[#1E1E1E] text-green-400"

                value={latex ?? ""}

                onChange={handleChange}

                spellCheck={false}

                placeholder="% Le code LaTeX généré apparaîtra ici..."

            />

        </div>

    );

}


export default LatexEditor;
