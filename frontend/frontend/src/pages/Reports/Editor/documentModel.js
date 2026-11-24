/**
 * MACEVO — DOCUMENT MODEL
 * Version 3.3.0
 *
 * Structure Django -> document model -> HTML.
 *
 * Principes:
 * - report.structure est la source de vérité ;
 * - aucune donnée personnelle fictive ;
 * - hiérarchie 1 / 1.1 / 1.1.1 ;
 * - le corps du document reste un flux continu ;
 * - seules la couverture et la table des matières peuvent être
 *   explicitement présentées comme pages dédiées ;
 * - la pagination physique A4 appartient à PaginationPlus ;
 * - le design visuel appartient au template / renderer.
 */

import {
    buildAcademicModuleContent,
    normalizeReport,
    escapeHtml,
    escapeHtmlAttribute,
} from "./reportContentEngine";

const FRONT_MATTER_MODULES = new Set([
    "cover-page",
    "dedication",
    "acknowledgements",
    "abstract",
    "abstract-second-language",
    "table-of-contents",
    "list-of-figures",
    "list-of-tables",
    "abbreviations",
    "glossary",
]);

const BACK_MATTER_MODULES = new Set([
    "references",
    "appendices",
]);

const METHODOLOGY_MODULES = new Set([
    "methodology",
    "research-design",
    "study-population",
    "data-collection",
    "data-analysis",
    "quantitative-methodology",
    "qualitative-methodology",
    "mixed-methodology",
    "experimental-methodology",
    "case-study-methodology",
    "ethics",
]);

const COVER_MODULES = new Set(["cover-page"]);

const MODULE_ID_ALIASES = {
    "page-de-garde": "cover-page",
    "page_de_garde": "cover-page",
    "page-de-garde-academique": "cover-page",
    "cover": "cover-page",
    "dedicace": "dedication",
    "dédicace": "dedication",
    "remerciements": "acknowledgements",
    "resume": "abstract",
    "résumé": "abstract",
    "table-des-matieres": "table-of-contents",
    "table_des_matieres": "table-of-contents",
    "table-des-matières": "table-of-contents",
    "table_des_matières": "table-of-contents",
    "introduction-generale": "introduction",
    "conclusion-generale": "conclusion",
    "references-bibliographiques": "references",
    "références-bibliographiques": "references",
    "annexes": "appendices",
};

function canonicalModuleId(value) {
    const raw = clean(value);
    if (!raw) return "";
    const normalized = raw.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    return MODULE_ID_ALIASES[normalized] || normalized;
}

function canonicalizeStructureNode(node) {
    if (!node || typeof node !== "object") return node;
    const raw = node.id || node.moduleId || node.module_id || node.title || node.label || "";
    return {
        ...node,
        id: canonicalModuleId(raw) || node.id,
        children: normalizeArray(node.children).map(canonicalizeStructureNode),
    };
}

const NON_NUMBERED_MODULES = new Set([
    ...FRONT_MATTER_MODULES,
    ...BACK_MATTER_MODULES,
]);

function clean(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\s+/g, " ").trim();
}

function normalizeId(value, fallback = "module") {
    const normalized = clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/gi, "-")
        .replace(/^-+|-+$/g, "");

    return normalized || fallback;
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeOrder(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function getInstanceId(node, index = 0) {
    if (node?.instanceId) return clean(node.instanceId);
    if (node?.instance_id) return clean(node.instance_id);

    const id = normalizeId(
        node?.id || node?.moduleId || node?.module_id,
        `module-${index + 1}`
    );

    return `${id}__${index + 1}`;
}

function classifyModule(node) {
    const id = normalizeId(
        node?.id || node?.moduleId || node?.module_id || ""
    );

    if (COVER_MODULES.has(id)) return "cover";
    if (FRONT_MATTER_MODULES.has(id)) return "front-matter";
    if (BACK_MATTER_MODULES.has(id)) return "back-matter";
    if (id === "methodology") return "methodology";
    if (METHODOLOGY_MODULES.has(id)) return "methodology-child";
    return "chapter";
}

function getNodeTitle(node) {
    return clean(
        node?.title ||
        node?.label ||
        node?.name ||
        node?.heading ||
        node?.moduleTitle ||
        node?.module_name ||
        ""
    );
}

function normalizeStructureNode(node, index = 0) {
    if (!node || typeof node !== "object") return null;

    const rawId = node.id || node.moduleId || node.module_id || node.title || node.label || `module-${index + 1}`;
    const id = canonicalModuleId(rawId) || normalizeId(rawId, `module-${index + 1}`);

    const children = normalizeArray(node.children)
        .map((child, childIndex) =>
            normalizeStructureNode(child, childIndex)
        )
        .filter(Boolean);

    return {
        ...node,
        id,
        instanceId: getInstanceId(node, index),
        title: getNodeTitle(node),
        order: normalizeOrder(node.order, index + 1),
        required: Boolean(node.required),
        removable:
            node.removable !== undefined
                ? Boolean(node.removable)
                : true,
        recommended:
            node.recommended !== undefined
                ? Boolean(node.recommended)
                : false,
        kind:
            node.kind ||
            (id === "methodology" ? "container" : "section"),
        children,
    };
}

function normalizeStructure(structure) {
    return normalizeArray(structure)
        .map(canonicalizeStructureNode)
        .map((node, index) => normalizeStructureNode(node, index))
        .filter(Boolean)
        .sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.id.localeCompare(b.id);
        });
}

