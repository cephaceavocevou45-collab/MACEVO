/**
 * ==========================================================
 * MACEVO
 *
 * ----------------------------------------------------------
 * Fichier : LatexPreview.jsx
 * Description : Aperçu PDF du document compilé
 * Version : 5.0.0
 * Statut : Stable
 * ==========================================================
 */

import { useEffect, useState } from "react";

import useLatex from "../hooks/useLatex";


function LatexPreview() {

    const {

        pdf,
        compiling,
        error,
        compilationId,

    } = useLatex();


    /*
     * ======================================================
     * ETAT DE CHARGEMENT DU PDF
     * ======================================================
     */

    const [
        pdfLoading,
        setPdfLoading,
    ] = useState(false);


    /*
     * ======================================================
     * ETAT D'ERREUR DU PDF
     * ======================================================
     */

    const [
        pdfError,
        setPdfError,
    ] = useState(null);


    /*
     * ======================================================
     * SURVEILLANCE DU PDF
     * ======================================================
     *
     * Chaque fois que le contexte fournit une nouvelle URL,
     * on réinitialise l'état de l'aperçu.
     */

    useEffect(() => {

        if (!pdf) {

            setPdfLoading(false);

            setPdfError(null);

            return;

        }


        setPdfLoading(true);

        setPdfError(null);


    }, [pdf]);


    /*
     * ======================================================
     * PDF CHARGÉ
     * ======================================================
     */

    function handlePdfLoad() {

        setPdfLoading(false);

        setPdfError(null);

    }


    /*
     * ======================================================
     * ERREUR DE CHARGEMENT PDF
     * ======================================================
     */

    function handlePdfError() {

        setPdfLoading(false);

        setPdfError(
            "Impossible de charger le PDF."
        );

        console.error(
            "Erreur de chargement du PDF :",
            pdf
        );

    }


    /*
     * ======================================================
     * OUVRIR LE PDF
     * ======================================================
     */

    function handleOpenPdf() {

        if (!pdf) {

            return;

        }


        window.open(

            pdf,

            "_blank",

            "noopener,noreferrer"

        );

    }


    /*
     * ======================================================
     * RENDU
     * ======================================================
 */

    return (

        <div
            className="
                flex
                flex-col
                h-full
                w-full
                bg-gray-200
            "
        >

            {/* ==================================================
                EN-TÊTE
            ================================================== */}

            <header
                className="
                    flex
                    items-center
                    justify-between
                    flex-shrink-0

                    px-4
                    py-3

                    border-b
                    border-gray-300

                    bg-white
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-3
                    "
                >

                    <span
                        className="
                            font-semibold
                            text-gray-800
                        "
                    >

                        Aperçu PDF

                    </span>


                    {
                        compilationId && (

                            <span
                                className="
                                    text-xs
                                    text-gray-500
                                "
                            >

                                Compilation terminée

                            </span>

                        )
                    }

                </div>


                {/* ==================================================
                    BOUTON OUVRIR
                ================================================== */}

                {
                    pdf && !compiling && (

                        <button
                            type="button"

                            onClick={
                                handleOpenPdf
                            }

                            className="
                                px-3
                                py-1.5

                                text-sm
                                font-medium

                                text-white
                                bg-blue-600

                                rounded

                                hover:bg-blue-700

                                transition

                                cursor-pointer
                            "
                        >

                            Ouvrir le PDF

                        </button>

                    )
                }

            </header>


            {/* ==================================================
                CONTENU
            ================================================== */}

            <div
                className="
                    relative

                    flex-1
                    min-h-0

                    overflow-hidden

                    bg-gray-200
                "
            >

                {/* ==================================================
                    COMPILATION EN COURS
                ================================================== */}

                {
                    compiling && (

                        <div
                            className="
                                absolute
                                inset-0
                                z-20

                                flex
                                flex-col
                                items-center
                                justify-center

                                bg-gray-200
                            "
                        >

                            <div
                                className="
                                    w-10
                                    h-10

                                    border-4
                                    border-gray-300
                                    border-t-blue-600

                                    rounded-full

                                    animate-spin
                                "
                            />

                            <p
                                className="
                                    mt-4

                                    text-gray-600
                                    text-sm
                                "
                            >

                                Compilation LaTeX en cours...

                            </p>

                        </div>

                    )
                }


                {/* ==================================================
                    ERREUR DE COMPILATION
                ================================================== */}

                {
                    !compiling &&
                    error &&
                    !pdf && (

                        <div
                            className="
                                absolute
                                inset-0

                                flex
                                flex-col
                                items-center
                                justify-center

                                p-8

                                text-center
                            "
                        >

                            <div
                                className="
                                    text-5xl
                                    mb-4
                                "
                            >

                                ⚠️

                            </div>


                            <p
                                className="
                                    font-semibold
                                    text-red-600
                                "
                            >

                                Erreur de compilation

                            </p>


                            <p
                                className="
                                    max-w-lg
                                    mt-2

                                    text-sm
                                    text-gray-600

                                    whitespace-pre-wrap
                                "
                            >

                                {error}

                            </p>

                        </div>

                    )
                }


                {/* ==================================================
                    ERREUR DE CHARGEMENT DU PDF
                ================================================== */}

                {
                    !compiling &&
                    pdf &&
                    pdfError && (

                        <div
                            className="
                                absolute
                                inset-0
                                z-10

                                flex
                                flex-col
                                items-center
                                justify-center

                                p-8

                                text-center

                                bg-gray-200
                            "
                        >

                            <div
                                className="
                                    text-5xl
                                    mb-4
                                "
                            >

                                ⚠️

                            </div>


                            <p
                                className="
                                    font-semibold
                                    text-red-600
                                "
                            >

                                Aperçu PDF indisponible

                            </p>


                            <p
                                className="
                                    mt-2
                                    text-sm
                                    text-gray-600
                                "
                            >

                                {pdfError}

                            </p>


                            <button
                                type="button"

                                onClick={
                                    handleOpenPdf
                                }

                                className="
                                    mt-4

                                    px-4
                                    py-2

                                    text-sm
                                    font-medium

                                    text-white
                                    bg-blue-600

                                    rounded

                                    hover:bg-blue-700

                                    cursor-pointer
                                "
                            >

                                Ouvrir le PDF dans un nouvel onglet

                            </button>

                        </div>

                    )
                }


                {/* ==================================================
                    CHARGEMENT DU PDF
                ================================================== */}

                {
                    !compiling &&
                    pdf &&
                    pdfLoading &&
                    !pdfError && (

                        <div
                            className="
                                absolute
                                inset-0
                                z-10

                                flex
                                items-center
                                justify-center

                                bg-gray-200
                            "
                        >

                            <div
                                className="
                                    flex
                                    flex-col
                                    items-center
                                "
                            >

                                <div
                                    className="
                                        w-8
                                        h-8

                                        border-4
                                        border-gray-300
                                        border-t-blue-600

                                        rounded-full

                                        animate-spin
                                    "
                                />

                                <p
                                    className="
                                        mt-3

                                        text-sm
                                        text-gray-500
                                    "
                                >

                                    Chargement du PDF...

                                </p>

                            </div>

                        </div>

                    )
                }


                {/* ==================================================
                    IFRAME PDF
                ================================================== */}

                {
                    !compiling &&
                    pdf &&
                    !pdfError && (

                        <iframe

                            key={pdf}

                            title="Aperçu PDF"

                            src={pdf}

                            onLoad={
                                handlePdfLoad
                            }

                            onError={
                                handlePdfError
                            }

                            className="
                                block

                                w-full
                                h-full

                                border-0

                                bg-white
                            "

                        />

                    )
                }


                {/* ==================================================
                    AUCUN PDF
                ================================================== */}

                {
                    !compiling &&
                    !pdf &&
                    !error && (

                        <div
                            className="
                                absolute
                                inset-0

                                flex
                                flex-col
                                items-center
                                justify-center

                                p-8

                                text-center
                                text-gray-500
                            "
                        >

                            <div
                                className="
                                    text-6xl
                                    mb-4
                                "
                            >

                                📄

                            </div>


                            <p
                                className="
                                    font-medium
                                    text-gray-600
                                "
                            >

                                Aucune compilation disponible

                            </p>


                            <p
                                className="
                                    text-sm
                                    mt-2
                                "
                            >

                                Cliquez sur{" "}

                                <strong>

                                    Compiler

                                </strong>

                                {" "}pour générer un aperçu PDF.

                            </p>

                        </div>

                    )
                }

            </div>

        </div>

    );

}


export default LatexPreview;