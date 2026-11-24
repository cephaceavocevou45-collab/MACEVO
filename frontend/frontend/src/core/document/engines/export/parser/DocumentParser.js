/**
 * ============================================================
 * MACEVO
 *
 * ------------------------------------------------------------
 * Fichier : DocumentParser.js
 * Description : Convertit le HTML de TipTap en structure
 *               intermédiaire utilisable par les moteurs
 *               DOCX, LaTeX, HTML, Markdown et PDF.
 * Version : 2.0.0
 * Statut : Fonctionnel
 * ============================================================
 */

class DocumentParser {

    /* ======================================================
       ANALYSE PRINCIPALE
    ====================================================== */

    parse(html = "") {

        if (typeof html !== "string") {

            throw new TypeError(
                "DocumentParser.parse attend une chaîne HTML."
            );

        }

        const container = document.createElement("div");

        container.innerHTML = html;

        const blocks = [];

        container.childNodes.forEach((node) => {

            const parsedNodes = this.parseBlockNode(node);

            if (Array.isArray(parsedNodes)) {

                blocks.push(...parsedNodes);

            } else if (parsedNodes) {

                blocks.push(parsedNodes);

            }

        });

        return blocks;

    }

    /* ======================================================
       NŒUDS DE BLOC
    ====================================================== */

    parseBlockNode(node) {

        if (!node) {

            return null;

        }

        if (node.nodeType === Node.TEXT_NODE) {

            const text = node.textContent ?? "";

            if (!text.trim()) {

                return null;

            }

            return {

                type: "paragraph",

                content: [

                    this.createTextNode(text),

                ],

            };

        }

        if (node.nodeType !== Node.ELEMENT_NODE) {

            return null;

        }

        const tag = node.tagName.toLowerCase();

        switch (tag) {

            case "p":

                return this.parseParagraph(node);

            case "h1":

            case "h2":

            case "h3":

            case "h4":

            case "h5":

            case "h6":

                return this.parseHeading(
                    node,
                    Number(tag.substring(1))
                );

            case "blockquote":

                return this.parseBlockquote(node);

            case "pre":

                return this.parseCodeBlock(node);

            case "ul":

                return this.parseList(node, "bullet");

            case "ol":

                return this.parseList(node, "ordered");

            case "hr":

                return {

                    type: "horizontalRule",

                };

            case "br":

                return {

                    type: "paragraph",

                    content: [

                        this.createTextNode(""),

                    ],

                };

            case "div":

            case "section":

            case "article":

            case "main":

            case "header":

            case "footer":

                return this.parseContainer(node);

            default:

                return this.parseFallbackBlock(node);

        }

    }

    /* ======================================================
       CONTENEURS
    ====================================================== */

    parseContainer(node) {

        const blocks = [];

        node.childNodes.forEach((child) => {

            const parsed = this.parseBlockNode(child);

            if (Array.isArray(parsed)) {

                blocks.push(...parsed);

            } else if (parsed) {

                blocks.push(parsed);

            }

        });

        if (blocks.length > 0) {

            return blocks;

        }

        const content = this.parseInlineChildren(node);

        if (content.length === 0) {

            return null;

        }

        return {

            type: "paragraph",

            content,

        };

    }

    parseFallbackBlock(node) {

        const blockTags = new Set([

            "address",
            "aside",
            "details",
            "dialog",
            "figure",
            "figcaption",
            "nav",
            "summary",

        ]);

        if (blockTags.has(node.tagName.toLowerCase())) {

            return this.parseContainer(node);

        }

        const content = this.parseInlineChildren(node);

        if (content.length === 0) {

            return null;

        }

        return {

            type: "paragraph",

            content,

        };

    }

    /* ======================================================
       PARAGRAPHES ET TITRES
    ====================================================== */

    parseParagraph(node) {

        return {

            type: "paragraph",

            alignment: this.getAlignment(node),

            content: this.parseInlineChildren(node),

        };

    }

    parseHeading(node, level) {

        return {

            type: "heading",

            level: this.normalizeHeadingLevel(level),

            alignment: this.getAlignment(node),

            content: this.parseInlineChildren(node),

        };

    }

    parseBlockquote(node) {

        return {

            type: "blockquote",

            alignment: this.getAlignment(node),

            content: this.parseInlineChildren(node),

        };

    }

    parseCodeBlock(node) {

        return {

            type: "codeBlock",

            language:
                node.getAttribute("data-language") ??
                node.querySelector("code")?.className
                    ?.replace(/^language-/, "") ??
                "",

            text:
                node.querySelector("code")?.textContent ??
                node.textContent ??
                "",

        };

    }

    /* ======================================================
       LISTES
    ====================================================== */

