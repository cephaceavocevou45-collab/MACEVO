/**
 * ==========================================================
 * MACEVO
 *
 * ----------------------------------------------------------
 * Fichier : LatexSyncService.js
 * Description : Service central de synchronisation du module
 *               LaTeX
 * Version : 8.0.0
 * Statut : Stable
 * ==========================================================
 *
 * RESPONSABILITÉS
 *
 * 1. Tiptap → HTML → LaTeX
 * 2. LaTeX → HTML → Tiptap
 * 3. Gestion du document
 * 4. Compilation PDF
 * 5. Gestion des logs
 * 6. Gestion des statistiques
 * 7. Gestion du projet
 *
 * IMPORTANT
 *
 * Une seule direction est active à la fois.
 *
 * Tiptap
 *   ↓
 * HTML
 *   ↓
 * LaTeX
 *
 * LaTeX
 *   ↓
 * HTML
 *   ↓
 * Tiptap
 *
 * La synchronisation provenant du LaTeX ne doit jamais
 * repartir immédiatement vers Tiptap → LaTeX.
 * ==========================================================
 */

import latexCompiler from "./LatexCompiler";
import latexProject from "./LatexProject";
import latexConverter from "../../core/document/engines/export/latex/LatexConverter.js";
import latexClipboard from "./LatexClipboard";
import applyEditorLayoutToLatex, { prepareLatexCompilation } from "./LatexLayoutAdapter";

export class LatexSyncService {
    constructor() {
        /*
         * ==================================================
         * ÉTAT DE SYNCHRONISATION
         * ==================================================
         */
        this.syncingFromLatex = false;
        this.syncingFromEditor = false;

        /*
         * ==================================================
         * TIMER DE COMPILATION
         * ==================================================
         */
        this.compileTimer = null;
        this.compileDelay = 500;

        /*
         * ==================================================
         * IDENTIFIANT DE SYNCHRONISATION
         * ==================================================
         */
        this.syncId = 0;
    }

    /* ======================================================
       OBTENIR L'ÉDITEUR
    ====================================================== */
    getEditor(context) {
        if (!context) {
            return null;
        }

        /*
         * EditorContext peut exposer l'éditeur
         * directement sous editor.
         */
        if (context.editor) {
            return context.editor;
        }

        /*
         * Compatibilité éventuelle.
         */
        if (context.editorInstance) {
            return context.editorInstance;
        }

        return null;
    }

    /* ======================================================
       CONVERSION HTML → LATEX
    ====================================================== */
    htmlToLatex(html = "") {
        if (!html) {
            return "";
        }

        /*
         * Le convertisseur central est utilisé
         * pour conserver une seule logique de conversion.
         */
        if (
            latexConverter &&
            typeof latexConverter.htmlToLatex === "function"
        ) {
            return latexConverter.htmlToLatex(html);
        }

        /*
         * Compatibilité avec une éventuelle méthode convertHTMLToLatex.
         */
        if (
            latexConverter &&
            typeof latexConverter.convertHTMLToLatex === "function"
        ) {
            return latexConverter.convertHTMLToLatex(html);
        }

        /*
         * Si aucune méthode n'existe, on évite de fabriquer un faux LaTeX.
         */
        console.warn(
            "LatexSyncService : aucune méthode HTML → LaTeX disponible."
        );

        return "";
    }

    /* ======================================================
       CONVERSION LATEX → HTML
    ====================================================== */
    latexToHtml(latex = "") {
        if (!latex) {
            return "";
        }

        if (
            latexConverter &&
            typeof latexConverter.latexToHtml === "function"
        ) {
            return latexConverter.latexToHtml(latex);
        }

        /*
         * Compatibilité éventuelle.
         */
        if (
            latexConverter &&
            typeof latexConverter.convertLatexToHTML === "function"
        ) {
            return latexConverter.convertLatexToHTML(latex);
        }

        console.warn(
            "LatexSyncService : aucune méthode LaTeX → HTML disponible."
        );

        return "";
    }

