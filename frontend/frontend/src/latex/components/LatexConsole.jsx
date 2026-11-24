/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexConsole.jsx
 * Description : Console du Workspace LaTeX
 * Version : 3.0.0
 * ==========================================================
 */

import {

    Terminal,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Info,

} from "lucide-react";

import useLatex from "../hooks/useLatex";

function LatexConsole() {

    const {

        logs,
        setLogs,

    } = useLatex();

    /* ======================================================
       EFFACER LA CONSOLE
    ====================================================== */

    function clearConsole() {

        setLogs([]);

    }

    /* ======================================================
       ICÔNE
    ====================================================== */

    function getIcon(type) {

        switch (type) {

            case "success":

                return (

                    <CheckCircle2
                        size={16}
                        className="text-green-500"
                    />

                );

            case "warning":

                return (

                    <AlertTriangle
                        size={16}
                        className="text-yellow-400"
                    />

                );

            case "error":

                return (

                    <XCircle
                        size={16}
                        className="text-red-500"
                    />

                );

            default:

                return (

                    <Info
                        size={16}
                        className="text-blue-400"
                    />

                );

        }

    }

    return (

        <div
            className="
                flex
                flex-col

                h-full

                bg-[#1E1E1E]

                text-white
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
                    py-2

                    border-b
                    border-gray-700

                    bg-[#252526]
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-2
                    "
                >

                    <Terminal size={18} />

                    <span className="font-medium">

                        Console LaTeX

                    </span>

                </div>

                <button

                    onClick={clearConsole}

                    className="
                        p-1

                        rounded

                        hover:bg-gray-700
                    "

                    title="Effacer la console"

                >

                    <Trash2 size={16} />

                </button>

            </header>

            {/* ======================================================
                CONTENU
            ====================================================== */}

            <div
                className="
                    flex-1

                    overflow-auto

                    p-4

                    font-mono

                    text-sm

                    space-y-2
                "
            >

                {

                    logs.length === 0 && (

                        <div className="text-gray-500">

                            En attente de compilation...

                        </div>

                    )

                }

                {

                    logs.map((log, index) => (

                        <div
                            key={index}
                            className="
                                flex
                                items-start
                                gap-3
                            "
                        >

                            {getIcon(log.type)}

                            <div className="flex-1">

                                <div>

                                    {log.message}

                                </div>

                                {

                                    log.date && (

                                        <div
                                            className="
                                                text-xs
                                                text-gray-500
                                            "
                                        >

                                            {

                                                new Date(log.date)

                                                .toLocaleTimeString()

                                            }

                                        </div>

                                    )

                                }

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default LatexConsole;