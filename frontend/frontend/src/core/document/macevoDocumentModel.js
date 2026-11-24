/**
 * MACEVO — Canonical Document Model — FINAL
 * ---------------------------------
 * Source unique de vérité pour :
 *   Template -> Document -> Preview / Editor / Export
 *
 * v1.5.0
 * - conserve la hiérarchie réelle ;
 * - sépare correctement front matter / corps / back matter / annexes ;
 * - dérive les préliminaires depuis template.frontMatter ;
 * - génère une tableOfContents canonique ;
 * - conserve les blocs de contenu des structures ;
 * - accepte un design déjà résolu ou un design simple ;
 * - reste indépendant de React / TipTap / API.
 */

import { buildAcademicModuleContent } from "./reportContentEngine";

const MODEL_VERSION = "1.5.0";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const deepClone = (value) => {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
};

const slugify = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const makeId = (prefix, value, index = 0) =>
  `${prefix}-${slugify(value) || index + 1}`;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function blocksToHtml(blocks = []) {
  if (!Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      if (!isObject(block)) return "";

      const type = block.type || "paragraph";

      if (type === "html") {
        return String(block.html ?? block.text ?? "").trim();
      }

      const text =
        block.text ??
        block.content ??
        block.html ??
        "";

      if (type === "heading") {
        const level = Math.min(Math.max(Number(block.level) || 2, 1), 6);
        return `<h${level}>${escapeHtml(text)}</h${level}>`;
      }

      if (type === "list") {
        const items = Array.isArray(block.items) ? block.items : [];
        return `<ul>${items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("")}</ul>`;
      }

      if (type === "quote") {
        return `<blockquote>${escapeHtml(text)}</blockquote>`;
      }

      if (type === "table" && Array.isArray(block.rows)) {
        return `<table><tbody>${block.rows
          .map(
            (row) =>
              `<tr>${(Array.isArray(row) ? row : [])
                .map((cell) => `<td>${escapeHtml(cell)}</td>`)
                .join("")}</tr>`
          )
          .join("")}</tbody></table>`;
      }

      return `<p>${escapeHtml(text)}</p>`;
    })
    .join("");
}

/**
 * Normalise une structure provenant des différents formats historiques
 * de MACEVO sans perdre les enfants.
 */
function stripManualNumbering(value = "") {
  return String(value)
    .replace(/^\s*(?:\d+(?:\.\d+)*|[IVXLCDM]+)(?:[.)])?\s+/i, "")
    .trim();
}

export function normalizeNode(node, index = 0, parentId = null) {
  if (!isObject(node)) {
    return {
      id: makeId("node", String(node ?? ""), index),
      type: "section",
      title: String(node ?? ""),
      parentId,
      children: [],
      content: "",
      blocks: [],
      source: null,
    };
  }

  const rawTitle =
    node.title ??
    node.name ??
    node.label ??
    node.heading ??
    "";

  const title = stripManualNumbering(rawTitle);

  const rawChildren =
    node.children ??
    node.sections ??
    node.subsections ??
    node.chapters ??
    [];

  const type =
    node.type ||
    (node.chapter ? "chapter" : null) ||
    (node.subsection ? "subsection" : null) ||
    "section";

  const id =
    node.id ||
    node.key ||
    makeId(type, title, index);

  const blocks = Array.isArray(node.blocks)
    ? deepClone(node.blocks)
    : [];

  const rawContent =
    typeof node.content === "string"
      ? node.content
      : typeof node.html === "string"
        ? node.html
        : "";

  const content =
    rawContent.trim()
      ? rawContent
      : blocksToHtml(blocks);

  return {
    id,
    type,
    title: String(title),
    parentId,
    number: node.number ?? null,
    level: node.level ?? null,
    content,
    blocks,
    placeholder:
      node.placeholder ??
      node.description ??
      "",
    locked: Boolean(node.locked),
    required: node.required !== false,
    visible: node.visible !== false,
    metadata: isObject(node.metadata) ? deepClone(node.metadata) : {},
    children: Array.isArray(rawChildren)
      ? rawChildren.map((child, childIndex) =>
          normalizeNode(child, childIndex, id)
        )
      : [],
    generated: Boolean(node.generated),
    source: deepClone(node.source ?? null),
  };
}