    /* ======================================================
       METTRE À JOUR LE DOCUMENT HTML
    ====================================================== */
    setDocumentHTML(html, context) {
        if (!context) {
            return;
        }

        const normalizedHTML = html ?? "";

        /*
         * Mise à jour du contexte.
         */
        if (typeof context.setHtml === "function") {
            context.setHtml(normalizedHTML);
        }

        /*
         * Mise à jour de Tiptap.
         *
         * IMPORTANT :
         * syncingFromLatex doit être actif lorsque cette opération provient du LaTeX.
         * Cela empêche Tiptap de déclencher une nouvelle conversion HTML → LaTeX.
         */
        const editor = this.getEditor(context);

        if (
            editor &&
            editor.commands &&
            typeof editor.commands.setContent === "function"
        ) {
            editor.commands.setContent(normalizedHTML, false);
        }
    }

    /* ======================================================
       MISE À JOUR DES STATISTIQUES
    ====================================================== */
    updateStatistics(context) {
        if (!context) {
            return;
        }

        const latex = context.latex ?? "";
        const html = context.html ?? "";

        /*
         * Nombre de caractères.
         */
        const characters = latex.length;

        /*
         * Nombre de mots.
         */
        const words = latex.trim()
            ? latex.trim().split(/\s+/).length
            : 0;

        /*
         * Paragraphes approximatifs.
         */
        const paragraphs = html
            ? (
                  html.match(
                      /<(p|h1|h2|h3|h4|h5|h6|li|blockquote)[^>]*>/gi
                  ) ?? []
              ).length
            : 0;

        if (typeof context.setStatistics !== "function") {
            return;
        }

        context.setStatistics({
            ...(context.statistics ?? {}),
            characters,
            words,
            paragraphs,
        });
    }

    /* ======================================================
       SYNCHRONISATION LATEX → ÉDITEUR
    ====================================================== */
    async updateLatex(latex, context) {
        if (!context) {
            return "";
        }

        const source = latex ?? "";

        /*
         * Identifiant de synchronisation.
         */
        this.syncId += 1;
        const currentSyncId = this.syncId;

        /*
         * Indique que la source est le LaTeX.
         */
        this.syncingFromLatex = true;

        try {
            /*
             * Mettre le LaTeX dans le contexte.
             */
            if (typeof context.setLatex === "function") {
                context.setLatex(source);
            }

            /*
             * Conversion LaTeX → HTML.
             */
            const html = this.latexToHtml(source);

            /*
             * Vérification de sécurité.
             */
            if (currentSyncId !== this.syncId) {
                return source;
            }

            /*
             * Mettre à jour HTML + Tiptap.
             */
            if (html !== undefined) {
                if (typeof context.setHtml === "function") {
                    context.setHtml(html ?? "");
                }

                const editor = this.getEditor(context);

                if (
                    editor &&
                    editor.commands &&
                    typeof editor.commands.setContent === "function"
                ) {
                    editor.commands.setContent(html ?? "", false);
                }
            }

            /*
             * Document considéré comme modifié.
             */
            if (typeof context.setDirty === "function") {
                context.setDirty(true);
            }

            /*
             * Statistiques.
             */
            this.updateStatistics({
                ...context,
                latex: source,
                html: html ?? context.html ?? "",
            });

            return source;
        } finally {
            this.syncingFromLatex = false;
        }
    }

