/**
 * ==========================================================
 * MACEVO
 *
 * ---
 * Fichier : HtmlLatexExporter.js
 * Description : Export HTML -> LaTeX
 * Version : 8.2.0
 * Statut : Stable
 * ==========================================================
 */

import ExporterRegistry from "../../registry/ExporterRegistry";

import latexEscaper from "../utils/LatexEscaper";

import BlockExporter from "./BlockExporter";
import InlineExporter from "./InlineExporter";
import StyleExporter from "./StyleExporter";
import TableExporter from "./TableExporter";
import ImageExporter from "./ImageExporter";


class HtmlLatexExporter {


    constructor() {

        /* ==================================================
           OUTILS
        ================================================== */

        this.escaper =
            latexEscaper;


        /* ==================================================
           REGISTRE
        ================================================== */

        this.registry =
            new ExporterRegistry();


        /* ==================================================
           EXPORTERS
        ================================================== */

        this.blockExporter =
            new BlockExporter(this);

        this.inlineExporter =
            new InlineExporter(this);

        this.styleExporter =
            new StyleExporter(this);

        this.tableExporter =
            new TableExporter(this);

        this.imageExporter =
            new ImageExporter(this);


        /* ==================================================
           INITIALISATION
        ================================================== */

        this.initialize();

    }


    /* ======================================================
       INITIALISATION
    ====================================================== */

    initialize() {

        this.registry.clear();

        this.registerBlocks();

        this.registerInline();

        this.registerTables();

        this.registerImages();

    }


    /* ======================================================
       BLOCS HTML
    ====================================================== */

    registerBlocks() {

        this.registry.registerMany({

            p:
                node =>
                    this.blockExporter
                        .exportParagraph(node),

            h1:
                node =>
                    this.blockExporter
                        .exportHeading(node, 1),

            h2:
                node =>
                    this.blockExporter
                        .exportHeading(node, 2),

            h3:
                node =>
                    this.blockExporter
                        .exportHeading(node, 3),

            h4:
                node =>
                    this.blockExporter
                        .exportHeading(node, 4),

            h5:
                node =>
                    this.blockExporter
                        .exportHeading(node, 5),

            h6:
                node =>
                    this.blockExporter
                        .exportHeading(node, 6),

            blockquote:
                node =>
                    this.blockExporter
                        .exportBlockquote(node),

            pre:
                node =>
                    this.blockExporter
                        .exportCodeBlock(node),

            ul:
                node =>
                    this.blockExporter
                        .exportBulletList(node),

            ol:
                node =>
                    this.blockExporter
                        .exportOrderedList(node),

            li:
                node =>
                    this.blockExporter
                        .exportListItem(node),

            hr:
                () =>
                    this.blockExporter
                        .exportHorizontalRule(),

            div:
                node =>
                    this.blockExporter
                        .exportDiv(node),

            section:
                node =>
                    this.blockExporter
                        .exportSection(node),

            article:
                node =>
                    this.blockExporter
                        .exportArticle(node),

            header:
                node =>
                    this.blockExporter
                        .exportHeader(node),

            footer:
                node =>
                    this.blockExporter
                        .exportFooter(node),

            aside:
                node =>
                    this.blockExporter
                        .exportAside(node),

            main:
                node =>
                    this.blockExporter
                        .exportMain(node),

            figure:
                node =>
                    this.blockExporter
                        .exportFigure(node),

            figcaption:
                node =>
                    this.blockExporter
                        .exportFigCaption(node),

        });

    }


    /* ======================================================
       INLINE HTML
    ====================================================== */

    registerInline() {

        this.registry.registerMany({

            strong:
                node =>
                    this.inlineExporter
                        .exportBold(node),

            b:
                node =>
                    this.inlineExporter
                        .exportBold(node),

            em:
                node =>
                    this.inlineExporter
                        .exportItalic(node),

            i:
                node =>
                    this.inlineExporter
                        .exportItalic(node),

            u:
                node =>
                    this.inlineExporter
                        .exportUnderline(node),

            s:
                node =>
                    this.inlineExporter
                        .exportStrike(node),

            del:
                node =>
                    this.inlineExporter
                        .exportStrike(node),

            code:
                node =>
                    this.inlineExporter
                        .exportInlineCode(node),

            a:
                node =>
                    this.inlineExporter
                        .exportLink(node),

            span:
                node =>
                    this.inlineExporter
                        .exportSpan(node),

            mark:
                node =>
                    this.inlineExporter
                        .exportMark(node),

            sub:
                node =>
                    this.inlineExporter
                        .exportSub(node),

            sup:
                node =>
                    this.inlineExporter
                        .exportSup(node),

            small:
                node =>
                    this.inlineExporter
                        .exportSmall(node),

            big:
                node =>
                    this.inlineExporter
                        .exportBig(node),

            cite:
                node =>
                    this.inlineExporter
                        .exportCitation(node),

            var:
                node =>
                    this.inlineExporter
                        .exportVariable(node),

            kbd:
                node =>
                    this.inlineExporter
                        .exportKeyboard(node),

            abbr:
                node =>
                    this.inlineExporter
                        .exportAbbreviation(node),

            bdi:
                node =>
                    this.inlineExporter
                        .exportBDI(node),

            bdo:
                node =>
                    this.inlineExporter
                        .exportBDO(node),

        });

    }