export function normalizeStructure(structure = []) {
  if (!Array.isArray(structure)) return [];
  return structure.map((node, index) => normalizeNode(node, index));
}

function numberTree(nodes, prefix = "") {
  return nodes.map((node, index) => {
    const current = prefix
      ? `${prefix}.${index + 1}`
      : String(index + 1);

    const numbered =
      ["chapter", "part", "section", "subsection", "subsubsection"].includes(
        node.type
      );

    const number = numbered
      ? current
      : node.number ?? null;

    return {
      ...node,
      number,
      numbering: numbered
        ? { value: number, automatic: true }
        : (node.numbering || { value: number, automatic: false }),
      children: numberTree(
        node.children || [],
        numbered ? current : prefix
      ),
    };
  });
}

function normalizeDesign(template = {}) {
  const raw = template.design;

  // Le registre MACEVO utilise actuellement design: "classique",
  // "scientifique", etc. Si le caller a déjà résolu le design,
  // on accepte l'objet directement.
  const design = isObject(raw)
    ? raw
    : isObject(template.templateDesign)
      ? template.templateDesign
      : {};

  const page = isObject(design.page) ? design.page : {};
  const typography = isObject(design.typography)
    ? design.typography
    : {};
  const colors = isObject(design.colors) ? design.colors : {};
  const spacing = isObject(design.spacing) ? design.spacing : {};
  const layout = isObject(design.layout) ? design.layout : {};
  const cover = isObject(design.cover) ? design.cover : {};

  return {
    id:
      design.id ||
      (typeof raw === "string" ? raw : null),
    page: {
      size: page.size || "A4",
      orientation: page.orientation || "portrait",
      margins: {
        top: page.margins?.top ?? 25,
        right: page.margins?.right ?? 25,
        bottom: page.margins?.bottom ?? 25,
        left: page.margins?.left ?? 25,
      },
      ...deepClone(page),
    },
    typography: {
      bodyFont: typography.bodyFont || "Arial, sans-serif",
      bodySize: typography.bodySize ?? 12,
      lineHeight: typography.lineHeight ?? 1.5,
      headingFont:
        typography.headingFont ||
        typography.bodyFont ||
        "Arial, sans-serif",
      ...deepClone(typography),
    },
    colors: {
      primary: colors.primary || "#2563eb",
      secondary: colors.secondary || "#f8fafc",
      accent: colors.accent || colors.primary || "#2563eb",
      text: colors.text || "#1f2937",
      muted: colors.muted || "#64748b",
      border: colors.border || "#cbd5e1",
      ...deepClone(colors),
    },
    spacing: deepClone(spacing),
    layout: deepClone(layout),
    cover: deepClone(cover),
  };
}

function normalizeMetadata(template = {}, overrides = {}) {
  const level = Array.isArray(template.level)
    ? template.level[0]
    : template.level;

  const language = Array.isArray(template.language)
    ? template.language[0]
    : template.language;

  const fields = Array.isArray(template.fields)
    ? template.fields[0]
    : template.fields;

  const nested = isObject(overrides.metadata)
    ? overrides.metadata
    : {};

  const id =
    overrides.documentId ||
    overrides.id ||
    nested.id ||
    null;

  return {
    id,
    title:
      nested.title ||
      overrides.title ||
      template.title ||
      template.name ||
      "Nouveau document",
    description:
      nested.description ||
      overrides.description ||
      template.description ||
      "",
    author:
      nested.author ||
      overrides.author ||
      "",
    type:
      nested.type ||
      overrides.type ||
      template.type ||
      template.category ||
      "academic",
    reportType:
      nested.reportType ||
      overrides.reportType ||
      template.type ||
      template.category ||
      "academic",
    language:
      nested.language ||
      overrides.language ||
      language ||
      "fr",
    academicLevel:
      nested.academicLevel ||
      overrides.academicLevel ||
      level ||
      null,
    scientificField:
      nested.scientificField ||
      overrides.scientificField ||
      fields ||
      null,
    citationStyle:
      nested.citationStyle ||
      overrides.citationStyle ||
      template.citationStyle ||
      "APA",
    templateId:
      nested.templateId ||
      template.id ||
      null,
    templateName:
      nested.templateName ||
      template.name ||
      template.label ||
      null,
    templateCategory:
      nested.templateCategory ||
      template.category ||
      null,
    createdAt:
      nested.createdAt ||
      overrides.createdAt ||
      new Date().toISOString(),
    updatedAt:
      nested.updatedAt ||
      overrides.updatedAt ||
      new Date().toISOString(),
  };
}