    /* ======================================================
       SYNCHRONISATION ÉDITEUR → LATEX
    ====================================================== */
    async syncFromEditor(context) {
        if (!context) {
            return "";
        }

        /*
         * Si une synchronisation LaTeX → Tiptap est en cours,
         * on ne repart surtout pas dans l'autre direction.
         */
        if (this.syncingFromLatex) {
            return context.latex ?? "";
        }

        /*
         * Éviter les doubles synchronisations.
         */
        if (this.syncingFromEditor) {
            return context.latex ?? "";
        }

        const editor = this.getEditor(context);

        if (!editor || typeof editor.getHTML !== "function") {
            return context.latex ?? "";
        }

        this.syncingFromEditor = true;

        try {
            /*
             * Récupération du HTML réel de Tiptap.
             */
            const html = editor.getHTML();

            /*
             * Mise à jour du contexte HTML.
             */
            if (typeof context.setHtml === "function") {
                context.setHtml(html ?? "");
            }

            /*
             * Conversion HTML → LaTeX.
             */
            const latex = this.htmlToLatex(html);

            /*
             * Mise à jour du LaTeX.
             */
            if (typeof context.setLatex === "function") {
                context.setLatex(latex ?? "");
            }

            /*
             * Document modifié.
             */
            if (typeof context.setDirty === "function") {
                context.setDirty(true);
            }

            /*
             * Statistiques.
             */
            this.updateStatistics({
                ...context,
                html: html ?? "",
                latex: latex ?? "",
            });

            return latex ?? "";
        } finally {
            this.syncingFromEditor = false;
        }
    }

    /* ======================================================
       MISE À JOUR DU DOCUMENT
    ====================================================== */
    async updateDocument(document, context) {
        if (!context) {
            return "";
        }

        /*
         * Le document reçu depuis Tiptap est du HTML.
         */
        const html = document ?? "";

        /*
         * Si nous sommes en train de pousser du LaTeX vers Tiptap,
         * cette mise à jour ne doit pas repartir vers le LaTeX.
         */
        if (this.syncingFromLatex) {
            return context.latex ?? "";
        }

        /*
         * Empêcher une double synchronisation.
         */
        if (this.syncingFromEditor) {
            return context.latex ?? "";
        }

        this.syncingFromEditor = true;

        try {
            /*
             * Stockage HTML.
             */
            if (typeof context.setHtml === "function") {
                context.setHtml(html);
            }

            /*
             * Conversion HTML → LaTeX.
             */
            const latex = this.htmlToLatex(html);

            /*
             * Stockage LaTeX.
             */
            if (typeof context.setLatex === "function") {
                context.setLatex(latex ?? "");
            }

            /*
             * Document modifié.
             */
            if (typeof context.setDirty === "function") {
                context.setDirty(true);
            }

            /*
             * Statistiques.
             */
            this.updateStatistics({
                ...context,
                html,
                latex: latex ?? "",
            });

            return latex ?? "";
        } finally {
            this.syncingFromEditor = false;
        }
    }

    /* ======================================================
       SYNCHRONISATION GLOBALE
    ====================================================== */
    async synchronize(context) {
        if (!context) {
            return "";
        }

        /*
         * Si un LaTeX existe déjà, il devient la source initiale.
         */
        if (
            typeof context.latex === "string" &&
            context.latex.trim()
        ) {
            return await this.updateLatex(context.latex, context);
        }

        /*
         * Sinon Tiptap devient la source.
         */
        return await this.syncFromEditor(context);
    }

