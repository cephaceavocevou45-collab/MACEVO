/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexToolbar.jsx
 * Description : Barre d'outils du Workspace LaTeX
 * Version : 4.0.0
 * ==========================================================
 */

import {

    Play,
    Copy,
    FileCode2,
    FileOutput,
    Package,
    Settings,

} from "lucide-react";

function LatexToolbar({

    onCompile,
    onCopy,
    onDownloadTex,
    onDownloadPdf,
    onPackages,
    onSettings,
    compiling,

}) {

    return (

        <header
            className="
                macevo-latex-toolbar
                flex
                items-center
                gap-2
                overflow-x-auto

                h-14

                px-4

                border-b
                border-gray-300

                bg-white

                shrink-0
            "
        >

            {/* ======================================================
                COMPILER
            ====================================================== */}

            <button

                onClick={onCompile}

                disabled={compiling}

                className="
                    flex
                    items-center
                    gap-2

                    px-4
                    py-2

                    rounded-md

                    bg-green-600
                    text-white

                    disabled:opacity-50

                    hover:bg-green-700
                "

            >

                <Play size={18} />

                <span>

                    {

                        compiling

                            ? "Compilation..."

                            : "Compiler"

                    }

                </span>

            </button>

            {/* ======================================================
                COPIER LE CODE LATEX
            ====================================================== */}

            <button

                onClick={onCopy}

                className="
                    flex
                    items-center
                    gap-2

                    px-3
                    py-2

                    rounded-md

                    hover:bg-gray-100
                "

            >

                <Copy size={18} />

                <span>

                    Copier le code LaTeX

                </span>

            </button>


            {/* ======================================================
                TELECHARGER TEX
            ====================================================== */}

            <button

                onClick={onDownloadTex}

                className="
                    flex
                    items-center
                    gap-2

                    px-3
                    py-2

                    rounded-md

                    hover:bg-gray-100
                "

            >

                <FileCode2 size={18} />

                <span>

                    Télécharger TEX

                </span>

            </button>


            {/* ======================================================
                TELECHARGER PDF
            ====================================================== */}

            <button

                onClick={onDownloadPdf}

                className="
                    flex
                    items-center
                    gap-2

                    px-3
                    py-2

                    rounded-md

                    hover:bg-gray-100
                "

            >

                <FileOutput size={18} />

                <span>

                    Télécharger PDF

                </span>

            </button>


            <div className="flex-1" />


            {/* ======================================================
                PACKAGES
            ====================================================== */}

            <button

                onClick={onPackages}

                className="
                    flex
                    items-center
                    gap-2

                    px-3
                    py-2

                    rounded-md

                    hover:bg-gray-100
                "

            >

                <Package size={18} />

                <span>

                    Packages

                </span>

            </button>


            {/* ======================================================
                PARAMETRES
            ====================================================== */}

            <button

                onClick={onSettings}

                className="
                    flex
                    items-center
                    gap-2

                    px-3
                    py-2

                    rounded-md

                    hover:bg-gray-100
                "

            >

                <Settings size={18} />

                <span>

                    Paramètres

                </span>

            </button>

        </header>

    );

}

export default LatexToolbar;