function normalizeContext(template = {}, overrides = {}) {
  const source =
    template.academicContext ||
    template.context ||
    {};

  const nested = isObject(overrides.academicContext)
    ? overrides.academicContext
    : {};

  return {
    country:
      nested.country ??
      overrides.country ??
      source.country ??
      null,
    countryCode:
      nested.countryCode ??
      overrides.countryCode ??
      source.countryCode ??
      null,
    institution:
      nested.institution ??
      overrides.institution ??
      source.institution ??
      null,
    faculty:
      nested.faculty ??
      overrides.faculty ??
      source.faculty ??
      null,
    department:
      nested.department ??
      overrides.department ??
      source.department ??
      null,
    program:
      nested.program ??
      overrides.program ??
      source.program ??
      null,
    specialty:
      nested.specialty ??
      overrides.specialty ??
      source.specialty ??
      null,
  };
}

function makeFrontMatterNodes(template) {
  const flags = isObject(template.frontMatter)
    ? template.frontMatter
    : {};

  const definitions = [
    ["cover", "Page de garde", flags.cover],
    ["titlePage", "Page de titre", flags.titlePage],
    ["declaration", "Déclaration", flags.declaration],
    ["dedication", "Dédicace", flags.dedication],
    ["acknowledgements", "Remerciements", flags.acknowledgements],
    ["abstract", "Résumé", flags.abstract],
    ["summary", "Summary", flags.summary],
    ["keywords", "Mots-clés", flags.keywords],
    ["toc", "Table des matières", flags.tableOfContents],
    ["listOfFigures", "Liste des figures", flags.listOfFigures],
    ["listOfTables", "Liste des tableaux", flags.listOfTables],
    ["listOfAlgorithms", "Liste des algorithmes", flags.listOfAlgorithms],
    ["listOfAbbreviations", "Liste des abréviations", flags.listOfAbbreviations],
    ["listOfSymbols", "Liste des symboles", flags.listOfSymbols],
  ];

  return definitions
    .filter(([, , enabled]) => enabled === true)
    .map(([type, title], index) =>
      normalizeNode(
        {
          id: `front-${type}`,
          type,
          title,
          content: "",
          metadata: {
            generated: true,
            preliminary: true,
          },
        },
        index
      )
    );
}

function splitStructure(template) {
  const structure = normalizeStructure(template.structure || []);

  const frontTypes = new Set([
    "cover",
    "titlePage",
    "declaration",
    "dedication",
    "acknowledgements",
    "abstract",
    "summary",
    "keywords",
    "frontMatter",
    "toc",
    "listOfFigures",
    "listOfTables",
    "listOfAlgorithms",
    "listOfAbbreviations",
    "listOfSymbols",
  ]);

  const backTypes = new Set([
    "backMatter",
    "bibliography",
    "references",
    "glossary",
    "conclusion",
  ]);

  const appendixTypes = new Set([
    "appendix",
    "annex",
    "annexe",
  ]);

  const frontMatter = [
    ...makeFrontMatterNodes(template),
    ...structure.filter((node) => frontTypes.has(node.type)),
  ];

  const body = structure.filter(
    (node) =>
      !frontTypes.has(node.type) &&
      !backTypes.has(node.type) &&
      !appendixTypes.has(node.type)
  );

  const backMatter = structure.filter((node) =>
    backTypes.has(node.type)
  );

  const appendices = structure.filter((node) =>
    appendixTypes.has(node.type)
  );

  return {
    frontMatter,
    body,
    backMatter,
    appendices,
  };
}function buildTableOfContents(document) {
  const entries = [];

  function walk(nodes = [], depth = 0) {
    nodes.forEach((node) => {
      const isTocNode = [
        "toc",
        "cover",
        "titlePage",
        "declaration",
        "dedication",
        "acknowledgements",
        "abstract",
        "summary",
        "keywords",
        "listOfFigures",
        "listOfTables",
        "listOfAlgorithms",
        "listOfAbbreviations",
        "listOfSymbols",
      ].includes(node.type);

      const shouldInclude =
        node.visible !== false &&
        !isTocNode &&
        Boolean(node.title);

      if (shouldInclude) {
        entries.push({
          id: node.id,
          title: node.title,
          number: node.number ?? null,
          depth,
          page: node.page ?? null,
          type: node.type,
        });
      }

      walk(node.children || [], depth + 1);
    });
  }

  walk(document.chapters, 0);
  walk(document.backMatter, 0);
  walk(document.appendices, 0);

  return entries;
}

