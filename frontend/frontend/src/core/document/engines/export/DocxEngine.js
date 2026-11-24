/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : DocxEngine.js
 * Description : Génération réelle de documents DOCX à partir
 *               de la structure produite par DocumentParser.
 * Version : 2.1.0
 * Statut : Fonctionnel
 * ============================================================
 */

import {
    AlignmentType,
    Document,
    ExternalHyperlink,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    Packer,
    Paragraph,
    TextRun,
    UnderlineType,
} from "docx";

import { saveAs } from "file-saver";

import documentParser from "./parser/DocumentParser";

/* ==========================================================
   CONSTANTES
========================================================== */

const HEADING_LEVELS = {

    1: HeadingLevel.HEADING_1,

    2: HeadingLevel.HEADING_2,

    3: HeadingLevel.HEADING_3,

    4: HeadingLevel.HEADING_4,

    5: HeadingLevel.HEADING_5,

    6: HeadingLevel.HEADING_6,

};

const ALIGNMENTS = {

    left: AlignmentType.LEFT,

    center: AlignmentType.CENTER,

    right: AlignmentType.RIGHT,

    justify: AlignmentType.JUSTIFIED,

};

async function rasterizeInlineSvgImages(html) {
    const matches = [...html.matchAll(/src=(["'])(data:image\/svg\+xml[^"']+)\1/gi)];
    let prepared = html;
    for (const match of matches) {
        const original = match[2].replace(/&amp;/g, "&");
        const pngData = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth || 640;
                canvas.height = image.naturalHeight || 320;
                const context = canvas.getContext("2d");
                if (!context) return reject(new Error("Canvas indisponible pour l’export de la figure."));
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/png"));
            };
            image.onerror = () => reject(new Error("Impossible de convertir une figure SVG pour Word."));
            image.src = original;
        });
        prepared = prepared.replace(match[2], pngData);
    }
    return prepared;
}

/* ==========================================================
   CLASSE
========================================================== */

class DocxEngine {

    constructor() {

        this.document = "";

        this.lastExport = null;

        this.configuration = {

            creator: "MACEVO",

            title: "Document",

            subject: "",

            description: "Document généré avec MACEVO",

            keywords: [],

            company: "",

            language: "fr",

            fileName: "document.docx",

            defaultFont: "Calibri",

            defaultFontSize: 11,

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

        if (!Array.isArray(this.configuration.keywords)) {

            this.configuration.keywords = [];

        }

        return this.getConfiguration();

    }

    getConfiguration() {

        return {

            ...this.configuration,

            keywords: [

                ...this.configuration.keywords,

            ],

        };

    }

    /* ======================================================
       EXPORT PRINCIPAL
    ====================================================== */

    async export(html, options = {}) {

        if (typeof html !== "string") {

            throw new TypeError(

                "DocxEngine.export attend une chaîne HTML."

            );

        }

        if (!html.trim()) {

            throw new Error(

                "Impossible d'exporter un document vide."

            );

        }

        this.configure(options);

        html = await rasterizeInlineSvgImages(html);
        this.document = html;

        const blocks = documentParser.parse(html);

        const children = this.convertBlocks(blocks);

        if (children.length === 0) {

            children.push(

                new Paragraph({

                    children: [

                        new TextRun(""),

                    ],

                })

            );

        }

        const wordDocument = this.createWordDocument(

            children

        );

        const blob = await Packer.toBlob(

            wordDocument

        );

        const fileName = this.normalizeFileName(

            this.configuration.fileName

        );

        saveAs(

            blob,

            fileName

        );

        this.lastExport = {

            success: true,

            format: "docx",

            fileName,

            generatedAt: new Date(),

            blockCount: blocks.length,

            size: blob.size,

            metadata: this.getConfiguration(),

        };

        return this.lastExport;

    }

    /* ======================================================
       TÉLÉCHARGEMENT
    ====================================================== */

    async download(html, options = {}) {

        return this.export(

            html,

            options

        );

    }

    /* ======================================================
       CRÉATION DU DOCUMENT WORD
    ====================================================== */

    createWordDocument(children) {

        return new Document({

            creator: this.configuration.creator,

            title: this.configuration.title,

            subject: this.configuration.subject,

            description:
                this.configuration.description,

            keywords:
                this.configuration.keywords.join(", "),

            company: this.configuration.company,

            language: this.configuration.language,

            styles: {

                default: {

                    document: {

                        run: {

                            font:
                                this.configuration
                                    .defaultFont,

                            size:
                                this.pointsToHalfPoints(

                                    this.configuration
                                        .defaultFontSize

                                ),

                        },

                    },

                },

            },

            numbering: {

                config: [

                    {

                        reference:
                            "macevo-ordered-list",

                        levels: [

                            {

                                level: 0,

                                format:
                                    LevelFormat.DECIMAL,

                                text: "%1.",

                                alignment:
                                    AlignmentType.START,

                                style: {

                                    paragraph: {

                                        indent: {

                                            left: 720,

                                            hanging: 360,

                                        },

                                    },

                                },

                            },

                            {

                                level: 1,

                                format:
                                    LevelFormat.LOWER_LETTER,

                                text: "%2.",

                                alignment:
                                    AlignmentType.START,

                                style: {

                                    paragraph: {

                                        indent: {

                                            left: 1440,

                                            hanging: 360,

                                        },

                                    },

                                },

                            },

                            {

                                level: 2,

                                format:
                                    LevelFormat.LOWER_ROMAN,

                                text: "%3.",

                                alignment:
                                    AlignmentType.START,

                                style: {

                                    paragraph: {

                                        indent: {

                                            left: 2160,

                                            hanging: 360,

                                        },

                                    },

                                },

                            },

                        ],

                    },

                ],

            },

            sections: [

                {

                    properties: {},

                    children,

                },

            ],

        });

    }

    /* ======================================================
       CONVERSION DES BLOCS
    ====================================================== */

    convertBlocks(blocks = []) {

        const children = [];

        blocks.forEach((block) => {

            const converted =

                this.convertBlock(block);

            if (Array.isArray(converted)) {

                children.push(...converted);

            } else if (converted) {

                children.push(converted);

            }

        });

        return children;

    }

    convertBlock(block) {

        if (!block || !block.type) {

            return null;

        }

        switch (block.type) {

            case "paragraph":

                return this.createParagraph(block);

            case "heading":

                return this.createHeading(block);

            case "blockquote":

                return this.createBlockquote(block);

            case "codeBlock":

                return this.createCodeBlock(block);

            case "list":

                return this.createList(block);

            case "horizontalRule":

                return this.createHorizontalRule();

            default:

                return null;

        }

    }

    /* ======================================================
       PARAGRAPHES
    ====================================================== */

    createParagraph(block) {

        return new Paragraph({

            alignment: this.getAlignment(

                block.alignment

            ),

            children: this.convertInlineContent(

                block.content

            ),

            spacing: {

                after: 120,

                line: 276,

            },

        });

    }

    /* ======================================================
       TITRES
    ====================================================== */

    createHeading(block) {

        const level = Math.min(

            6,

            Math.max(

                1,

                Number(block.level) || 1

            )

        );

        return new Paragraph({

            heading: HEADING_LEVELS[level],

            alignment: this.getAlignment(

                block.alignment

            ),

            children: this.convertInlineContent(

                block.content

            ),

            spacing: {

                before: 240,

                after: 120,

            },

        });

    }

    /* ======================================================
       CITATIONS
    ====================================================== */

    createBlockquote(block) {

        return new Paragraph({

            alignment: this.getAlignment(

                block.alignment

            ),

            indent: {

                left: 720,

                right: 360,

            },

            border: {

                left: {

                    color: "A0A0A0",

                    size: 12,

                    space: 12,

                    style: "single",

                },

            },

            children: [

                new TextRun({

                    text: "“",

                    italic: true,

                    color: "666666",

                }),

                ...this.convertInlineContent(

                    block.content,

                    {

                        italic: true,

                        color: "555555",

                    }

                ),

                new TextRun({

                    text: "”",

                    italic: true,

                    color: "666666",

                }),

            ],

            spacing: {

                before: 120,

                after: 120,

            },

        });

    }

    /* ======================================================
       BLOCS DE CODE
    ====================================================== */

    createCodeBlock(block) {

        const code = String(

            block.text ?? ""

        );

        return new Paragraph({

            children: [

                new TextRun({

                    text: code,

                    font: "Consolas",

                    size: 20,

                    color: "222222",

                }),

            ],

            shading: {

                fill: "F3F4F6",

            },

            spacing: {

                before: 120,

                after: 120,

            },

            indent: {

                left: 360,

                right: 360,

            },

        });

    }

    /* ======================================================
       LISTES
    ====================================================== */

    createList(block, level = 0) {

        const paragraphs = [];

        const safeLevel = Math.min(

            2,

            Math.max(0, level)

        );

        block.items?.forEach((item) => {

            const paragraphOptions = {

                children: this.convertInlineContent(

                    item.content

                ),

                spacing: {

                    after: 60,

                },

            };

            if (block.listType === "ordered") {

                paragraphOptions.numbering = {

                    reference:
                        "macevo-ordered-list",

                    level: safeLevel,

                };

            } else {

                paragraphOptions.bullet = {

                    level: safeLevel,

                };

            }

            paragraphs.push(

                new Paragraph(

                    paragraphOptions

                )

            );

            item.children?.forEach(

                (nestedList) => {

                    paragraphs.push(

                        ...this.createList(

                            nestedList,

                            safeLevel + 1

                        )

                    );

                }

            );

        });

        return paragraphs;

    }

    /* ======================================================
       LIGNE HORIZONTALE
    ====================================================== */

    createHorizontalRule() {

        return new Paragraph({

            border: {

                bottom: {

                    color: "B7B7B7",

                    size: 6,

                    space: 1,

                    style: "single",

                },

            },

            spacing: {

                before: 120,

                after: 120,

            },

            children: [

                new TextRun(""),

            ],

        });

    }

    /* ======================================================
       CONTENU INLINE
    ====================================================== */

    convertInlineContent(

        content = [],

        inheritedMarks = {}

    ) {

        const children = [];

        content.forEach((node) => {

            const converted =

                this.convertInlineNode(

                    node,

                    inheritedMarks

                );

            if (Array.isArray(converted)) {

                children.push(...converted);

            } else if (converted) {

                children.push(converted);

            }

        });

        if (children.length === 0) {

            children.push(

                new TextRun("")

            );

        }

        return children;

    }

    convertInlineNode(

        node,

        inheritedMarks = {}

    ) {

        if (!node || !node.type) {

            return null;

        }

        if (node.type === "lineBreak") {

            return new TextRun({

                text: "",

                break: 1,

            });

        }

        if (node.type === "image") {
            const match = String(node.src || "").match(/^data:image\/(png|jpe?g|gif|bmp);base64,/i);
            if (!match) {
                return new TextRun({ text: node.alt || "Figure", italic: true, color: "777777" });
            }
            const imageType = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
            const encodedImage = String(node.src).split(",", 2)[1] || "";
            const binaryImage = atob(encodedImage);
            const imageData = Uint8Array.from(binaryImage, (character) => character.charCodeAt(0));
            const sourceWidth = Math.max(1, Number(node.width) || 600);
            const sourceHeight = Math.max(1, Number(node.height) || 300);
            const scale = Math.min(600 / sourceWidth, 650 / sourceHeight, 1);
            return new ImageRun({
                data: imageData,
                type: imageType,
                transformation: {
                    width: Math.max(40, Math.round(sourceWidth * scale)),
                    height: Math.max(24, Math.round(sourceHeight * scale)),
                },
            });
        }

        if (node.type !== "text") {

            return null;

        }

        const marks = {

            ...inheritedMarks,

            ...(node.marks ?? {}),

        };

        const run = this.createTextRun(

            node.text,

            marks

        );

        if (

            marks.link?.href &&

            this.isValidLink(

                marks.link.href

            )

        ) {

            return new ExternalHyperlink({

                link: marks.link.href,

                children: [

                    new TextRun({

                        ...this.createTextRunOptions(

                            node.text,

                            marks

                        ),

                        color:
                            marks.color ||
                            "0563C1",

                        underline: {

                            type:
                                UnderlineType.SINGLE,

                        },

                    }),

                ],

            });

        }

        return run;

    }

    createTextRun(text, marks = {}) {

        return new TextRun(

            this.createTextRunOptions(

                text,

                marks

            )

        );

    }

    createTextRunOptions(text, marks = {}) {

        const options = {

            text: String(text ?? ""),

            bold: Boolean(marks.bold),

            italics: Boolean(marks.italic),

            strike: Boolean(marks.strike),

            subScript: Boolean(

                marks.subscript

            ),

            superScript: Boolean(

                marks.superscript

            ),

        };

        if (marks.underline) {

            options.underline = {

                type: UnderlineType.SINGLE,

            };

        }

        if (marks.code) {

            options.font = "Consolas";

        } else if (marks.fontFamily) {

            options.font = marks.fontFamily;

        }

        if (marks.fontSize) {

            options.size =

                this.pointsToHalfPoints(

                    marks.fontSize

                );

        }

        if (marks.color) {

            options.color =

                this.normalizeHexColor(

                    marks.color

                );

        }

        if (

            marks.highlight &&

            this.isHexColor(

                marks.highlight

            )

        ) {

            options.shading = {

                fill: this.normalizeHexColor(

                    marks.highlight

                ),

            };

        }

        return options;

    }

    /* ======================================================
       APERÇU
    ====================================================== */

    preview(html) {

        if (typeof html !== "string") {

            throw new TypeError(

                "DocxEngine.preview attend une chaîne HTML."

            );

        }

        this.document = html;

        const previewWindow = window.open(

            "",

            "_blank",

            "noopener,noreferrer"

        );

        if (!previewWindow) {

            throw new Error(

                "Le navigateur a bloqué la fenêtre d'aperçu."

            );

        }

        previewWindow.document.open();

        previewWindow.document.write(

            this.createPreviewDocument(html)

        );

        previewWindow.document.close();

        return {

            success: true,

            format: "docx-preview",

            openedAt: new Date(),

        };

    }

    createPreviewDocument(html) {

        return `<!doctype html>
<html lang="${this.escapeHtmlAttribute(
            this.configuration.language
        )}">
<head>
    <meta charset="utf-8" />
    <title>${this.escapeHtml(
        this.configuration.title
    )}</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 32px;
            background: #e5e7eb;
            font-family:
                ${this.escapeCssValue(
                    this.configuration.defaultFont
                )},
                Arial,
                sans-serif;
        }

        .word-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 25mm;
            color: #111827;
            background: #ffffff;
            box-shadow:
                0 10px 30px
                rgba(0, 0, 0, 0.18);
            font-size:
                ${Number(
                    this.configuration.defaultFontSize
                ) || 11}pt;
            line-height: 1.5;
        }

        img {
            max-width: 100%;
            height: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th,
        td {
            padding: 6px;
            border: 1px solid #9ca3af;
        }

        pre {
            padding: 12px;
            overflow: auto;
            background: #f3f4f6;
        }

        blockquote {
            margin-left: 0;
            padding-left: 16px;
            color: #4b5563;
            border-left: 4px solid #9ca3af;
        }
    </style>
</head>

<body>
    <main class="word-page">
        ${html}
    </main>
</body>
</html>`;

    }

    /* ======================================================
       INFORMATIONS
    ====================================================== */

    getLastExport() {

        return this.lastExport;

    }

    getDocument() {

        return this.document;

    }

    /* ======================================================
       MÉTADONNÉES
    ====================================================== */

    setTitle(title) {

        this.configuration.title =

            String(title || "Document");

    }

    getTitle() {

        return this.configuration.title;

    }

    setCreator(creator) {

        this.configuration.creator =

            String(creator || "MACEVO");

    }

    getCreator() {

        return this.configuration.creator;

    }

    setFileName(fileName) {

        this.configuration.fileName =

            this.normalizeFileName(fileName);

    }

    getFileName() {

        return this.configuration.fileName;

    }

    addKeyword(keyword) {

        const normalizedKeyword =

            String(keyword ?? "").trim();

        if (

            normalizedKeyword &&

            !this.configuration.keywords.includes(

                normalizedKeyword

            )

        ) {

            this.configuration.keywords.push(

                normalizedKeyword

            );

        }

    }

    removeKeyword(keyword) {

        this.configuration.keywords =

            this.configuration.keywords.filter(

                (item) => item !== keyword

            );

    }

    getKeywords() {

        return [

            ...this.configuration.keywords,

        ];

    }

    /* ======================================================
       UTILITAIRES
    ====================================================== */

    getAlignment(alignment) {

        return ALIGNMENTS[alignment] ??

            undefined;

    }

    pointsToHalfPoints(points) {

        const numericValue = Number(points);

        if (!Number.isFinite(numericValue)) {

            return undefined;

        }

        return Math.max(

            1,

            Math.round(numericValue * 2)

        );

    }

    normalizeFileName(fileName) {

        const normalized = String(

            fileName || "document.docx"

        )

            .trim()

            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");

        if (!normalized) {

            return "document.docx";

        }

        return normalized

            .toLowerCase()

            .endsWith(".docx")

            ? normalized

            : `${normalized}.docx`;

    }

    normalizeHexColor(color) {

        const normalized = String(

            color ?? ""

        )

            .replace("#", "")

            .trim()

            .substring(0, 6)

            .toUpperCase();

        return this.isHexColor(normalized)

            ? normalized

            : "000000";

    }

    isHexColor(color) {

        return /^[0-9A-F]{6}$/i.test(

            String(color ?? "")

                .replace("#", "")

                .trim()

        );

    }

    isValidLink(value) {

        try {

            const url = new URL(

                value,

                window.location.origin

            );

            return [

                "http:",

                "https:",

                "mailto:",

                "tel:",

            ].includes(url.protocol);

        } catch {

            return false;

        }

    }

    escapeHtml(value) {

        return String(value ?? "")

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }

    escapeHtmlAttribute(value) {

        return this.escapeHtml(value)

            .replace(/`/g, "&#096;");

    }

    escapeCssValue(value) {

        return String(value ?? "Calibri")

            .replace(/["'`;{}]/g, "");

    }

    /* ======================================================
       RÉINITIALISATION
    ====================================================== */

    reset() {

        this.document = "";

        this.lastExport = null;

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const docxEngine = new DocxEngine();

/* ==========================================================
   EXPORT
========================================================== */

export default docxEngine;
