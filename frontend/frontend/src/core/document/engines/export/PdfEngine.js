/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : PdfEngine.js
 * Description : Génération des documents PDF.
 * Version : 2.0.0
 * Statut : Fonctionnel
 * ============================================================
 */

import html2pdf from "html2pdf.js";

class PdfEngine {

    constructor() {

        this.lastDocument = null;

        this.lastResult = null;

        this.configuration = {

            pageSize: "a4",

            orientation: "portrait",

            margins: 10,

            compress: true,

            fileName: "document.pdf",

        };

    }

    /* ======================================================
       CONFIGURATION
    ====================================================== */

    configure(options = {}) {

        this.configuration = {

            ...this.configuration,

            ...options,

        };

    }

    getConfiguration() {

        return this.configuration;

    }

    /* ======================================================
       CREATION D'UN CONTENEUR HTML
    ====================================================== */

    createContainer(html) {
        const container = document.createElement("div");
        const page = this.getPageDimensions();
        const margins = this.getMargins();
        const contentWidth = Math.max(280, (page.width - margins.left - margins.right) * 96 / 25.4);
        container.className = "macevo-pdf-document";
        container.style.width = `${contentWidth}px`;
        container.style.boxSizing = "border-box";
        container.innerHTML = html;

        const style = document.createElement("style");
        style.textContent = `
            .macevo-pdf-document { box-sizing:border-box; width:${contentWidth}px; margin:0; padding:0; color:#1f2937; background:#fff; font-family:"Times New Roman",Georgia,serif; font-size:12pt; line-height:1.5; overflow-wrap:break-word; }
            .macevo-pdf-document * { box-sizing:border-box; }
            .macevo-pdf-document p { margin:0 0 8pt; text-align:justify; text-justify:inter-word; orphans:3; widows:3; }
            .macevo-pdf-document h1,.macevo-pdf-document h2,.macevo-pdf-document h3,.macevo-pdf-document h4 { color:#172554; font-family:Arial,Helvetica,sans-serif; font-weight:700; line-height:1.25; break-after:avoid; page-break-after:avoid; }
            .macevo-pdf-document h1 { margin:24pt 0 14pt; font-size:22pt; }
            .macevo-pdf-document h2 { margin:20pt 0 9pt; padding-bottom:4pt; border-bottom:.6pt solid #cbd5e1; font-size:16pt; }
            .macevo-pdf-document h3 { margin:15pt 0 7pt; font-size:13pt; }
            .macevo-pdf-document h4 { margin:12pt 0 6pt; font-size:12pt; }
            .macevo-pdf-document ul,.macevo-pdf-document ol { margin:5pt 0 10pt; padding-left:24pt; }
            .macevo-pdf-document li { margin:0 0 4pt; }
            .macevo-pdf-document table { width:100%; margin:12pt 0; border-collapse:collapse; table-layout:fixed; font-size:10pt; }
            .macevo-pdf-document th,.macevo-pdf-document td { padding:6pt 7pt; border:.6pt solid #cbd5e1; vertical-align:top; overflow-wrap:anywhere; }
            .macevo-pdf-document th { background:#eff6ff; color:#172554; font-weight:700; }
            .macevo-pdf-document figure,.macevo-pdf-document table,.macevo-pdf-document blockquote,.macevo-pdf-document .macevo-equation,.macevo-pdf-document [data-macevo-equation] { break-inside:avoid; page-break-inside:avoid; }
            .macevo-pdf-document img,.macevo-pdf-document svg { display:block; max-width:100%; height:auto; margin:12pt auto; }
            .macevo-pdf-document figcaption { margin-top:5pt; color:#475569; text-align:center; font-size:9.5pt; }
            .macevo-pdf-document blockquote { margin:12pt 0; padding:8pt 12pt; border-left:2pt solid #64748b; background:#f8fafc; }
            .macevo-pdf-document pre,.macevo-pdf-document code { font-family:Consolas,"Courier New",monospace; font-size:9.5pt; white-space:pre-wrap; overflow-wrap:anywhere; }
            .macevo-pdf-document a { color:#1d4ed8; text-decoration:underline; }
            .macevo-pdf-document .macevo-page-break,.macevo-pdf-document .rm-page-break { display:block; height:0; break-after:page; page-break-after:always; }
            .macevo-pdf-document .macevo-column-break { break-after:column; }
            .macevo-pdf-document .macevo-cover,.macevo-pdf-document .macevo-title-page { break-after:page; page-break-after:always; }
        `;
        container.prepend(style);

        return container;
    }