/**
 * Crée une instance indépendante.
 * Le template n'est jamais muté.
 */
export function createMacevoDocument(template = {}, overrides = {}) {
  const metadata = normalizeMetadata(template, overrides);
  const context = normalizeContext(template, overrides);
  const design = normalizeDesign(template);
  const split = splitStructure(template);

  const document = {
    model: "MACEVO_DOCUMENT",
    modelVersion: MODEL_VERSION,

    id:
      overrides.documentId ||
      metadata.id ||
      `doc-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    template: {
      id: template.id || null,
      version: template.version || null,
      name: template.name || template.label || null,
      structureId: template.structureId || null,
      snapshot: deepClone(template),
    },

    metadata: {
      ...metadata,
    },

    academicContext: context,

    design,

    rules: deepClone(
      template.documentRules ||
      template.rules ||
      {}
    ),

    numbering: deepClone(
      template.numbering ||
      template.documentRules?.numbering ||
      {}
    ),

    frontMatter: split.frontMatter,

    chapters: numberTree(split.body),

    backMatter: numberTree(split.backMatter),

    appendices: split.appendices,

    bibliography: {
      style: metadata.citationStyle,
      entries: [],
    },

    glossary: [],

    scientificRegistry: {
      figures: [],
      tables: [],
      equations: [],
    },

    tableOfContents: [],

    settings: {
      language: metadata.language,
      citationStyle: metadata.citationStyle,
      pageSize: design.page.size,
      orientation: design.page.orientation,
    },

    pagination: {
      mode: "dynamic",
      status: "unresolved",
      pages: [],
      totalPages: null,
      lastCalculatedAt: null,
    },

    editor: {
      activeNodeId: null,
      dirty: false,
      initializedFromTemplate: template.autoGenerateInitialContent !== false,
      source: template.autoGenerateInitialContent === false ? "blank" : "template",
      content: null,
      html: "",
    },
  };

  const profile = overrides.profile || overrides.demoProfile || {};

  function enrichNodes(nodes = []) {
    return nodes.map((node) => {
      const next = { ...node };
      const hasContent = Boolean(String(next.content || "").trim()) ||
        (Array.isArray(next.blocks) && next.blocks.length > 0);

      // Les contenus explicitement fournis par le template restent prioritaires.
      if (
        template.autoGenerateInitialContent !== false &&
        !hasContent &&
        next.title
      ) {
        const generated = buildAcademicModuleContent(template, next, { profile });
        next.content = generated.html;
        next.blocks = generated.blocks;
        next.generated = true;
        next.metadata = {
          ...(next.metadata || {}),
          generatedBy: generated.engine,
          generatedVersion: generated.engineVersion,
        };
      }

      next.children = enrichNodes(next.children || []);
      return next;
    });
  }

  document.frontMatter = enrichNodes(document.frontMatter);
  document.chapters = enrichNodes(document.chapters);
  document.backMatter = enrichNodes(document.backMatter);
  document.appendices = enrichNodes(document.appendices);

  document.tableOfContents = buildTableOfContents(document);

  return document;
}

export function rebuildTableOfContents(document) {
  const next = deepClone(document);

  if (!next) return null;

  next.tableOfContents = buildTableOfContents(next);
  return next;
}

export function flattenDocumentNodes(document) {
  const result = [];

  function walk(nodes = [], depth = 0) {
    nodes.forEach((node) => {
      result.push({ node, depth });
      walk(node.children || [], depth + 1);
    });
  }

  walk(document.frontMatter, 0);
  walk(document.chapters, 0);
  walk(document.backMatter, 0);
  walk(document.appendices, 0);

  return result;
}

/**
 * Convertit les contenus historiques/plain-text en HTML réellement exploitable
 * par TipTap. Le convertisseur est volontairement limité au Markdown académique
 * que MACEVO a pu produire historiquement : titres, listes, tableaux, gras,
 * italique et paragraphes.
 */
function looksLikeHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function inlineMarkdownToHtml(value) {
  let text = escapeHtml(value == null ? "" : String(value));

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) =>
    `<a href="${escapeHtml(href)}">${label}</a>`
  );
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");
  return text;
}

function legacyMarkupToHtml(value) {
  if (value == null) return "";
  const raw = String(value).replace(/\r\n/g, "\n").trim();
  if (!raw) return "";
  if (looksLikeHtml(raw)) return raw;

  const lines = raw.split("\n");
  const out = [];
  let i = 0;
  let list = null;

  const closeList = () => {
    if (!list) return;
    out.push(`</${list}>`);
    list = null;
  };

  const isSeparator = (line) =>
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

  const splitTableRow = (line) => {
    let row = line.trim();
    if (row.startsWith("|")) row = row.slice(1);
    if (row.endsWith("|")) row = row.slice(0, -1);
    return row.split("|").map((cell) => cell.trim());
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      closeList();
      i += 1;
      continue;
    }

    /* Tableau Markdown */
    if (line.includes("|") && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      closeList();
      const header = splitTableRow(line);
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        body.push(splitTableRow(lines[i]));
        i += 1;
      }

      out.push("<table><thead><tr>");
      header.forEach((cell) => out.push(`<th>${inlineMarkdownToHtml(cell)}</th>`));
      out.push("</tr></thead>");
      if (body.length) {
        out.push("<tbody>");
        body.forEach((row) => {
          out.push("<tr>");
          const width = Math.max(header.length, row.length);
          for (let c = 0; c < width; c += 1) {
            out.push(`<td>${inlineMarkdownToHtml(row[c] || "")}</td>`);
          }
          out.push("</tr>");
        });
        out.push("</tbody>");
      }
      out.push("</table>");
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(6, heading[1].length);
      out.push(`<h${level}>${inlineMarkdownToHtml(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${inlineMarkdownToHtml(bullet[1])}</li>`);
      i += 1;
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${inlineMarkdownToHtml(ordered[1])}</li>`);
      i += 1;
      continue;
    }

    closeList();

    /* Une ligne de TOC historique n'est pas du contenu de chapitre. */
    if (/^\[[^\]]+\]\(#node-[^)]+\)$/i.test(line)) {
      i += 1;
      continue;
    }

    out.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
    i += 1;
  }

  closeList();
  return out.join("\n");
}function renderContent(node) {
  if (Array.isArray(node.blocks) && node.blocks.length) {
    const blockHtml = node.blocks
      .map((block) => {
        if (!block) return "";
        if (block.type === "html") return legacyMarkupToHtml(block.html || "");
        if (block.type === "paragraph") {
          return `<p>${inlineMarkdownToHtml(block.text || "")}</p>`;
        }
        if (block.type === "heading") {
          const level = Math.min(Math.max(Number(block.level) || 2, 1), 6);
          return `<h${level}>${inlineMarkdownToHtml(block.text || "")}</h${level}>`;
        }
        if (block.type === "text") return `<p>${inlineMarkdownToHtml(block.text || "")}</p>`;
        return "";
      })
      .join("\n");
    if (blockHtml.trim()) return blockHtml;
  }

  if (node.content && String(node.content).trim()) {
    return legacyMarkupToHtml(node.content);
  }

  // Keep the section editable without putting instructional copy into the
  // academic document. Guidance belongs in the editor UI, not in the export.
  return '<p><br></p>';
}