    /* ======================================================
       TABLEAUX
    ====================================================== */

    registerTables() {

        this.registry.registerMany({

            table:
                node =>
                    this.tableExporter
                        .exportTable(node),

            thead:
                node =>
                    this.tableExporter
                        .exportHead(node),

            tbody:
                node =>
                    this.tableExporter
                        .exportBody(node),

            tfoot:
                node =>
                    this.tableExporter
                        .exportFoot(node),

            tr:
                node =>
                    this.tableExporter
                        .exportRow(node),

            th:
                node =>
                    this.tableExporter
                        .exportHeaderCell(node),

            td:
                node =>
                    this.tableExporter
                        .exportCell(node),

        });

    }


    /* ======================================================
       IMAGES
    ====================================================== */

    registerImages() {

        this.registry.register(

            "img",

            node =>
                this.imageExporter
                    .export(node)

        );

    }


    /* ======================================================
       DOCUMENT HTML -> LATEX
    ====================================================== */

    export(html = "") {

        if (
            typeof html !== "string" ||
            !html.trim()
        ) {

            return "";

        }


        if (
            typeof DOMParser ===
            "undefined"
        ) {

            return "";

        }


        const parser =
            new DOMParser();


        const document =
            parser.parseFromString(
                html,
                "text/html"
            );


        const bodyContent =
            this.exportDocument(
                document
            );


        /*
         * Aucun contenu.
         */

        if (!bodyContent.trim()) {

            return "";

        }


        /*
         * Construction du document
         * LaTeX complet.
         */

        return (

            "\\documentclass{article}\n\n" +

            "\\usepackage[utf8]{inputenc}\n" +

            "\\usepackage[T1]{fontenc}\n" +

            "\\usepackage{amsmath}\n" +

            "\\usepackage{amssymb}\n" +

            "\\usepackage{xcolor}\n" +

            "\\usepackage{hyperref}\n" +

            "\\usepackage{graphicx}\n\n" +

            "\\begin{document}\n\n" +

            bodyContent.trim() +

            "\n\n" +

            "\\end{document}"

        );

    }


    /* ======================================================
       EXPORT D'UN NŒUD
    ====================================================== */

    exportNode(node) {

        if (!node) {

            return "";

        }


        /* ==================================================
           TEXTE
        ================================================== */

        if (
            node.nodeType ===
            Node.TEXT_NODE
        ) {

            return this.escaper.escape(
                node.textContent ?? ""
            );

        }


        /* ==================================================
           COMMENTAIRE
        ================================================== */

        if (
            node.nodeType ===
            Node.COMMENT_NODE
        ) {

            return "";

        }


        /* ==================================================
           DOCUMENT / FRAGMENT
        ================================================== */

        if (
            node.nodeType ===
                Node.DOCUMENT_NODE ||

            node.nodeType ===
                Node.DOCUMENT_FRAGMENT_NODE
        ) {

            return this.exportChildren(
                node
            );

        }


        /* ==================================================
           NŒUD NON ÉLÉMENT
        ================================================== */

        if (
            node.nodeType !==
            Node.ELEMENT_NODE
        ) {

            return "";

        }


        /* ==================================================
           TAG
        ================================================== */

        const tagName =
            node.tagName
                ?.toLowerCase();


        if (!tagName) {

            return "";

        }


        /* ==================================================
           EXPORTEUR
        ================================================== */

        const exporter =
            this.registry.get(
                tagName
            );


        if (exporter) {

            return exporter(node);

        }


        /* ==================================================
           FALLBACK
        ================================================== */

        return this.exportChildren(
            node
        );

    }


    /* ======================================================
       EXPORT DES ENFANTS
    ====================================================== */

    exportChildren(node) {

        if (
            !node ||
            !node.childNodes
        ) {

            return "";

        }


        let latex = "";


        node.childNodes.forEach(
            child => {

                latex +=
                    this.exportNode(
                        child
                    );

            }
        );


        return latex;

    }


    /* ======================================================
       EXPORT DU DOCUMENT
    ====================================================== */

    exportDocument(document) {

        if (!document) {

            return "";

        }


        if (document.body) {

            return this.exportChildren(
                document.body
            );

        }


        return this.exportChildren(
            document
        );

    }

}


/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const htmlLatexExporter =
    new HtmlLatexExporter();


export default htmlLatexExporter;