function buildMetadata(report = {}) {
    const normalizedReport = normalizeReport(report);

    const author =
        clean(normalizedReport.author_name) ||
        clean(normalizedReport.full_name) ||
        clean(normalizedReport.student) ||
        clean(normalizedReport.author) ||
        clean(normalizedReport?.author?.full_name) ||
        clean(normalizedReport?.author?.name);

    return {
        title: clean(normalizedReport.title),
        author,
        institution: clean(normalizedReport.institution),
        faculty: clean(normalizedReport.faculty),
        department: clean(normalizedReport.department),
        program: clean(normalizedReport.program),
        specialty: clean(normalizedReport.specialty),
        scientificField:
            clean(normalizedReport.scientific_field) ||
            clean(normalizedReport.scientificField),
        academicLevel:
            clean(normalizedReport.academic_level) ||
            clean(normalizedReport.academicLevel),
        reportType:
            clean(normalizedReport.report_type) ||
            clean(normalizedReport.reportType),
        studyType:
            clean(normalizedReport.study_type) ||
            clean(normalizedReport.studyType),
        country: clean(normalizedReport.country),
        academicYear:
            clean(normalizedReport.academic_year) ||
            clean(normalizedReport.academicYear),
        supervisor: clean(normalizedReport.supervisor),
        language: clean(normalizedReport.language),
        citationStyle:
            clean(normalizedReport.citation_style) ||
            clean(normalizedReport.citationStyle),
        referenceLanguage:
            clean(normalizedReport.reference_language) ||
            clean(normalizedReport.referenceLanguage),
    };
}

function buildNodeContent(node, report, number) {
    if (!node || typeof buildAcademicModuleContent !== "function") {
        return [];
    }

    const content = buildAcademicModuleContent(node, report, number);
    return Array.isArray(content) ? content : [];
}

function buildNode(node, report, number = null, depth = 0) {
    if (!node) return null;

    const type = classifyModule(node);

    const children = normalizeArray(node.children)
        .map((child, index) =>
            buildNode(
                child,
                report,
                number ? `${number}.${index + 1}` : null,
                depth + 1
            )
        )
        .filter(Boolean);

    return {
        id: node.id,
        instanceId: node.instanceId,
        title: node.title,
        type,
        kind: node.kind || "section",
        number,
        depth,
        order: node.order,
        required: node.required,
        removable: node.removable,
        recommended: node.recommended,
        content: buildNodeContent(node, report, number),
        children,
    };
}

function buildCover(structure, report, metadata) {
    const coverNode = structure.find(node => node.id === "cover-page");
    if (!coverNode) return null;

    return {
        id: coverNode.id,
        instanceId: coverNode.instanceId,
        type: "cover",
        title: metadata.title,
        metadata: {
            institution: metadata.institution,
            faculty: metadata.faculty,
            department: metadata.department,
            program: metadata.program,
            specialty: metadata.specialty,
            author: metadata.author,
            supervisor: metadata.supervisor,
            scientificField: metadata.scientificField,
            academicLevel: metadata.academicLevel,
            reportType: metadata.reportType,
            academicYear: metadata.academicYear,
            country: metadata.country,
        },
    };
}

function buildFrontMatter(nodes, report) {
    return nodes
        .filter(
            node =>
                FRONT_MATTER_MODULES.has(node.id) &&
                !COVER_MODULES.has(node.id)
        )
        .map(node => ({
            id: node.id,
            instanceId: node.instanceId,
            title: node.title,
            type: "front-matter",
            content: buildNodeContent(node, report, null),
            children: [],
        }));
}