function renderNode(node, options = {}) {
  if (node.visible === false) return "";

  const depth = options.depth ?? 0;
  const type = node.type;

  const headingLevel =
    type === "chapter" || type === "part"
      ? 1
      : Math.min(depth + 1, 6);

  const heading =
    node.title &&
    ![
      "cover",
      "titlePage",
      "declaration",
      "dedication",
      "acknowledgements",
      "abstract",
      "summary",
      "keywords",
      "toc",
      "listOfFigures",
      "listOfTables",
      "listOfAlgorithms",
      "listOfAbbreviations",
      "listOfSymbols",
    ].includes(type)
      ? `<h${headingLevel} data-macevo-node="${escapeHtml(
          node.id
        )}" data-macevo-type="${escapeHtml(type)}">${
          node.number ? `${escapeHtml(node.number)} ` : ""
        }${escapeHtml(node.title)}</h${headingLevel}>`
      : "";

  const children = (node.children || [])
    .map((child) =>
      renderNode(child, {
        ...options,
        depth: depth + 1,
      })
    )
    .join("");

  return `
    <section
      data-macevo-node="${escapeHtml(node.id)}"
      data-macevo-type="${escapeHtml(type)}"
      data-macevo-depth="${depth}"
      class="macevo-node macevo-node-${escapeHtml(type)}"
    >
      ${heading}
      <div class="macevo-node-content">
        ${renderContent(node)}
      </div>
      ${children}
    </section>
  `;
}