    /* ======================================================
       NOUVEAU PROJET
    ====================================================== */
    newProject(context) {
        /*
         * Nettoyage du timer.
         */
        if (this.compileTimer) {
            clearTimeout(this.compileTimer);
            this.compileTimer = null;
        }

        /*
         * Création du projet.
         */
        const project =
            typeof latexProject.newProject === "function"
                ? latexProject.newProject()
                : typeof latexProject.getProject === "function"
                ? latexProject.getProject()
                : null;

        /*
         * Nettoyage du contexte.
         */
        if (typeof context?.setProject === "function") {
            context.setProject(project);
        }

        if (typeof context?.setHtml === "function") {
            context.setHtml("");
        }

        if (typeof context?.setLatex === "function") {
            context.setLatex("");
        }

        if (typeof context?.setPdf === "function") {
            context.setPdf(null);
        }

        if (typeof context?.setCompilationId === "function") {
            context.setCompilationId(null);
        }

        if (typeof context?.setLogs === "function") {
            context.setLogs([]);
        }

        if (typeof context?.setStatistics === "function") {
            context.setStatistics({
                words: 0,
                characters: 0,
                pdfSize: 0,
            });
        }

        if (typeof context?.setError === "function") {
            context.setError(null);
        }

        if (typeof context?.setDirty === "function") {
            context.setDirty(false);
        }

        /*
         * Nettoyage réel de Tiptap.
         */
        const editor = this.getEditor(context);

        if (
            editor &&
            editor.commands &&
            typeof editor.commands.clearContent === "function"
        ) {
            this.syncingFromLatex = true;
            try {
                editor.commands.clearContent(false);
            } finally {
                this.syncingFromLatex = false;
            }
        }

        return project;
    }

    /* ======================================================
       COMPILATION DIFFÉRÉE
    ====================================================== */
    scheduleCompile(context) {
        if (!context) {
            return;
        }

        if (this.compileTimer) {
            clearTimeout(this.compileTimer);
        }

        this.compileTimer = setTimeout(() => {
            this.compile(context);
        }, this.compileDelay);
    }

    /* ======================================================
       COMPILATION
    ====================================================== */
    async compile(context) {
        if (!context) {
            return null;
        }

        const latex = context.latex ?? "";

        /*
         * Protection contre un document vide.
         */
        if (!latex.trim()) {
            if (typeof context.setPdf === "function") {
                context.setPdf(null);
            }

            if (typeof context.setCompilationId === "function") {
                context.setCompilationId(null);
            }

            if (typeof context.setError === "function") {
                context.setError("Le document LaTeX est vide.");
            }

            return {
                success: false,
                latex,
                pdf: null,
                compilationId: null,
                statistics: {},
                logs: [],
            };
        }

        /*
         * État compilation.
         */
        if (typeof context.setCompiling === "function") {
            context.setCompiling(true);
        }

        if (typeof context.setError === "function") {
            context.setError(null);
        }

        try {
            /*
             * Compilation réelle.
             */
            const compilation = prepareLatexCompilation(latex, context.layout || {});
            const result = await latexCompiler.compile(compilation.latex, compilation.assets);

            /*
             * LOGS
             */
            if (typeof context.setLogs === "function") {
                context.setLogs(
                    Array.isArray(result?.logs) ? result.logs : []
                );
            }

            /*
             * STATISTIQUES
             */
            if (typeof context.setStatistics === "function") {
                context.setStatistics({
                    ...(context.statistics ?? {}),
                    ...(result?.statistics ?? {}),
                });
            }

            /*
             * ÉCHEC
             */
            if (!result?.success) {
                if (typeof context.setPdf === "function") {
                    context.setPdf(null);
                }

                if (typeof context.setCompilationId === "function") {
                    context.setCompilationId(null);
                }

                const validationErrors =
                    result?.validation?.errors ?? [];

                const message = validationErrors.length
                    ? validationErrors
                          .map(item => item?.message ?? String(item))
                          .join("\n")
                    : "La compilation LaTeX a échoué.";

                if (typeof context.setError === "function") {
                    context.setError(message);
                }

                if (typeof context.setDirty === "function") {
                    context.setDirty(true);
                }

                return result;
            }

            /*
             * COMPILATION RÉUSSIE
             */
            const compilationId = result?.compilationId ?? null;

            if (!compilationId) {
                if (typeof context.setPdf === "function") {
                    context.setPdf(null);
                }

                const message =
                    "La compilation a réussi mais aucun identifiant de compilation n'a été retourné.";

                if (typeof context.setError === "function") {
                    context.setError(message);
                }

                return {
                    ...result,
                    success: false,
                    error: message,
                };
            }

            const pdfUrl = result?.pdf ?? null;

            if (!pdfUrl) {
                if (typeof context.setPdf === "function") {
                    context.setPdf(null);
                }

                const message =
                    "La compilation a réussi mais aucune URL PDF n'a été retournée.";

                if (typeof context.setError === "function") {
                    context.setError(message);
                }

                return {
                    ...result,
                    success: false,
                    error: message,
                };
            }

            /*
             * Cache navigateur.
             */
            const previewUrl = `${pdfUrl}${
                pdfUrl.includes("?") ? "&" : "?"
            }t=${Date.now()}`;

            /*
             * PDF → CONTEXTE
             */
            if (typeof context.setPdf === "function") {
                context.setPdf(previewUrl);
            }

            if (typeof context.setCompilationId === "function") {
                context.setCompilationId(compilationId);
            }

            if (typeof context.setError === "function") {
                context.setError(null);
            }

            if (typeof context.setDirty === "function") {
                context.setDirty(false);
            }

            return {
                ...result,
                pdf: previewUrl,
                compilationId,
            };
        } catch (error) {
            console.error(
                "Erreur LatexSyncService.compile :",
                error
            );

            if (typeof context.setPdf === "function") {
                context.setPdf(null);
            }

            if (typeof context.setCompilationId === "function") {
                context.setCompilationId(null);
            }

            const message =
                error?.message ??
                "Impossible de compiler le document LaTeX.";

            if (typeof context.setError === "function") {
                context.setError(message);
            }

            if (typeof context.setDirty === "function") {
                context.setDirty(true);
            }

            if (typeof context.setLogs === "function") {
                context.setLogs([
                    {
                        type: "error",
                        date: new Date(),
                        message,
                    },
                ]);
            }

            return {
                success: false,
                latex,
                pdf: null,
                compilationId: null,
                statistics: {},
                validation: {
                    success: false,
                    errors: [{ message }],
                },
                logs: [
                    {
                        type: "error",
                        date: new Date(),
                        message,
                    },
                ],
            };
        } finally {
            if (typeof context.setCompiling === "function") {
                context.setCompiling(false);
            }
        }
    }