function isNumberedChapter(node) {
    return Boolean(node) && !NON_NUMBERED_MODULES.has(node.id);
}

function buildChapterNode(node, report, number, depth = 0) {
    const children = normalizeArray(node.children)
        .map((child, index) =>
            buildChapterNode(
                child,
                report,
                `${number}.${index + 1}`,
                depth + 1
            )
        )
        .filter(Boolean);

    return {
        id: node.id,
        instanceId: node.instanceId,
        title: node.title,
        type: node.id === "methodology" ? "methodology" : "chapter",
        number,
        depth,
        order: node.order,
        required: node.required,
        removable: node.removable,
        recommended: node.recommended,
        content: buildNodeContent(node, report, number),
        children,
    };
}

function buildChapters(nodes, report) {
    let chapterNumber = 0;

    return nodes
        .filter(isNumberedChapter)
        .map(node => {
            chapterNumber += 1;
            return buildChapterNode(
                node,
                report,
                String(chapterNumber),
                0
            );
        });
}

function buildBackMatter(nodes, report) {
    return nodes
        .filter(node => BACK_MATTER_MODULES.has(node.id))
        .map(node => ({
            id: node.id,
            instanceId: node.instanceId,
            title: node.title,
            type: "back-matter",
            content: buildNodeContent(node, report, null),
            children: normalizeArray(node.children)
                .map((child, index) =>
                    buildNode(child, report, null, index + 1)
                )
                .filter(Boolean),
        }));
}

function flattenNodes(nodes, result = []) {
    normalizeArray(nodes).forEach(node => {
        result.push(node);
        if (Array.isArray(node.children)) {
            flattenNodes(node.children, result);
        }
    });
    return result;
}

function createTableOfContents(chapters) {
    const entries = [];

    function visit(node) {
        if (!node) return;

        entries.push({
            id: node.id,
            instanceId: node.instanceId,
            number: node.number,
            title: node.title,
            depth: node.depth,
            page: null,
        });

        normalizeArray(node.children).forEach(visit);
    }

    normalizeArray(chapters).forEach(visit);
    return entries;
}

function collectContentElements(nodes, type, result = []) {
    normalizeArray(nodes).forEach(node => {
        normalizeArray(node.content).forEach(element => {
            if (element?.type === type) {
                result.push({
                    ...element,
                    moduleId: node.id,
                    instanceId: node.instanceId,
                    sectionNumber: node.number,
                    sectionTitle: node.title,
                });
            }

            normalizeArray(element?.children).forEach(child => {
                if (child?.type === type) {
                    result.push({
                        ...child,
                        moduleId: node.id,
                        instanceId: node.instanceId,
                        sectionNumber: node.number,
                        sectionTitle: node.title,
                    });
                }
            });
        });

        if (Array.isArray(node.children)) {
            collectContentElements(node.children, type, result);
        }
    });

    return result;
}

const createFigureList = nodes =>
    collectContentElements(nodes, "figure");

const createSchemaList = nodes =>
    collectContentElements(nodes, "schema");

const createTableList = nodes =>
    collectContentElements(nodes, "table");

const createEquationList = nodes =>
    collectContentElements(nodes, "equation");

const createReferenceList = nodes =>
    collectContentElements(nodes, "reference");

function buildDocumentModel(report = {}, structure = null) {
    const normalizedReport = normalizeReport(report);

    const sourceStructure =
        structure ??
        normalizedReport.structure ??
        [];

    const normalizedStructure =
        normalizeStructure(sourceStructure);

    const metadata =
        buildMetadata(normalizedReport);

    const cover =
        buildCover(
            normalizedStructure,
            normalizedReport,
            metadata
        );

    const frontMatter =
        buildFrontMatter(
            normalizedStructure,
            normalizedReport
        );

    const chapters =
        buildChapters(
            normalizedStructure,
            normalizedReport
        );

    const backMatter =
        buildBackMatter(
            normalizedStructure,
            normalizedReport
        );

    const tableOfContents =
        createTableOfContents(chapters);

    // Toutes les parties du document participent aux listes globales.
    // Les références ne sont donc plus limitées aux chapitres.
    const contentNodes = [
        ...frontMatter,
        ...chapters,
        ...backMatter,
    ];

    return {
        version: "3.3.0",

        metadata,

        source: {
            reportId:
                normalizedReport.id ??
                normalizedReport.pk ??
                null,
            reportType: metadata.reportType,
            studyType: metadata.studyType,
            structure: normalizedStructure,
        },

        cover,
        frontMatter,
        chapters,
        backMatter,
        tableOfContents,

        figures: createFigureList(contentNodes),
        schemas: createSchemaList(contentNodes),
        tables: createTableList(contentNodes),
        equations: createEquationList(contentNodes),
        references: createReferenceList(contentNodes),
    };
}