    parseList(node, listType) {

        const items = [];

        Array.from(node.children).forEach((child) => {

            if (child.tagName.toLowerCase() !== "li") {

                return;

            }

            items.push(this.parseListItem(child));

        });

        return {

            type: "list",

            listType,

            start:
                listType === "ordered"
                    ? this.parsePositiveInteger(
                        node.getAttribute("start"),
                        1
                    )
                    : null,

            items,

        };

    }

    parseListItem(node) {

        const content = [];

        const nestedLists = [];

        node.childNodes.forEach((child) => {

            if (
                child.nodeType === Node.ELEMENT_NODE &&
                ["ul", "ol"].includes(
                    child.tagName.toLowerCase()
                )
            ) {

                nestedLists.push(

                    this.parseList(
                        child,
                        child.tagName.toLowerCase() === "ol"
                            ? "ordered"
                            : "bullet"
                    )

                );

                return;

            }

            const parsedInline = this.parseInlineNode(child);

            if (Array.isArray(parsedInline)) {

                content.push(...parsedInline);

            } else if (parsedInline) {

                content.push(parsedInline);

            }

        });

        return {

            type: "listItem",

            content: this.removeTrailingWhitespace(content),

            children: nestedLists,

        };

    }

    /* ======================================================
       CONTENU INLINE
    ====================================================== */

    parseInlineChildren(node, inheritedMarks = {}) {

        const content = [];

        node.childNodes.forEach((child) => {

            const parsed = this.parseInlineNode(

                child,

                inheritedMarks

            );

            if (Array.isArray(parsed)) {

                content.push(...parsed);

            } else if (parsed) {

                content.push(parsed);

            }

        });

        return this.mergeAdjacentTextNodes(content);

    }

    parseInlineNode(node, inheritedMarks = {}) {

        if (!node) {

            return null;

        }

        if (node.nodeType === Node.TEXT_NODE) {

            const text = node.textContent ?? "";

            if (text.length === 0) {

                return null;

            }

            return this.createTextNode(

                text,

                inheritedMarks

            );

        }

        if (node.nodeType !== Node.ELEMENT_NODE) {

            return null;

        }

        const tag = node.tagName.toLowerCase();

        if (tag === "br") {

            return {

                type: "lineBreak",

            };

        }

        if (tag === "img") {

            return this.parseImage(node);

        }

        const marks = this.collectMarks(

            node,

            inheritedMarks

        );

        if (tag === "a") {

            const children = this.parseInlineChildren(

                node,

                {

                    ...marks,

                    link: {

                        href:
                            node.getAttribute("href") ?? "",

                        target:
                            node.getAttribute("target") ?? "",

                        title:
                            node.getAttribute("title") ?? "",

                    },

                }

            );

            return children;

        }

        return this.parseInlineChildren(

            node,

            marks

        );

    }

    /* ======================================================
       FORMATS DE TEXTE
    ====================================================== */

    collectMarks(node, inheritedMarks = {}) {

        const marks = {

            ...inheritedMarks,

        };

        const tag = node.tagName.toLowerCase();

        if (tag === "strong" || tag === "b") {

            marks.bold = true;

        }

        if (tag === "em" || tag === "i") {

            marks.italic = true;

        }

        if (tag === "u") {

            marks.underline = true;

        }

        if (

            tag === "s" ||
            tag === "strike" ||
            tag === "del"

        ) {

            marks.strike = true;

        }

        if (tag === "sub") {

            marks.subscript = true;

            delete marks.superscript;

        }

        if (tag === "sup") {

            marks.superscript = true;

            delete marks.subscript;

        }

        if (tag === "code") {

            marks.code = true;

        }

        if (tag === "mark") {

            marks.highlight =
                node.style.backgroundColor ||
                node.getAttribute("data-color") ||
                "yellow";

        }

        this.applyInlineStyleMarks(

            node,

            marks

        );

        return marks;

    }