    /* ======================================================
       COPIER LE LATEX
    ====================================================== */
    async copyLatex(context) {
        const latex = applyEditorLayoutToLatex(context?.latex ?? "", context?.layout || {});

        if (!latex.trim()) {
            this.addInfo("Aucun code LaTeX à copier.", context);
            return false;
        }

        try {
            await latexClipboard.copy(latex);
            this.addInfo("Code LaTeX copié.", context);
            return true;
        } catch (error) {
            console.error("Erreur copie LaTeX :", error);
            this.addInfo(
                "Impossible de copier le code LaTeX.",
                context
            );
            return false;
        }
    }

    /* ======================================================
       AJOUT D'INFORMATION LOGS / NOTIFICATION
    ====================================================== */
    addInfo(message, context) {
        if (typeof context?.addLog === "function") {
            context.addLog({
                type: "info",
                date: new Date(),
                message,
            });
        }
    }

    /* ======================================================
       TÉLÉCHARGER TEX
    ====================================================== */
    downloadTex(context) {
        const latex = applyEditorLayoutToLatex(context?.latex ?? "", context?.layout || {});

        if (!latex) {
            return;
        }

        const blob = new Blob([latex], {
            type: "text/plain;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "macevo-document.tex";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

    /* ======================================================
       TÉLÉCHARGER PDF
    ====================================================== */
    downloadPdf(context) {
        const pdf = context?.pdf;

        if (!pdf) {
            return;
        }

        const link = document.createElement("a");
        link.href = pdf;
        link.download = "macevo-document.pdf";
        link.target = "_blank";

        document.body.appendChild(link);
        link.click();
        link.remove();
    }
}

const latexSyncService = new LatexSyncService();
export default latexSyncService;
