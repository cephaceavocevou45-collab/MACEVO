/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : LatexConverter.js
 * Description : Convertisseur central HTML <-> LaTeX (Version Sécurisée)
 * Version : 3.1.0
 * Statut : Stable / Correctif Syntaxe LaTeX & Échappement
 * ============================================================
 */

import LatexUtils from "./LatexUtils";

import htmlLatexExporter from "../../../../../latex/services/exporters/HtmlLatexExporter";
import latexHtmlImporter from "../../../../../latex/services/importers/LatexHtmlImporter";



class LatexConverter {
    constructor() {
        this.reset();
    }

    /* ======================================================
       RESET & ETAT
    ====================================================== */
    reset() {
        this.html = "";
        this.document = null;
        this.output = "";
        this.errors = [];
    }

    /* ======================================================
       MÉTHODES D'INTERFACE (COMPATIBILITÉ LATEXSYNCSERVICE)
    ====================================================== */
    htmlToLatex(html = "") {
        return this.convert(html);
    }

    latexToHtml(latex = "") {
        if (!latex || typeof latex !== "string") return "";
        return `<pre>${latex}</pre>`;
    }

    convertHTMLToLatex(html = "") {
        return this.htmlToLatex(html);
    }

    convertLatexToHTML(latex = "") {
        return this.latexToHtml(latex);
    }

    convertLatexToHtml(latex = "") {
        return this.latexToHtml(latex);
    }

    /* ======================================================
       CONVERSION PRINCIPALE (HTML -> LATEX)
    ====================================================== */
    convert(html = "") {
        this.reset();
        this.html = html;

        if (!html || typeof html !== "string" || !html.trim()) {
            return "";
        }

        try {
            const parser = new DOMParser();
            this.document = parser.parseFromString(html, "text/html");
            this.output = this.convertChildren(this.document.body);

            return this.cleanup(this.output);
        } catch (error) {
            console.error("LatexConverter : erreur lors de la conversion", error);
            this.addError(error.message);
            return "";
        }
    }

    /* ======================================================
       EXPLORATION DES NOEUDS DOM
    ====================================================== */
    convertChildren(node) {
        if (!node || !node.childNodes) return "";
        let latex = "";
        node.childNodes.forEach((child) => {
            latex += this.convertNode(child);
        });
        return latex;
    }

    convertNode(node) {
        if (!node) return "";

        // Texte brut (échappement des caractères spéciaux LaTeX)
        if (node.nodeType === Node.TEXT_NODE) {
            return this.convertText(node);
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return "";
        }

        const tag = node.tagName.toLowerCase();

        switch (tag) {
            case "h1": return this.convertHeading(node, 1);
            case "h2": return this.convertHeading(node, 2);
            case "h3": return this.convertHeading(node, 3);
            case "h4": return this.convertHeading(node, 4);
            case "h5": return this.convertHeading(node, 5);
            case "h6": return this.convertHeading(node, 6);

            case "p": return this.convertParagraph(node);
            case "strong":
            case "b": return this.convertBold(node);
            case "em":
            case "i": return this.convertItalic(node);
            case "u": return this.convertUnderline(node);
            case "s":
            case "strike":
            case "del": return this.convertStrike(node);
            case "sup": return this.convertSup(node);
            case "sub": return this.convertSub(node);

            case "br": return " \\\\\n";
            case "hr": return "\n\\hrule\n";

            case "div":
            case "section":
            case "article":
            case "main":
            case "span": return this.convertChildren(node);

            case "blockquote": return this.convertBlockquote(node);
            case "pre": return this.convertPre(node);
            case "code": return this.convertCode(node);

            case "ul": return this.convertUnorderedList(node);
            case "ol": return this.convertOrderedList(node);
            case "li": return this.convertListItem(node);

            case "table": return this.convertTable(node);
            case "thead":
            case "tbody":
            case "tfoot": return this.convertChildren(node);
            case "tr": return this.convertTableRow(node);

            case "img": return this.convertImage(node);
            case "a": return this.convertLink(node);
            case "figure": return this.convertChildren(node);
            case "figcaption": return `\\caption{${this.convertChildren(node)}}`;

            default: return this.convertChildren(node);
        }
    }

