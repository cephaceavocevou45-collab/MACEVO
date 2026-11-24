/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : EditorPage.jsx
 * Description : Feuille de document MACEVO avec préparation
 *               à la pagination automatique.
 * Version : 3.0.0
 * Statut : Stable
 * ============================================================
 */

import {
    memo,
    useEffect,
    useRef,
    useState,
} from "react";

import { EditorContent } from "@tiptap/react";


/* ============================================================
   CONSTANTES
============================================================ */

/*
 * Hauteur approximative d'une page A4 en pixels
 * correspondant à notre pageLayout.js.
 */

const DEFAULT_PAGE_HEIGHT = 1123;


/*
 * Marge de sécurité permettant d'éviter qu'un bloc
 * arrive exactement au bord inférieur de la page.
 */

const PAGE_SAFETY_SPACE = 40;


/* ============================================================
   COMPOSANT
============================================================ */

function EditorPage({

    editor,

    page,

    zoom = 100,

    pageNumber = 1,

    onPageCountChange,

}) {

    /* ========================================================
       RÉFÉRENCES
    ======================================================== */

    const pageRef =
        useRef(null);


    const contentRef =
        useRef(null);


    /* ========================================================
       ÉTAT
    ======================================================== */

    const [
        pageCount,
        setPageCount,
    ] = useState(1);


    /* ========================================================
       CALCUL DE LA HAUTEUR
    ======================================================== */

    function getPageHeight() {

        if (!pageRef.current) {

            return DEFAULT_PAGE_HEIGHT;

        }


        const height =
            pageRef.current.clientHeight;


        if (
            !height ||
            height <= 0
        ) {

            return DEFAULT_PAGE_HEIGHT;

        }


        return height;

    }


    /* ========================================================
       CALCUL DU NOMBRE DE PAGES
    ======================================================== */

    function calculatePages() {

        if (!contentRef.current) {

            return;

        }


        const contentHeight =
            contentRef.current.scrollHeight;


        const pageHeight =
            getPageHeight();


        const usableHeight =
            Math.max(

                1,

                pageHeight -
                PAGE_SAFETY_SPACE

            );


        const calculatedPages =
            Math.max(

                1,

                Math.ceil(
                    contentHeight /
                    usableHeight
                )

            );


        setPageCount(
            calculatedPages
        );


        if (onPageCountChange) {

            onPageCountChange(
                calculatedPages
            );

        }

    }


    /* ========================================================
       OBSERVATION DU CONTENU
    ======================================================== */

    useEffect(() => {

        if (!editor) {

            return undefined;

        }


        let resizeObserver;


        function update() {

            /*
             * On attend le prochain cycle du navigateur
             * afin que Tiptap ait terminé son rendu.
             */

            requestAnimationFrame(
                calculatePages
            );

        }


        update();


        editor.on(
            "update",
            update
        );


        editor.on(
            "transaction",
            update
        );


        if (
            typeof ResizeObserver !==
            "undefined" &&
            contentRef.current
        ) {

            resizeObserver =
                new ResizeObserver(
                    update
                );


            resizeObserver.observe(
                contentRef.current
            );

        }


        window.addEventListener(
            "resize",
            update
        );


        return () => {

            editor.off(
                "update",
                update
            );


            editor.off(
                "transaction",
                update
            );


            window.removeEventListener(
                "resize",
                update
            );


            if (resizeObserver) {

                resizeObserver.disconnect();

            }

        };

    }, [editor]);


    /* ========================================================
       RECALCUL LORSQUE LE ZOOM CHANGE
    ======================================================== */

    useEffect(() => {

        requestAnimationFrame(
            calculatePages
        );

    }, [zoom]);


    /* ========================================================
       RECALCUL LORSQUE LE LAYOUT CHANGE
    ======================================================== */

    useEffect(() => {

        requestAnimationFrame(
            calculatePages
        );

    }, [

        page.width,
        page.height,
        page.margins,
        page.columns,

    ]);


    /* ========================================================
       ÉDITEUR ABSENT
    ======================================================== */

    if (!editor) {

        return null;

    }


    /* ========================================================
       ZOOM
    ======================================================== */

    const zoomFactor =
        zoom / 100;


    /* ========================================================
       HAUTEUR DE LA PAGE
    ======================================================== */

    const pageHeight =
        page.height ||
        "min-h-[1123px]";


    /* ========================================================
       PAGE PRINCIPALE
    ======================================================== */

    return (

        <div
            className="
                relative
                shrink-0
            "

            style={{

                zoom: zoomFactor,

            }}
        >

            {/* ==================================================
                OMBRE
            ================================================== */}

            <div
                className="
                    pointer-events-none

                    absolute

                    -inset-4

                    rounded-sm

                    bg-slate-900/5

                    blur-2xl
                "
            />


            {/* ==================================================
                CONTENEUR PAGE
            ================================================== */}

            <div
                className="
                    relative
                    z-10
                "
            >

                {/* ==================================================
                    PAGE PRINCIPALE
                ================================================== */}

                <div
                    ref={pageRef}

                    id={
                        `macevo-page-${pageNumber}`
                    }

                    data-page-number={
                        pageNumber
                    }

                    className={`
                        relative

                        box-border

                        shrink-0

                        ${page.width}

                        ${pageHeight}

                        ${page.margins}

                        ${page.columns}

                        ${page.background}

                        ${page.borders}

                        ${page.watermark}

                        ${page.lineNumbers}

                        bg-white

                        overflow-hidden

                        shadow-[0_4px_12px_rgba(15,23,42,0.08),0_18px_40px_rgba(15,23,42,0.12)]
                    `}
                >

                    {/* ==========================================
                        CONTENU Tiptap
                    ========================================== */}

                    <div
                        ref={contentRef}

                        className="
                            relative

                            h-full

                            min-h-0

                            w-full
                        "
                    >

                        <EditorContent
                            editor={editor}
                        />

                    </div>


                    {/* ==========================================
                        NUMÉRO DE PAGE
                    ========================================== */}

                    <div
                        className="
                            pointer-events-none

                            absolute

                            bottom-3
                            left-0
                            right-0

                            z-20

                            text-center

                            text-[10px]

                            text-slate-300
                        "
                    >

                        {pageNumber}

                    </div>

                </div>


                {/* ==================================================
                    PAGES SUPPLÉMENTAIRES
                ================================================== */}

                {Array.from({

                    length:
                        Math.max(
                            0,
                            pageCount - 1
                        ),

                }).map((_, index) => {

                    const nextPage =
                        pageNumber +
                        index +
                        1;


                    return (

                        <div
                            key={nextPage}

                            className="
                                relative

                                mt-8

                                shrink-0
                            "
                        >

                            {/* ======================================
                                OMBRE
                            ====================================== */}

                            <div
                                className="
                                    pointer-events-none

                                    absolute

                                    -inset-4

                                    rounded-sm

                                    bg-slate-900/5

                                    blur-2xl
                                "
                            />


                            {/* ======================================
                                PAGE VIDE
                            ====================================== */}

                            <div
                                className={`
                                    relative
                                    z-10

                                    box-border

                                    shrink-0

                                    ${page.width}

                                    ${pageHeight}

                                    ${page.margins}

                                    ${page.columns}

                                    ${page.background}

                                    ${page.borders}

                                    ${page.watermark}

                                    ${page.lineNumbers}

                                    bg-white

                                    shadow-[0_4px_12px_rgba(15,23,42,0.08),0_18px_40px_rgba(15,23,42,0.12)]
                                `}
                            >

                                {/* ==================================
                                    INDICATEUR DE PAGE
                                ================================== */}

                                <div
                                    className="
                                        pointer-events-none

                                        absolute

                                        bottom-3
                                        left-0
                                        right-0

                                        text-center

                                        text-[10px]

                                        text-slate-300
                                    "
                                >

                                    {nextPage}

                                </div>

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>

    );

}


/* ============================================================
   EXPORT
============================================================ */

export default memo(EditorPage);