function renderDefaultCover(document) {
  const metadata = document?.metadata || {};
  const context = document?.academicContext || {};
  const institution = context.institution || "Institution académique";
  const faculty = context.faculty || "";
  const department = context.department || "";
  const program = context.program || "";
  const level = metadata.academicLevel || "";
  const title = metadata.title || "Document académique";
  const author = metadata.author || "";
  const year = metadata.academicYear || new Date().getFullYear();

  return `
    <section class="macevo-cover" data-macevo-cover="true">
      <div class="macevo-cover-institution"><strong>${escapeHtml(institution)}</strong></div>
      ${faculty ? `<div>${escapeHtml(faculty)}</div>` : ""}
      ${department ? `<div>${escapeHtml(department)}</div>` : ""}
      ${program ? `<div>${escapeHtml(program)}</div>` : ""}
      ${level ? `<div>${escapeHtml(level)}</div>` : ""}
      <h1 class="macevo-cover-title">${escapeHtml(title)}</h1>
      ${author ? `<div class="macevo-cover-author"><span>Présenté par</span><strong>${escapeHtml(author)}</strong></div>` : ""}
      <div class="macevo-cover-year">${escapeHtml(year)}</div>
    </section>
  `;
}

function renderDefaultToc(document) {
  const entries = Array.isArray(document?.tableOfContents)
    ? document.tableOfContents
    : [];

  const rows = entries.map((entry) => `
    <div class="macevo-toc-row" style="padding-left:${Math.min((Number(entry.depth) || 0) * 24, 96)}px">
      <span class="macevo-toc-number">${escapeHtml(entry.number || "")}</span>
      <span class="macevo-toc-title">${escapeHtml(entry.title || "")}</span>
      <span class="macevo-toc-dots"></span>
      <span class="macevo-toc-page">${entry.page ?? "—"}</span>
    </div>
  `).join("");

  return `
    <section class="macevo-toc" data-macevo-toc="true">
      <h1>TABLE DES MATIÈRES</h1>
      <div class="macevo-toc-list">${rows}</div>
    </section>
  `;
}

