/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexLogView.jsx
 * Description : Console LaTeX
 * Version : 1.0.0
 * Statut : Développement
 * ==========================================================
 */

import { Terminal } from "lucide-react";

import useLatex from "../hooks/useLatex";

function LatexLogView() {

    const {

    logs,

} = useLatex();

    return (

        <div
            className="
                flex
                flex-col

                h-full

                bg-[#1e1e1e]
                text-green-400
            "
        >

            <header
                className="
                    flex
                    items-center
                    gap-2

                    px-4
                    py-2

                    border-b

                    border-gray-700
                "
            >

                <Terminal size={16} />

                <span>

                    Console LaTeX

                </span>

            </header>

            <div
                className="
                    flex-1

                    overflow-auto

                    p-4

                    font-mono
                    text-sm
                "
            >

                <div>

                    ✓ Workspace LaTeX initialisé.

                </div>

                <div>

                    ✓ En attente de compilation...

                </div>

            </div>

        </div>

    );

}

export default LatexLogView;