    applyInlineStyleMarks(node, marks) {

        const style = node.style;

        if (!style) {

            return;

        }

        const fontWeight = style.fontWeight;

        if (

            fontWeight === "bold" ||
            Number(fontWeight) >= 600

        ) {

            marks.bold = true;

        }

        if (style.fontStyle === "italic") {

            marks.italic = true;

        }

        const decoration =

            style.textDecorationLine ||
            style.textDecoration ||
            "";

        if (decoration.includes("underline")) {

            marks.underline = true;

        }

        if (decoration.includes("line-through")) {

            marks.strike = true;

        }

        if (style.color) {

            marks.color = this.normalizeColor(

                style.color

            );

        }

        if (style.backgroundColor) {

            marks.highlight = this.normalizeColor(

                style.backgroundColor

            );

        }

        if (style.fontFamily) {

            marks.fontFamily = style.fontFamily

                .split(",")[0]

                .replace(/["']/g, "")

                .trim();

        }

        if (style.fontSize) {

            marks.fontSize =

                this.parseCssSizeToPoints(

                    style.fontSize

                );

        }

    }

    /* ======================================================
       IMAGES
    ====================================================== */

    parseImage(node) {

        return {

            type: "image",

            src:
                node.getAttribute("src") ?? "",

            alt:
                node.getAttribute("alt") ?? "",

            title:
                node.getAttribute("title") ?? "",

            width: this.parseDimension(

                node.getAttribute("width") ||
                node.style.width

            ),

            height: this.parseDimension(

                node.getAttribute("height") ||
                node.style.height

            ),

        };

    }

    /* ======================================================
       CRÉATION DES NŒUDS
    ====================================================== */

    createTextNode(text, marks = {}) {

        return {

            type: "text",

            text,

            marks: {

                ...marks,

            },

        };

    }

    /* ======================================================
       ALIGNEMENT
    ====================================================== */

    getAlignment(node) {

        const alignment =

            node.style?.textAlign ||
            node.getAttribute?.("align") ||
            "";

        const allowed = new Set([

            "left",
            "center",
            "right",
            "justify",

        ]);

        return allowed.has(alignment)

            ? alignment

            : null;

    }

    /* ======================================================
       UTILITAIRES
    ====================================================== */

    normalizeHeadingLevel(level) {

        const numericLevel = Number(level);

        if (!Number.isFinite(numericLevel)) {

            return 1;

        }

        return Math.min(

            6,

            Math.max(1, numericLevel)

        );

    }

    parsePositiveInteger(value, fallback = null) {

        const parsed = Number.parseInt(

            value,

            10

        );

        return Number.isInteger(parsed) && parsed > 0

            ? parsed

            : fallback;

    }

    parseDimension(value) {

        if (!value) {

            return null;

        }

        const parsed = Number.parseFloat(value);

        return Number.isFinite(parsed)

            ? parsed

            : null;

    }

    parseCssSizeToPoints(value) {

        if (!value) {

            return null;

        }

        const parsed = Number.parseFloat(value);

        if (!Number.isFinite(parsed)) {

            return null;

        }

        if (value.endsWith("px")) {

            return parsed * 0.75;

        }

        if (value.endsWith("pt")) {

            return parsed;

        }

        if (value.endsWith("rem")) {

            return parsed * 12;

        }

        if (value.endsWith("em")) {

            return parsed * 12;

        }

        return parsed;

    }

    normalizeColor(value) {

        if (!value) {

            return null;

        }

        const color = value.trim();

        const rgbMatch = color.match(

            /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i

        );

        if (rgbMatch) {

            return [

                Number(rgbMatch[1]),
                Number(rgbMatch[2]),
                Number(rgbMatch[3]),

            ]

                .map((component) =>

                    Math.max(

                        0,

                        Math.min(255, component)

                    )

                        .toString(16)

                        .padStart(2, "0")

                )

                .join("")

                .toUpperCase();

        }

        if (color.startsWith("#")) {

            const hexadecimal =

                color.substring(1);

            if (hexadecimal.length === 3) {

                return hexadecimal

                    .split("")

                    .map((character) =>

                        character + character

                    )

                    .join("")

                    .toUpperCase();

            }

            return hexadecimal

                .substring(0, 6)

                .toUpperCase();

        }

        return color;

    }

    mergeAdjacentTextNodes(nodes) {

        const merged = [];

        nodes.forEach((node) => {

            if (!node) {

                return;

            }

            const previous =

                merged[merged.length - 1];

            if (

                previous?.type === "text" &&
                node.type === "text" &&
                this.areMarksEqual(
                    previous.marks,
                    node.marks
                )

            ) {

                previous.text += node.text;

                return;

            }

            merged.push(node);

        });

        return merged;

    }

    areMarksEqual(first = {}, second = {}) {

        return JSON.stringify(first) ===

            JSON.stringify(second);

    }

    removeTrailingWhitespace(nodes) {

        if (nodes.length === 0) {

            return nodes;

        }

        const result = [...nodes];

        const last = result[result.length - 1];

        if (last?.type === "text") {

            last.text = last.text.replace(

                /\s+$/,

                ""

            );

            if (!last.text) {

                result.pop();

            }

        }

        return result;

    }

}

/* ==========================================================
   INSTANCE UNIQUE
========================================================== */

const documentParser = new DocumentParser();

/* ==========================================================
   EXPORT
========================================================== */

export default documentParser;