/**
 * ============================================================
 * MACEVO
 *
 * ---
 * Fichier : LatexContext.jsx
 * Description : Contexte central du module LaTeX
 * Version : 2.0.0
 * Statut : Stable
 * ============================================================
 */

import {
    createContext,
    useCallback,
    useState,
} from "react";

import latexCompiler from "../../latex/services/LatexCompiler";
import latexApi from "../compiler/LatexApi";

/* ==========================================================
   CONTEXTE
========================================================== */

const LatexContext = createContext(null);

/* ==========================================================
   PROVIDER
========================================================== */

export function LatexProvider({

    children,

}) {

    /* ======================================================
       DOCUMENT HTML
    ====================================================== */

    const [
        html,
        setHtml,
    ] = useState("");


    /* ======================================================
       CODE LATEX
    ====================================================== */

    const [
        latex,
        setLatex,
    ] = useState("");


    /* ======================================================
       PDF
    ====================================================== */

    const [
        pdf,
        setPdf,
    ] = useState(null);


    /* ======================================================
       COMPILATION
    ====================================================== */

    const [
        compiling,
        setCompiling,
    ] = useState(false);


    /* ======================================================
       LOGS
    ====================================================== */

    const [
        logs,
        setLogs,
    ] = useState([]);


    /* ======================================================
       STATISTIQUES
    ====================================================== */

    const [
        statistics,
        setStatistics,
    ] = useState({

        words: 0,

        characters: 0,

        pdfSize: 0,

    });


    /* ======================================================
       COMPILATION ID
    ====================================================== */

    const [
        compilationId,
        setCompilationId,
    ] = useState(null);


    /* ======================================================
       ERREUR
    ====================================================== */

    const [
        error,
        setError,
    ] = useState(null);


    /* ======================================================
       PROJET
    ====================================================== */

    const [
        project,
        setProject,
    ] = useState(null);


    /* ======================================================
       MODIFICATION
    ====================================================== */

    const [
        dirty,
        setDirty,
    ] = useState(false);


    /* ======================================================
   COMPILATION LATEX
====================================================== */

const compile = useCallback(

    async (source = latex) => {

        /*
         * Protection contre une compilation vide.
         */

        if (!source || !source.trim()) {

            setPdf(null);

            setCompilationId(null);

            setError(
                "Le document LaTeX est vide."
            );

            setLogs([]);

            return {

                success: false,

                latex: source,

                pdf: null,

                compilationId: null,

                statistics: {},

                logs: [],

            };

        }


        /*
         * Etat de compilation.
         */

        setCompiling(true);

        setError(null);


        try {

            /*
             * Appel du moteur LaTeX frontend.
             *
             * LatexCompiler
             *      ↓
             * LatexCompileEngine
             *      ↓
             * LatexApi
             *      ↓
             * Backend FastAPI
             */

            const result =
                await latexCompiler.compile(
                    source
                );


            /*
             * Toujours conserver le LaTeX
             * envoyé au compilateur.
             */

            setLatex(source);


            /*
             * Logs.
             *
             * LatexLogParser retourne un tableau.
             */

            const parsedLogs =
                Array.isArray(result?.logs)
                    ? result.logs
                    : [];

            setLogs(parsedLogs);


            /*
             * Statistiques.
             */

            setStatistics({

                words:
                    result?.statistics?.words ?? 0,

                characters:
                    result?.statistics?.characters ?? 0,

                pdfSize:
                    result?.statistics?.pdfSize ?? 0,

            });


            /*
             * Identifiant de compilation.
             */

            const currentCompilationId =
                result?.compilationId ?? null;


            setCompilationId(
                currentCompilationId
            );


            /*
             * ==================================================
             * COMPILATION ÉCHOUÉE
             * ==================================================
             */

            if (!result?.success) {

                setPdf(null);

                const validationErrors =
                    result
                        ?.validation
                        ?.errors ?? [];


                const message =
                    validationErrors.length > 0

                        ? validationErrors
                            .map(

                                item =>
                                    item?.message
                                    ??
                                    String(item)

                            )
                            .join("\n")

                        : "La compilation LaTeX a échoué.";


                setError(message);

                setDirty(true);


                return result;

            }


            /*
             * ==================================================
             * COMPILATION RÉUSSIE
             * ==================================================
             */

            if (!currentCompilationId) {

                setPdf(null);

                const message =
                    "La compilation a réussi mais aucun identifiant de compilation n'a été retourné.";


                setError(message);

                return {

                    ...result,

                    success: false,

                    error: message,

                };

            }


            /*
             * Le backend conserve le PDF dans :
             *
             * app/storage/latex/
             *     <compilationId>/
             *         document.pdf
             *
             * Le navigateur ne doit jamais recevoir
             * le chemin physique Windows.
             *
             * On construit donc l'URL HTTP via LatexApi.
             */

            const pdfUrl =
                await latexApi.getPdfUrl(
                    currentCompilationId
                );


            /*
             * Vérification de sécurité.
             */

            if (!pdfUrl) {

                const message =
                    "La compilation a réussi mais l'URL du PDF n'a pas pu être obtenue.";


                setPdf(null);

                setError(message);

                return {

                    ...result,

                    success: false,

                    error: message,

                };

            }


            /*
             * URL finale du PDF.
             *
             * Le timestamp évite qu'un navigateur conserve
             * une ancienne réponse PDF en cache.
             */

            const previewUrl =
                `${pdfUrl}${pdfUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;


            /*
             * Le PDF est maintenant disponible
             * pour LatexPreview.
             */

            setPdf(previewUrl);


            /*
             * Le document vient d'être compilé.
             */

            setDirty(false);

            setError(null);


            /*
             * Retourner le résultat complet.
             */

            return {

                ...result,

                pdf: previewUrl,

            };

        }

        catch (err) {

            const message =
                err?.message
                ??
                "Impossible de compiler le document LaTeX.";


            /*
             * Nettoyage de l'état PDF.
             */

            setPdf(null);

            setCompilationId(null);

            setDirty(true);

            setError(message);


            /*
             * Journalisation de l'erreur
             * dans la console du navigateur.
             */

            console.error(
                "Erreur compilation LaTeX :",
                err
            );


            return {

                success: false,

                latex: source,

                pdf: null,

                statistics: {},

                compilationId: null,

                validation: {

                    success: false,

                    errors: [

                        {
                            message,
                        },

                    ],

                },

                logs: [

                    {

                        type: "error",

                        date: new Date(),

                        message,

                    },

                ],

            };

        }

        finally {

            setCompiling(false);

        }

    },

    [latex]

);
    /* ======================================================
       EFFACER LE PDF
    ====================================================== */

    const clearPdf = useCallback(

        () => {

            setPdf(null);

            setCompilationId(null);

            setError(null);

        },

        []

    );


    /* ======================================================
       EFFACER LES ERREURS
    ====================================================== */

    const clearError = useCallback(

        () => {

            setError(null);

        },

        []

    );


    /* ======================================================
       VALEUR DU CONTEXTE
    ====================================================== */

    const value = {

        /*
         * Document HTML
         */

        html,
        setHtml,


        /*
         * LaTeX
         */

        latex,
        setLatex,


        /*
         * PDF
         */

        pdf,
        setPdf,


        /*
         * Compilation
         */

        compiling,
        setCompiling,


        /*
         * Action principale
         */

        compile,


        /*
         * Logs
         */

        logs,
        setLogs,


        /*
         * Statistiques
         */

        statistics,
        setStatistics,


        /*
         * Compilation ID
         */

        compilationId,
        setCompilationId,


        /*
         * Erreurs
         */

        error,
        setError,

        clearError,


        /*
         * Projet
         */

        project,
        setProject,


        /*
         * Modification
         */

        dirty,
        setDirty,


        /*
         * PDF
         */

        clearPdf,

    };


    /* ======================================================
       RENDU
    ====================================================== */

    return (

        <LatexContext.Provider value={value}>

            {children}

        </LatexContext.Provider>

    );

}


/* ==========================================================
   EXPORT
========================================================== */

export default LatexContext;