function findDocumentNode(model, identifier) {
    if (!model) return null;

    const target = clean(identifier);

    const allNodes = flattenNodes([
        ...(model.frontMatter || []),
        ...(model.chapters || []),
        ...(model.backMatter || []),
    ]);

    return (
        allNodes.find(node => node.id === target) ||
        allNodes.find(node => node.instanceId === target) ||
        null
    );
}

/* ============================================================
   RENDU DES ÉLÉMENTS DE CONTENU
   ============================================================ */

function normalizeRenderableValue(value) {
    if (value === null || value === undefined) return "";

    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    if (typeof value === "object") {
        return (
            value.html ||
            value.text ||
            value.value ||
            value.label ||
            ""
        );
    }

    return String(value);
}

function renderInlineValue(value) {
    const raw = normalizeRenderableValue(value);

    if (!raw) return "";

    /*
     * Les moteurs académiques peuvent déjà fournir du HTML.
     * Dans ce cas, il ne faut surtout pas l'échapper.
     */
    if (/<[a-z][\s\S]*>/i.test(raw)) {
        return raw;
    }

    return escapeHtml(raw);
}

function normalizeTableRow(row) {
    if (Array.isArray(row)) {
        return row;
    }

    if (row && typeof row === "object") {
        if (Array.isArray(row.cells)) return row.cells;
        if (Array.isArray(row.values)) return row.values;
        if (Array.isArray(row.columns)) return row.columns;

        return Object.values(row);
    }

    return [row];
}

function parseMarkdownTable(value) {
    if (!value || typeof value !== "string") return null;

    const normalized = value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<\/p>/gi, "")
        .trim();

    const lines = normalized
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length < 2) return null;

    const isSeparator = line => {
        const cells = line
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map(cell => cell.trim());

        return (
            cells.length > 0 &&
            cells.every(cell => /^:?-{1,}:?$/.test(cell))
        );
    };

    let separatorIndex = -1;

    for (let index = 1; index < lines.length; index += 1) {
        if (isSeparator(lines[index])) {
            separatorIndex = index;
            break;
        }
    }

    if (separatorIndex < 1) return null;

    const parseRow = line =>
        line
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map(cell => cell.trim());

    const headers = parseRow(lines[separatorIndex - 1]);
    const rows = lines
        .slice(separatorIndex + 1)
        .filter(line => line.includes("|"))
        .map(parseRow);

    if (!headers.length || !rows.length) return null;

    return {
        type: "table",
        headers,
        rows,
    };
}

function renderMarkdownInline(value) {
    let text = normalizeRenderableValue(value);
    if (!text) return "";
    if (/<[a-z][\s\S]*>/i.test(text)) return text;
    text = escapeHtml(text);
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
    text = text.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return text.replace(/\n/g, "<br>");
}

function renderMarkdownBlocks(value) {
    if (!value || typeof value !== "string") return "";
    const source = value.replace(/\r\n?/g, "\n").replace(/&nbsp;/gi, " ").trim();
    if (!source) return "";
    if (/<(?:p|h[1-6]|table|ul|ol|figure|div|section|article|blockquote)\b/i.test(source)) return source;
    const lines = source.split("\n");
    const output = [];
    let paragraph = [];
    let list = null;
    const flushParagraph = () => { if (!paragraph.length) return; const text = paragraph.join(" ").trim(); if (text) output.push(`<p>${renderMarkdownInline(text)}</p>`); paragraph=[]; };
    const flushList = () => { if (!list || !list.items.length) return; const tag=list.ordered?"ol":"ul"; output.push(`<${tag}>${list.items.map(i=>`<li>${renderMarkdownInline(i)}</li>`).join("")}</${tag}>`); list=null; };
    for (const rawLine of lines) {
        const line=rawLine.trim();
        if (!line) { flushParagraph(); flushList(); continue; }
        const heading=line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) { flushParagraph(); flushList(); const level=Math.min(6,heading[1].length); output.push(`<h${level}>${renderMarkdownInline(heading[2])}</h${level}>`); continue; }
        const ordered=line.match(/^\d+[.)]\s+(.+)$/); const unordered=line.match(/^[-*+]\s+(.+)$/);
        if (ordered || unordered) { flushParagraph(); const isOrdered=!!ordered; if(!list || list.ordered!==isOrdered){flushList();list={ordered:isOrdered,items:[]};} list.items.push((ordered||unordered)[1]); continue; }
        paragraph.push(line);
    }
    flushParagraph(); flushList(); return output.join("");
}