    /* ======================================================
       CONVERTISSEURS DE BALISES (SÉCURISÉS)
    ====================================================== */
    convertText(node) {
        const text = node.textContent || "";
        if (LatexUtils && typeof LatexUtils.escapeLatex === "function") {
            return LatexUtils.escapeLatex(text);
        }
        
        return text
            .replace(/\\/g, "\\textbackslash{}")
            .replace(/&/g, "\\&")
            .replace(/%/g, "\\%")
            .replace(/\$/g, "\\$")
            .replace(/#/g, "\\#")
            .replace(/_/g, "\\_")
            .replace(/\{/g, "\\{")
            .replace(/\}/g, "\\}")
            .replace(/~/g, "\\textasciitilde{}")
            .replace(/\^/g, "\\textasciicircum{}")
            .replace(/</g, "\\textless{}")
            .replace(/>/g, "\\textgreater{}");
    }

    convertHeading(node, level) {
        const text = this.convertChildren(node).trim();
        if (!text) return "";
        switch (level) {
            case 1: return `\n\\section{${text}}\n`;
            case 2: return `\n\\subsection{${text}}\n`;
            case 3: return `\n\\subsubsection{${text}}\n`;
            case 4: return `\n\\paragraph{${text}}\n`;
            default: return `\n\\textbf{${text}}\n`;
        }
    }

    convertParagraph(node) {
        const content = this.convertChildren(node).trim();
        return content ? `\n\n${content}\n\n` : "";
    }

    convertBold(node) {
        return `\\textbf{${this.convertChildren(node)}}`;
    }

    convertItalic(node) {
        return `\\textit{${this.convertChildren(node)}}`;
    }

    convertUnderline(node) {
        return `\\underline{${this.convertChildren(node)}}`;
    }

    convertStrike(node) {
        return `\\sout{${this.convertChildren(node)}}`;
    }

    convertSup(node) {
        return `\\textsuperscript{${this.convertChildren(node)}}`;
    }

    convertSub(node) {
        return `\\textsubscript{${this.convertChildren(node)}}`;
    }

    convertBlockquote(node) {
        return `\n\\begin{quote}\n${this.convertChildren(node)}\n\\end{quote}\n`;
    }

    convertCode(node) {
        return `\\texttt{${node.textContent}}`;
    }

    convertPre(node) {
        return `\n\\begin{verbatim}\n${node.textContent}\n\\end{verbatim}\n`;
    }

    convertUnorderedList(node) {
        return `\n\\begin{itemize}\n${this.convertChildren(node)}\\end{itemize}\n`;
    }

    convertOrderedList(node) {
        return `\n\\begin{enumerate}\n${this.convertChildren(node)}\\end{enumerate}\n`;
    }

    convertListItem(node) {
        return `  \\item ${this.convertChildren(node).trim()}\n`;
    }

    /* --- TABLEAU UNIFORMISÉ --- */
    convertTable(node) {
        const rows = Array.from(node.querySelectorAll("tr"));
        if (rows.length === 0) return "";

        let maxCols = 1;
        rows.forEach((row) => {
            const count = row.querySelectorAll("th, td").length;
            if (count > maxCols) maxCols = count;
        });

        const widthPercent = (0.90 / maxCols).toFixed(2);
        const alignment = Array(maxCols).fill(`p{${widthPercent}\\linewidth}`).join("|");

        let latex = "\n\\begin{table}[h]\n\\centering\n";
        latex += `\\begin{tabular}{|${alignment}|}\n\\hline\n`;

        rows.forEach((row) => {
            latex += this.convertTableRow(row);
        });

        latex += "\\end{tabular}\n\\end{table}\n";
        return latex;
    }

    convertTableRow(node) {
        const cells = [];
        node.childNodes.forEach((cell) => {
            if (cell.nodeType === Node.ELEMENT_NODE) {
                const tag = cell.tagName.toLowerCase();
                if (tag === "td" || tag === "th") {
                    let content = this.convertChildren(cell).trim();
                    if (tag === "th") content = `\\textbf{${content}}`;
                    cells.push(content);
                }
            }
        });
        return cells.join(" & ") + " \\\\\n\\hline\n";
    }

    /* --- RENDER DES LIENS SÉCURISÉ POUR COMPILATION --- */
    convertLink(node) {
        const href = (node.getAttribute("href") || "").trim();
        const text = this.convertChildren(node).trim();

        if (!href && !text) return "";
        if (!href) return text;
        if (!text) return `\\textbf{${href}}`;

        // Format sécurisé sans plantage hyperref
        return `\\textbf{${text}}`;
    }

    convertImage(node) {
        const alt = node.getAttribute("alt") || "";
        return `\n\\begin{figure}[h]\n\\centering\n\\caption{${alt}}\n\\end{figure}\n`;
    }

    /* ======================================================
       NETTOYAGE & ERREURS
    ====================================================== */
    cleanup(text = "") {
        return text
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    addError(message) {
        this.errors.push({ message, date: new Date() });
    }
// * ======================================================
//     * HTML -> LATEX
//      * ======================================================
//      */

    htmlToLatex(html = "") {

        if (
            typeof html !== "string" ||
            !html.trim()
        ) {
            return "";
        }

        try {

            return htmlLatexExporter.export(html);

        }
        catch (error) {

            console.error(
                "LatexConverter : erreur HTML -> LaTeX",
                error
            );

            return "";

        }

    }


    /**
     * ======================================================
     * LATEX -> HTML
     * ======================================================
     */

    latexToHtml(latex = "") {

        if (
            typeof latex !== "string" ||
            !latex.trim()
        ) {
            return "";
        }

        try {

            return latexHtmlImporter.import(latex);

        }
        catch (error) {

            console.error(
                "LatexConverter : erreur LaTeX -> HTML",
                error
            );

            return "";

        }

    }


    /**
     * ======================================================
     * COMPATIBILITÉ
     * ======================================================
     */

    convertHTMLToLatex(html = "") {

        return this.htmlToLatex(html);

    }


    convertLatexToHTML(latex = "") {

        return this.latexToHtml(latex);

    }


    convertLatexToHtml(latex = "") {

        return this.latexToHtml(latex);

    }


}

// Export de l'instance par défaut ET de la classe
const latexConverter = new LatexConverter();
export { LatexConverter };
export default latexConverter;