export function renderMacevoDocument(document, options = {}) {
  if (!document) return "";

  const coverRenderer =
    typeof options.renderCover === "function"
      ? options.renderCover
      : null;

  const tocRenderer =
    typeof options.renderToc === "function"
      ? options.renderToc
      : null;

  const renderCollection = (nodes = []) =>
    nodes
      .map((node) => {
        if (node.type === "cover") {
          return coverRenderer
            ? coverRenderer(
                {
                  ...document.metadata,
                  ...(document.academicContext || {}),
                },
                document
              )
            : renderDefaultCover(document);
        }

        if (node.type === "toc") {
          return tocRenderer
            ? tocRenderer(document)
            : renderDefaultToc(document);
        }

        return renderNode(node);
      })
      .join("\n");

  const body = [
    renderCollection(document.frontMatter),
    renderCollection(document.chapters),
    renderCollection(document.backMatter),
    renderCollection(document.appendices),
  ].join("\n");

  const page = document.design?.page || {};
  const typography = document.design?.typography || {};

  return `
    <div
      class="macevo-document"
      data-macevo-model="${MODEL_VERSION}"
      data-macevo-document-id="${escapeHtml(document.id)}"
      data-macevo-template-id="${escapeHtml(
        document.template?.id || ""
      )}"
      style="
        --macevo-page-size:${escapeHtml(page.size || "A4")};
        --macevo-body-font:${escapeHtml(
          typography.bodyFont || "Arial, sans-serif"
        )};
        --macevo-body-size:${escapeHtml(
          typography.bodySize ?? 12
        )}px;
        --macevo-line-height:${escapeHtml(
          typography.lineHeight ?? 1.5
        )};
      "
    >
      ${body}
    </div>
  `;
}

/**
 * Compatibilité avec les anciens noms utilisés dans EditorContext.
 */
export function buildDocumentModel(report, structure = null) {
  if (!report) return null;

  if (
    report.model === "MACEVO_DOCUMENT" &&
    report.modelVersion
  ) {
    return deepClone(report);
  }

  const templateLike = {
    id: report.templateId || report.template?.id || null,
    name: report.templateName || report.template?.name || null,
    type: report.documentType || report.type || "academic",
    structure:
      structure ||
      report.structure ||
      report.chapters ||
      [],
    academicContext:
      report.academicContext ||
      report.context ||
      {},
    design:
      report.design ||
      report.templateDesign ||
      {},
    templateDesign:
      report.templateDesign || null,
    frontMatter:
      report.frontMatter || {},
    documentRules:
      report.documentRules || report.rules || {},
    citationStyle: report.citationStyle,
    language: report.language,
    level: report.academicLevel,
    fields: report.scientificField
      ? [report.scientificField]
      : [],
    structureId: report.structureId || null,
  };

  return createMacevoDocument(templateLike, {
    documentId: report.id || report.reportId,
    title: report.title || report.documentTitle,
    author: report.author || report.documentAuthor,
  });
}

export function renderDocumentModel(
  document,
  renderCover,
  renderToc
) {
  return renderMacevoDocument(document, {
    renderCover,
    renderToc,
  });
}

export function serializeMacevoDocument(document) {
  return JSON.stringify(document);
}

export function deserializeMacevoDocument(value) {
  if (!value) return null;

  const parsed =
    typeof value === "object"
      ? deepClone(value)
      : (() => {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        })();

  if (
    !parsed ||
    parsed.model !== "MACEVO_DOCUMENT"
  ) {
    return null;
  }

  return parsed;
}

export function updateNodeContent(
  document,
  nodeId,
  content
) {
  const next = deepClone(document);

  if (!next) return null;

  function visit(nodes = []) {
    for (const node of nodes) {
      if (node.id === nodeId) {
        node.content = content;
        node.blocks = [{ type: "html", html: String(content || "") }];
        node.generated = false;
        return true;
      }

      if (visit(node.children || [])) return true;
    }

    return false;
  }

  visit(next.frontMatter);
  visit(next.chapters);
  visit(next.backMatter);
  visit(next.appendices);

  next.tableOfContents =
    buildTableOfContents(next);

  next.metadata.updatedAt =
    new Date().toISOString();

  next.editor.dirty = true;

  return next;
}

export const MACEVO_DOCUMENT_MODEL_VERSION =
  MODEL_VERSION;

export default {
  createMacevoDocument,
  normalizeNode,
  normalizeStructure,
  flattenDocumentNodes,
  rebuildTableOfContents,
  renderMacevoDocument,
  buildDocumentModel,
  renderDocumentModel,
  serializeMacevoDocument,
  deserializeMacevoDocument,
  updateNodeContent,
  MACEVO_DOCUMENT_MODEL_VERSION: MODEL_VERSION,
};