function renderParagraph(element) {
    const raw = normalizeRenderableValue(
        element?.html || element?.text || element?.value || ""
    ).trim();

    if (!raw) return "";

    /*
     * Certains modules historiques génèrent encore un tableau Markdown
     * dans un élément paragraph. On le convertit ici en véritable tableau
     * HTML afin que TipTap ne l'affiche plus comme du texte `| ... |`.
     */
    const markdownTable = parseMarkdownTable(raw);
    if (markdownTable) {
        return renderTable(markdownTable);
    }

    if (/^#{1,6}\s+|(^|\n)\s*(?:[-*+]\s+|\d+[.)]\s+)/m.test(raw)) {
        return renderMarkdownBlocks(raw);
    }

    /*
     * Ne pas enfermer un bloc HTML complet dans <p> : cela produirait
     * notamment <p><table>...</table></p>, HTML invalide et mal interprété
     * par TipTap.
     */
    if (
        /^\s*<(table|figure|div|section|article|ul|ol|dl|blockquote|pre)\b/i.test(
            raw
        )
    ) {
        return raw;
    }

    return `
        <p class="macevo-paragraph">
            ${renderMarkdownInline(raw)}
        </p>
    `;
}

function renderHeading(element) {
    const level = Math.min(
        Math.max(Number(element.level) || 2, 2),
        6
    );

    const raw = normalizeRenderableValue(
        element.text || element.html || ""
    ).trim();
    const markdownMatch = raw.match(/^(#{1,6})\s+(.+)$/);
    const content = renderMarkdownInline(
        markdownMatch ? markdownMatch[2] : raw
    );

    return `
        <h${level} class="macevo-content-heading">
            ${content}
        </h${level}>
    `;
}

function renderList(element) {
    const isOrdered =
        element?.type === "ordered-list" ||
        element?.ordered === true ||
        element?.ordered === "true";

    const tag = isOrdered ? "ol" : "ul";

    const sourceItems =
        normalizeArray(element?.items).length > 0
            ? normalizeArray(element.items)
            : normalizeArray(element?.children);

    const items = sourceItems
        .map(item => {
            const value = normalizeRenderableValue(item).trim();
            if (!value) return "";

            if (/<(p|strong|em|span|a|br|code)\b/i.test(value)) {
                return `<li>${value}</li>`;
            }

            return `<li>${escapeHtml(value)}</li>`;
        })
        .filter(Boolean)
        .join("");

    if (!items) return "";

    return `
        <${tag} class="macevo-content-list">
            ${items}
        </${tag}>
    `;
}

function renderTable(element) {
    if (!element) return "";

    /*
     * Un tableau peut arriver sous forme de HTML déjà construit.
     * Nous le conservons tel quel au lieu de le transformer en texte.
     */
    if (
        typeof element.html === "string" &&
        /<table\b/i.test(element.html)
    ) {
        return element.html;
    }

    /*
     * Secours pour les anciens éléments dont le contenu est encore
     * une table Markdown.
     */
    if (
        typeof element.text === "string" ||
        typeof element.value === "string"
    ) {
        const parsed = parseMarkdownTable(
            element.text || element.value
        );

        if (parsed) {
            return renderTable({
                ...parsed,
                title: element.title,
                caption: element.caption,
                source: element.source,
            });
        }
    }

    const headers = normalizeArray(element.headers);
    const rows = normalizeArray(element.rows);

    const headerHtml = headers.length
        ? `
            <thead>
                <tr>
                    ${headers
                        .map(header => `
                            <th>${renderInlineValue(header)}</th>
                        `)
                        .join("")}
                </tr>
            </thead>
        `
        : "";

    const rowsHtml = rows
        .map(row => `
            <tr>
                ${normalizeTableRow(row)
                    .map(cell => `
                        <td>${renderInlineValue(cell)}</td>
                    `)
                    .join("")}
            </tr>
        `)
        .join("");

    if (!headerHtml && !rowsHtml) return "";

    return `
        <figure class="macevo-table-block">
            ${
                element.title
                    ? `<div class="macevo-table-title">
                        ${escapeHtml(element.title)}
                    </div>`
                    : ""
            }

            <div class="macevo-table-wrapper">
                <table class="macevo-table">
                    ${headerHtml}
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>

            ${
                element.caption
                    ? `<figcaption>
                        ${escapeHtml(element.caption)}
                    </figcaption>`
                    : ""
            }

            ${
                element.source
                    ? `<div class="macevo-source">
                        Source : ${escapeHtml(element.source)}
                    </div>`
                    : ""
            }
        </figure>
    `;
}

function renderFigure(element) {
    const image = element.src || element.url || "";
    if (!image) return "";

    return `
        <figure class="macevo-figure-block">
            <img
                src="${escapeHtmlAttribute(image)}"
                alt="${escapeHtmlAttribute(
                    element.alt || element.title || "Figure"
                )}"
            />

            ${
                element.title
                    ? `<div class="macevo-figure-title">
                        ${escapeHtml(element.title)}
                    </div>`
                    : ""
            }

            ${
                element.caption
                    ? `<figcaption>
                        ${escapeHtml(element.caption)}
                    </figcaption>`
                    : ""
            }

            ${
                element.source
                    ? `<div class="macevo-source">
                        Source : ${escapeHtml(element.source)}
                    </div>`
                    : ""
            }
        </figure>
    `;
}

function renderSchema(element) {
    if (!element.html) return "";

    return `
        <figure class="macevo-schema-block">
            <div class="macevo-schema-content">
                ${element.html}
            </div>

            ${
                element.title
                    ? `<div class="macevo-schema-title">
                        ${escapeHtml(element.title)}
                    </div>`
                    : ""
            }

            ${
                element.caption
                    ? `<figcaption>
                        ${escapeHtml(element.caption)}
                    </figcaption>`
                    : ""
            }
        </figure>
    `;
}

function renderEquation(element) {
    const latex = element.latex || element.value || "";
    if (!latex) return "";

    return `
        <div
            class="macevo-equation-block"
            data-macevo-equation="true"
        >
            <div
                class="macevo-equation-expression"
                data-latex="${escapeHtmlAttribute(latex)}"
            >
                ${escapeHtml(latex)}
            </div>

            ${
                element.number
                    ? `<span class="macevo-equation-number">
                        (${escapeHtml(element.number)})
                    </span>`
                    : ""
            }
        </div>
    `;
}

function renderReference(element) {
    if (!element) return "";

    return `
        <div class="macevo-reference-item">
            ${
                element.html ||
                renderMarkdownInline(element.text || "")
            }
        </div>
    `;
}

function renderContentElement(element) {
    if (!element) return "";

    switch (element.type) {
        case "paragraph":
            return renderParagraph(element);
        case "heading":
            return renderHeading(element);
        case "list":
        case "ordered-list":
        case "bullet-list":
            return renderList(element);
        case "table":
            return renderTable(element);
        case "figure":
            return renderFigure(element);
        case "schema":
            return renderSchema(element);
        case "equation":
            return renderEquation(element);
        case "reference":
            return renderReference(element);
        default:
            return element.html || renderMarkdownBlocks(
                normalizeRenderableValue(element.text || element.value || "")
            );
    }
}

function renderContentSequence(elements) {
    const source = normalizeArray(elements);
    if (!source.length) return "";

    const rawValues = source.map(element =>
        normalizeRenderableValue(
            element?.html || element?.text || element?.value || ""
        ).trim()
    );

    const isPipeMarker = value =>
        /^\|.*\|$/.test(value) ||
        /^\|\s*:?-{1,}:?\s*\|$/.test(value);

    const pipeIndexes = rawValues
        .map((value, index) => (value.includes("|") ? index : -1))
        .filter(index => index >= 0);

    /*
     * Ancien moteur : les tableaux ont parfois été aplatis en une suite
     *   | | / | - | / cellule / | | / | - | / cellule ...
     * On reconnaît cette forme et on reconstruit un vrai tableau 2 colonnes.
     */
    if (pipeIndexes.length >= 4) {
        const first = pipeIndexes[0];
        const last = pipeIndexes[pipeIndexes.length - 1];
        const between = rawValues.slice(first + 1, last);
        const cells = between
            .filter(value => value && !isPipeMarker(value) && !/^\|\s*\|$/.test(value))
            .map(value => value.replace(/^\|\s*|\s*\|$/g, "").trim())
            .filter(Boolean);

        if (cells.length >= 2) {
            const before = source.slice(0, first);
            const after = source.slice(last + 1);
            const output = [];

            output.push(
                before
                    .map(renderContentElement)
                    .join("")
            );

            const rows = [];
            for (let index = 0; index + 1 < cells.length; index += 2) {
                rows.push([cells[index], cells[index + 1]]);
            }

            if (rows.length) {
                output.push(
                    renderTable({
                        headers: ["Élément", "Résultat / observation"],
                        rows,
                    })
                );
            }

            output.push(
                after
                    .map(renderContentElement)
                    .join("")
            );

            return output.join("");
        }
    }

    const output = [];
    let tableRows = [];

    const flushPipeTable = () => {
        if (!tableRows.length) return;
        const combined = tableRows.join("\n");
        const parsed = parseMarkdownTable(combined);
        if (parsed) {
            output.push(renderTable(parsed));
        } else {
            output.push(
                tableRows
                    .map(value => `<p class="macevo-paragraph">${renderMarkdownInline(value)}</p>`)
                    .join("")
            );
        }
        tableRows = [];
    };

    for (const element of source) {
        const raw = normalizeRenderableValue(
            element?.html || element?.text || element?.value || ""
        ).trim();
        const isParagraph = element?.type === "paragraph" || !element?.type;
        const looksLikePipe = isParagraph && (raw.startsWith("|") || raw.endsWith("|"));

        if (looksLikePipe) {
            tableRows.push(raw);
            continue;
        }

        flushPipeTable();
        output.push(renderContentElement(element));
    }

    flushPipeTable();
    return output.join("");
}

/* ============================================================
   RENDU DES SOUS-SECTIONS
   ============================================================ */

function renderSection(section) {
    if (!section) return "";

    const content = renderContentSequence(section.content);

    const children = normalizeArray(section.children)
        .map(renderSection)
        .join("");

    return `
        <div
            class="macevo-subsection"
            data-macevo-module="${escapeHtmlAttribute(section.id)}"
            data-macevo-instance="${escapeHtmlAttribute(
                section.instanceId
            )}"
            data-macevo-number="${escapeHtmlAttribute(
                section.number || ""
            )}"
        >
            ${
                section.title
                    ? `
                        <h2 class="macevo-subsection-title">
                            ${
                                section.number
                                    ? `
                                        <span class="macevo-section-number">
                                            ${escapeHtml(section.number)}
                                        </span>
                                    `
                                    : ""
                            }
                            <span>
                                ${escapeHtml(section.title)}
                            </span>
                        </h2>
                    `
                    : ""
            }

            <div class="macevo-section-content">
                ${content}
            </div>

            ${children}
        </div>
    `;
}

/* ============================================================
   RENDU DES CHAPITRES
   ============================================================ */

function renderChapter(chapter) {
    if (!chapter) return "";

    const content = renderContentSequence(chapter.content);

    const children = normalizeArray(chapter.children)
        .map(renderSection)
        .join("");

    return `
        <div
            class="macevo-academic-flow macevo-chapter"
            data-macevo-module="${escapeHtmlAttribute(chapter.id)}"
            data-macevo-instance="${escapeHtmlAttribute(
                chapter.instanceId
            )}"
            data-macevo-number="${escapeHtmlAttribute(
                chapter.number
            )}"
        >
            <header class="macevo-chapter-header">
                <div class="macevo-chapter-number">
                    ${escapeHtml(chapter.number)}
                </div>

                <h1 class="macevo-document-title">
                    ${escapeHtml(chapter.title)}
                </h1>
            </header>

            <div class="macevo-chapter-content">
                ${content}
            </div>

            ${children}
        </div>
    `;
}

/* ============================================================
   RENDU DU DOCUMENT
   ============================================================ */

function renderDocumentModel(
    model,
    renderCover = null,
    renderToc = null
) {
    if (!model) return "";

    let html = "";

    // La couverture reste une page dédiée.
    if (model.cover && typeof renderCover === "function") {
        html += `
            <div
                class="macevo-document-page macevo-cover-page"
                data-macevo-page="cover"
            >
                ${renderCover(model.metadata, model.cover)}
            </div>
        `;
    }

    // Front matter : flux continu.
    // Le TOC est traité séparément ci-dessous.
    normalizeArray(model.frontMatter).forEach(node => {
        if (node.id === "table-of-contents") return;

        const content = renderContentSequence(node.content);

        if (!content) return;

        html += `
            <div
                class="macevo-preliminary-page"
                data-macevo-module="${escapeHtmlAttribute(node.id)}"
            >
                <header class="macevo-preliminary-header">
                    <h1 class="macevo-document-title">
                        ${escapeHtml(node.title)}
                    </h1>
                </header>

                <div class="macevo-preliminary-content">
                    ${content}
                </div>
            </div>
        `;
    });

    // La table des matières peut rester une page dédiée.
    if (
        typeof renderToc === "function" &&
        Array.isArray(model.tableOfContents)
    ) {
        html += `
            <div
                class="macevo-document-page macevo-toc-page"
                data-macevo-page="toc"
            >
                ${renderToc(model)}
            </div>
        `;
    }

    // Corps : flux continu. PaginationPlus crée les pages A4.
    normalizeArray(model.chapters).forEach(chapter => {
        html += renderChapter(chapter);
    });

    // Bibliographie et annexes : flux continu également.
    normalizeArray(model.backMatter).forEach(node => {
        const content = renderContentSequence(node.content);

        html += `
            <div
                class="macevo-back-matter-page"
                data-macevo-module="${escapeHtmlAttribute(node.id)}"
            >
                <header class="macevo-preliminary-header">
                    <h1 class="macevo-document-title">
                        ${escapeHtml(node.title)}
                    </h1>
                </header>

                <div class="macevo-preliminary-content">
                    ${content}
                </div>

                ${normalizeArray(node.children)
                    .map(renderSection)
                    .join("")}
            </div>
        `;
    });

    return `
        <div
            class="macevo-document-flow"
            data-macevo-document="true"
            data-macevo-pagination-mode="continuous"
        >
            ${html}
        </div>
    `;
}

/* ============================================================
   VALIDATION
   ============================================================ */

function validateDocumentModel(model) {
    const errors = [];

    if (!model) {
        return {
            valid: false,
            errors: ["Le modèle documentaire est absent."],
        };
    }

    if (
        !model.metadata ||
        typeof model.metadata !== "object"
    ) {
        errors.push(
            "Les métadonnées du document sont absentes."
        );
    }

    if (!Array.isArray(model.frontMatter)) {
        errors.push(
            "Le front matter doit être un tableau."
        );
    }

    if (!Array.isArray(model.chapters)) {
        errors.push(
            "Les chapitres doivent être un tableau."
        );
    }

    if (!Array.isArray(model.backMatter)) {
        errors.push(
            "Le back matter doit être un tableau."
        );
    }

    if (!Array.isArray(model.tableOfContents)) {
        errors.push(
            "La table des matières doit être un tableau."
        );
    }

    const allNodes = flattenNodes([
        ...(model.frontMatter || []),
        ...(model.chapters || []),
        ...(model.backMatter || []),
    ]);

    const instanceIds = new Set();

    allNodes.forEach(node => {
        if (!node.id) {
            errors.push(
                "Un nœud ne possède pas d'identifiant."
            );
        }

        if (!node.instanceId) {
            errors.push(
                `Le module "${node.id || "inconnu"}" ne possède pas d'instanceId.`
            );
        }

        if (
            node.instanceId &&
            instanceIds.has(node.instanceId)
        ) {
            errors.push(
                `instanceId dupliqué : ${node.instanceId}`
            );
        }

        if (node.instanceId) {
            instanceIds.add(node.instanceId);
        }

        if (!Array.isArray(node.content)) {
            errors.push(
                `Le contenu du module "${node.id}" doit être un tableau.`
            );
        }

        if (!Array.isArray(node.children)) {
            errors.push(
                `Les enfants du module "${node.id}" doivent être un tableau.`
            );
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

export {
    FRONT_MATTER_MODULES,
    BACK_MATTER_MODULES,
    METHODOLOGY_MODULES,

    classifyModule,
    getNodeTitle,
    getInstanceId,

    normalizeStructureNode,
    normalizeStructure,

    buildMetadata,
    buildNodeContent,
    buildNode,

    buildCover,
    buildFrontMatter,
    buildChapters,
    buildBackMatter,

    flattenNodes,
    createTableOfContents,

    collectContentElements,
    createFigureList,
    createSchemaList,
    createTableList,
    createEquationList,
    createReferenceList,

    buildDocumentModel,
    findDocumentNode,

    renderParagraph,
    renderHeading,
    renderList,
    renderTable,
    renderFigure,
    renderSchema,
    renderEquation,
    renderReference,
    renderContentElement,

    renderSection,
    renderChapter,
    renderDocumentModel,

    validateDocumentModel,
};

export default {
    buildDocumentModel,
    renderDocumentModel,
    validateDocumentModel,
};