    getPageDimensions() {
        const dimensions = {
            a3: { width: 297, height: 420 },
            a4: { width: 210, height: 297 },
            a5: { width: 148, height: 210 },
            letter: { width: 215.9, height: 279.4 },
            legal: { width: 215.9, height: 355.6 },
        };
        const selected = dimensions[String(this.configuration.pageSize || "a4").toLowerCase()] || dimensions.a4;
        return this.configuration.orientation === "landscape"
            ? { width: selected.height, height: selected.width }
            : selected;
    }

    getMargins() {
        const value = this.configuration.margins;
        if (typeof value === "number") return { top: value, right: value, bottom: value, left: value };
        return {
            top: Number(value?.top ?? 25.4),
            right: Number(value?.right ?? 25.4),
            bottom: Number(value?.bottom ?? 25.4),
            left: Number(value?.left ?? 25.4),
        };
    }

    getOptions(filename = this.configuration.fileName) {
        const margins = this.getMargins();
        return {
            margin: [margins.top, margins.right, margins.bottom, margins.left],
            filename,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", scrollX: 0, scrollY: 0 },
            jsPDF: {
                unit: "mm",
                format: this.configuration.pageSize,
                orientation: this.configuration.orientation,
                compress: this.configuration.compress,
            },
            pagebreak: {
                mode: ["css", "legacy"],
                before: ".macevo-page-break, .rm-page-break",
                avoid: ["figure", "table", "blockquote", ".macevo-equation"],
            },
        };
    }

    addPageNumbers(pdf) {
        const total = pdf.internal.getNumberOfPages();
        const dimensions = this.getPageDimensions();
        const margins = this.getMargins();
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        for (let page = 1; page <= total; page += 1) {
            pdf.setPage(page);
            pdf.text(`${page} / ${total}`, dimensions.width / 2, dimensions.height - Math.max(6, margins.bottom * 0.35), { align: "center" });
        }
    }

    /* ======================================================
       EXPORT PDF
    ====================================================== */

    async export(html) {

        this.lastDocument = html;

        const element = this.createContainer(html);

        const pdf = await html2pdf()
            .set(this.getOptions())
            .from(element)
            .toPdf()
            .get("pdf");
        this.addPageNumbers(pdf);
        pdf.save(this.configuration.fileName);

        this.lastResult = {

            success: true,

            generatedAt: new Date(),

            fileName: this.configuration.fileName,

        };

        return this.lastResult;

    }

    /* ======================================================
       APERCU
    ====================================================== */

    async preview(html) {

        const element = this.createContainer(html);

        const worker = html2pdf()

            .set(this.getOptions("preview.pdf"))

            .from(element);

        const pdf = await worker.toPdf().get("pdf");

        this.addPageNumbers(pdf);
        const blobUrl = pdf.output("bloburl");
        const previewWindow = window.open(blobUrl, "_blank");
        if (!previewWindow) {
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = "apercu-document-scientifique.pdf";
            link.click();
        }

    }

    /* ======================================================
       TELECHARGEMENT
    ====================================================== */

    async download(html) {

        return this.export(html);

    }

    /* ======================================================
       DERNIER RESULTAT
    ====================================================== */

    getLastResult() {

        return this.lastResult;

    }

    getLastDocument() {

        return this.lastDocument;

    }

    /* ======================================================
       RESET
    ====================================================== */

    reset() {

        this.lastDocument = null;

        this.lastResult = null;

    }

}

const pdfEngine = new PdfEngine();

export default pdfEngine;
