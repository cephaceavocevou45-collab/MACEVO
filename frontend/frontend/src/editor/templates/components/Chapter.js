/**
 * ==========================================================
 * MACEVO — TEMPLATE ENGINE
 * ----------------------------------------------------------
 * Fichier : Chapter.js
 * Version : 1.0.0
 * Rôle    : Génération des chapitres scientifiques
 * ==========================================================
 */

import { escapeHtml, normalizeContent } from "../TemplateEngine";

/* ==========================================================
   OUTILS INTERNES
   ========================================================== */

const safe = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const normalizeArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [value];
};

const cleanTitle = (value, fallback = "Chapitre") => {
  const title = safe(value).trim();

  return title || fallback;
};

const getChapterNumber = (chapter, index = 0) => {
  if (chapter?.number !== undefined && chapter?.number !== null) {
    return safe(chapter.number);
  }

  if (chapter?.chapterNumber !== undefined) {
    return safe(chapter.chapterNumber);
  }

  return String(index + 1);
};

const getChapterType = (chapter) => {
  const type = safe(
    chapter?.type ||
      chapter?.category ||
      chapter?.kind ||
      ""
  )
    .toLowerCase()
    .trim();

  if (
    type.includes("introduction") ||
    type.includes("intro")
  ) {
    return "introduction";
  }

  if (
    type.includes("theorie") ||
    type.includes("théorie") ||
    type.includes("literature") ||
    type.includes("littérature") ||
    type.includes("cadre")
  ) {
    return "theoretical";
  }

  if (
    type.includes("method") ||
    type.includes("méthod") ||
    type.includes("methodologie") ||
    type.includes("méthodologie")
  ) {
    return "methodology";
  }

  if (
    type.includes("result") ||
    type.includes("résultat")
  ) {
    return "results";
  }

  if (
    type.includes("discussion") ||
    type.includes("analyse")
  ) {
    return "discussion";
  }

  if (
    type.includes("conclusion") ||
    type.includes("synthèse") ||
    type.includes("synthese")
  ) {
    return "synthesis";
  }

  return "chapter";
};

/* ==========================================================
   CONTENU TEXTE
   ========================================================== */

const renderParagraph = (content) => {
  const normalized = normalizeContent(content);

  if (!normalized) return "";

  /*
   * Si le contenu contient déjà du HTML,
   * on le conserve afin de permettre :
   * - gras
   * - italique
   * - listes
   * - équations
   * - tableaux
   * - images
   * - citations
   */
  if (
    /<\/?[a-z][\s\S]*>/i.test(normalized)
  ) {
    return normalized;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs
    .map(
      (paragraph) =>
        `<p class="chapter-paragraph">${escapeHtml(
          paragraph
        ).replace(/\n/g, "<br />")}</p>`
    )
    .join("");
};

/* ==========================================================
   LISTES
   ========================================================== */

const renderList = (items, ordered = false) => {
  const values = normalizeArray(items);

  if (!values.length) return "";

  const tag = ordered ? "ol" : "ul";

  return `
    <${tag} class="chapter-list ${ordered ? "chapter-list-ordered" : "chapter-list-unordered"}">
      ${values
        .map((item) => {
          if (typeof item === "object") {
            return `
              <li>
                ${escapeHtml(
                  item.text ||
                    item.label ||
                    item.title ||
                    ""
                )}
              </li>
            `;
          }

          return `<li>${escapeHtml(item)}</li>`;
        })
        .join("")}
    </${tag}>
  `;
};

/* ==========================================================
   SOUS-SECTION
   ========================================================== */

const renderSubsection = (
  subsection,
  level = 2,
  parentNumber = ""
) => {
  if (!subsection) return "";

  const title = cleanTitle(
    subsection.title ||
      subsection.name ||
      subsection.heading ||
      "",
    "Sous-section"
  );

  const number =
    subsection.number !== undefined
      ? safe(subsection.number)
      : "";

  const headingNumber = number
    ? number
    : parentNumber
      ? `${parentNumber}.`
      : "";

  const headingTag =
    level <= 2
      ? "h2"
      : level === 3
        ? "h3"
        : "h4";

  const content =
    subsection.content ||
    subsection.text ||
    subsection.body ||
    "";

  let html = `
    <section
      class="chapter-subsection chapter-subsection-level-${level}"
      data-level="${level}"
    >
      <${headingTag} class="chapter-heading chapter-heading-level-${level}">
        ${
          headingNumber
            ? `<span class="chapter-heading-number">${escapeHtml(
                headingNumber
              )}</span> `
            : ""
        }
        <span>${escapeHtml(title)}</span>
      </${headingTag}>
  `;

  if (content) {
    html += renderParagraph(content);
  }

  if (subsection.paragraphs) {
    normalizeArray(subsection.paragraphs).forEach(
      (paragraph) => {
        html += renderParagraph(paragraph);
      }
    );
  }

  if (subsection.items) {
    html += renderList(
      subsection.items,
      Boolean(subsection.ordered)
    );
  }

  if (subsection.list) {
    html += renderList(
      subsection.list,
      Boolean(subsection.ordered)
    );
  }

  if (subsection.children) {
    normalizeArray(subsection.children).forEach(
      (child, index) => {
        html += renderSubsection(
          child,
          Math.min(level + 1, 4),
          number || `${parentNumber}${index + 1}`
        );
      }
    );
  }

  html += "</section>";

  return html;
};

/* ==========================================================
   FIGURE SCIENTIFIQUE
   ========================================================== */

const renderFigure = (figure, index = 0) => {
  if (!figure) return "";

  const src =
    figure.src ||
    figure.url ||
    figure.image ||
    figure.path ||
    "";

  const caption =
    figure.caption ||
    figure.title ||
    `Figure ${index + 1}`;

  const label =
    figure.label ||
    `Figure ${index + 1}`;

  if (!src) {
    return `
      <figure class="chapter-figure chapter-figure-placeholder">
        <div class="chapter-figure-placeholder-box">
          <span>Figure scientifique</span>
        </div>

        <figcaption>
          <strong>${escapeHtml(label)}.</strong>
          ${escapeHtml(caption)}
        </figcaption>
      </figure>
    `;
  }

  return `
    <figure class="chapter-figure">
      <div class="chapter-figure-image">
        <img
          src="${escapeHtml(src)}"
          alt="${escapeHtml(caption)}"
        />
      </div>

      <figcaption>
        <strong>${escapeHtml(label)}.</strong>
        ${escapeHtml(caption)}
      </figcaption>
    </figure>
  `;
};

/* ==========================================================
   TABLE SCIENTIFIQUE
   ========================================================== */

const renderTable = (table, index = 0) => {
  if (!table) return "";

  const caption =
    table.caption ||
    table.title ||
    `Tableau ${index + 1}`;

  const label =
    table.label ||
    `Tableau ${index + 1}`;

  const headers = normalizeArray(
    table.headers ||
      table.columns ||
      []
  );

  const rows = normalizeArray(
    table.rows ||
      table.data ||
      []
  );

  if (!headers.length && !rows.length) {
    return `
      <figure class="chapter-table chapter-table-placeholder">
        <figcaption class="chapter-table-caption">
          <strong>${escapeHtml(label)}.</strong>
          ${escapeHtml(caption)}
        </figcaption>

        <div class="chapter-table-placeholder-box">
          Tableau scientifique
        </div>
      </figure>
    `;
  }

  return `
    <figure class="chapter-table">
      <figcaption class="chapter-table-caption">
        <strong>${escapeHtml(label)}.</strong>
        ${escapeHtml(caption)}
      </figcaption>

      <div class="chapter-table-wrapper">
        <table>
          ${
            headers.length
              ? `
                <thead>
                  <tr>
                    ${headers
                      .map(
                        (header) =>
                          `<th>${escapeHtml(
                            typeof header ===
                              "object"
                              ? header.label ||
                                  header.title ||
                                  ""
                              : header
                          )}</th>`
                      )
                      .join("")}
                  </tr>
                </thead>
              `
              : ""
          }

          ${
            rows.length
              ? `
                <tbody>
                  ${rows
                    .map((row) => {
                      const cells =
                        Array.isArray(row)
                          ? row
                          : normalizeArray(
                              row.cells ||
                                row.values ||
                                row
                            );

                      return `
                        <tr>
                          ${cells
                            .map(
                              (cell) =>
                                `<td>${escapeHtml(
                                  typeof cell ===
                                    "object"
                                    ? cell.value ||
                                        cell.text ||
                                        ""
                                    : cell
                                )}</td>`
                            )
                            .join("")}
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              `
              : ""
          }
        </table>
      </div>
    </figure>
  `;
};

/* ==========================================================
   ÉQUATION
   ========================================================== */

const renderEquation = (equation, index = 0) => {
  if (!equation) return "";

  const expression =
    typeof equation === "string"
      ? equation
      : equation.expression ||
        equation.latex ||
        equation.formula ||
        "";

  const label =
    typeof equation === "object"
      ? equation.label ||
        `Équation ${index + 1}`
      : `Équation ${index + 1}`;

  return `
    <div class="chapter-equation">
      <div class="chapter-equation-expression">
        ${escapeHtml(expression)}
      </div>

      <div class="chapter-equation-label">
        (${escapeHtml(
          String(index + 1)
        )})
      </div>
    </div>
  `;
};

/* ==========================================================
   RÉFÉRENCE DANS LE TEXTE
   ========================================================== */

const renderCitation = (citation) => {
  if (!citation) return "";

  const text =
    typeof citation === "string"
      ? citation
      : citation.text ||
        citation.author ||
        citation.label ||
        "";

  if (!text) return "";

  return `
    <span class="chapter-citation">
      ${escapeHtml(text)}
    </span>
  `;
};

/* ==========================================================
   BLOC SCIENTIFIQUE
   ========================================================== */

const renderScientificBlock = (
  block,
  index = 0
) => {
  if (!block) return "";

  const type = safe(
    block.type ||
      block.kind ||
      "paragraph"
  ).toLowerCase();

  switch (type) {
    case "figure":
    case "image":
      return renderFigure(block, index);

    case "table":
      return renderTable(block, index);

    case "equation":
    case "formula":
      return renderEquation(block, index);

    case "citation":
      return renderCitation(block);

    case "list":
      return renderList(
        block.items || block.values,
        Boolean(block.ordered)
      );

    case "subsection":
      return renderSubsection(
        block,
        block.level || 2
      );

    default:
      return renderParagraph(
        block.content ||
          block.text ||
          block.body ||
          ""
      );
  }
};

/* ==========================================================
   SOUS-STRUCTURE PAR DÉFAUT
   ========================================================== */

const getDefaultSubsections = (
  chapterType
) => {
  switch (chapterType) {
    case "introduction":
      return [
        {
          title: "Contexte de l'étude",
        },
        {
          title: "Problématique",
        },
        {
          title: "Questions de recherche",
        },
        {
          title: "Hypothèses",
        },
        {
          title: "Objectifs de l'étude",
        },
        {
          title: "Intérêt de l'étude",
        },
      ];

    case "theoretical":
      return [
        {
          title: "Cadre conceptuel",
        },
        {
          title: "Revue de littérature",
        },
        {
          title: "Cadre théorique",
        },
        {
          title: "Travaux antérieurs",
        },
      ];

    case "methodology":
      return [
        {
          title: "Cadre et lieu de l'étude",
        },
        {
          title: "Population et échantillonnage",
        },
        {
          title: "Matériel et méthodes",
        },
        {
          title: "Procédure de collecte des données",
        },
        {
          title: "Méthodes d'analyse",
        },
        {
          title: "Considérations éthiques",
        },
      ];

    case "results":
      return [
        {
          title: "Présentation des résultats",
        },
        {
          title: "Résultats principaux",
        },
        {
          title: "Analyse descriptive",
        },
        {
          title: "Résultats complémentaires",
        },
      ];

    case "discussion":
      return [
        {
          title: "Interprétation des résultats",
        },
        {
          title: "Comparaison avec les travaux antérieurs",
        },
        {
          title: "Implications scientifiques",
        },
        {
          title: "Limites de l'étude",
        },
      ];

    case "synthesis":
      return [
        {
          title: "Synthèse des principaux résultats",
        },
        {
          title: "Apports de l'étude",
        },
        {
          title: "Perspectives",
        },
      ];

    default:
      return [
        {
          title: "Présentation et contexte",
        },
        {
          title: "Approche et démarche",
        },
        {
          title: "Analyse des éléments étudiés",
        },
        {
          title: "Résultats et observations",
        },
        {
          title: "Discussion",
        },
      ];
  }
};

/* ==========================================================
   EN-TÊTE DU CHAPITRE
   ========================================================== */

const renderChapterHeader = (
  chapter,
  number,
  design
) => {
  const title = cleanTitle(
    chapter?.title ||
      chapter?.name ||
      chapter?.heading,
    `Chapitre ${number}`
  );

  const type = getChapterType(chapter);

  const kicker =
    chapter?.kicker ||
    chapter?.subtitle ||
    `CHAPITRE ${number}`;

  const showNumber =
    chapter?.showNumber !== false;

  return `
    <header
      class="chapter-header"
      data-chapter-type="${escapeHtml(type)}"
    >
      <div class="chapter-kicker">
        ${escapeHtml(kicker)}
      </div>

      ${
        showNumber
          ? `
            <div class="chapter-number">
              ${escapeHtml(number)}
            </div>
          `
          : ""
      }

      <h1 class="chapter-title">
        ${escapeHtml(title)}
      </h1>

      ${
        chapter?.subtitle
          ? `
            <p class="chapter-subtitle">
              ${escapeHtml(
                chapter.subtitle
              )}
            </p>
          `
          : ""
      }

      <div class="chapter-title-rule"></div>
    </header>
  `;
};

/* ==========================================================
   CHAPITRE COMPLET
   ========================================================== */

export const renderChapter = (
  chapter = {},
  index = 0,
  design = {}
) => {
  const number = getChapterNumber(
    chapter,
    index
  );

  const type = getChapterType(chapter);

  const title = cleanTitle(
    chapter.title ||
      chapter.name ||
      chapter.heading,
    `Chapitre ${number}`
  );

  let html = `
    <section
      class="macevo-page macevo-chapter-page chapter-page"
      data-chapter="${escapeHtml(number)}"
      data-chapter-type="${escapeHtml(type)}"
    >

      ${renderChapterHeader(
        chapter,
        number,
        design
      )}

      <div class="chapter-content">
  `;

  /* --------------------------------------------------------
     Résumé / introduction courte du chapitre
  -------------------------------------------------------- */

  if (
    chapter.summary ||
    chapter.introduction
  ) {
    html += `
      <div class="chapter-lead">
        ${
          chapter.summary
            ? `
              <p class="chapter-summary">
                ${escapeHtml(
                  chapter.summary
                )}
              </p>
            `
            : ""
        }

        ${
          chapter.introduction
            ? `
              <div class="chapter-introduction">
                ${renderParagraph(
                  chapter.introduction
                )}
              </div>
            `
            : ""
        }
      </div>
    `;
  }

  /* --------------------------------------------------------
     Contenu HTML / texte principal
  -------------------------------------------------------- */

  if (chapter.content) {
    html += `
      <div class="chapter-main-content">
        ${renderParagraph(
          chapter.content
        )}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Paragraphes explicites
  -------------------------------------------------------- */

  if (chapter.paragraphs) {
    html += `
      <div class="chapter-paragraphs">
        ${normalizeArray(
          chapter.paragraphs
        )
          .map((paragraph) =>
            renderParagraph(paragraph)
          )
          .join("")}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Sous-sections fournies par le modèle
  -------------------------------------------------------- */

  let subsections =
    chapter.subsections ||
    chapter.sections ||
    chapter.children ||
    [];

  subsections = normalizeArray(
    subsections
  );

  /*
   * Si aucun contenu structuré n'est fourni,
   * on prépare une structure scientifique adaptée
   * au type du chapitre.
   */
  if (
    !subsections.length &&
    chapter.generateStructure !== false
  ) {
    subsections =
      getDefaultSubsections(type);
  }

  if (subsections.length) {
    html += `
      <div class="chapter-sections">
        ${subsections
          .map((subsection, subsectionIndex) =>
            renderSubsection(
              subsection,
              2,
              `${number}.${subsectionIndex + 1}`
            )
          )
          .join("")}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Blocs scientifiques
  -------------------------------------------------------- */

  if (chapter.blocks) {
    html += `
      <div class="chapter-scientific-blocks">
        ${normalizeArray(
          chapter.blocks
        )
          .map((block, blockIndex) =>
            renderScientificBlock(
              block,
              blockIndex
            )
          )
          .join("")}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Figures
  -------------------------------------------------------- */

  if (chapter.figures) {
    html += `
      <div class="chapter-figures">
        ${normalizeArray(
          chapter.figures
        )
          .map((figure, figureIndex) =>
            renderFigure(
              figure,
              figureIndex
            )
          )
          .join("")}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Tableaux
  -------------------------------------------------------- */

  if (chapter.tables) {
    html += `
      <div class="chapter-tables">
        ${normalizeArray(
          chapter.tables
        )
          .map((table, tableIndex) =>
            renderTable(
              table,
              tableIndex
            )
          )
          .join("")}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Équations
  -------------------------------------------------------- */

  if (chapter.equations) {
    html += `
      <div class="chapter-equations">
        ${normalizeArray(
          chapter.equations
        )
          .map((equation, equationIndex) =>
            renderEquation(
              equation,
              equationIndex
            )
          )
          .join("")}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Citation / note finale du chapitre
  -------------------------------------------------------- */

  if (chapter.note) {
    html += `
      <aside class="chapter-note">
        <strong>Note :</strong>
        ${escapeHtml(
          chapter.note
        )}
      </aside>
    `;
  }

  /* --------------------------------------------------------
     Synthèse finale
  -------------------------------------------------------- */

  if (
    chapter.synthesis ||
    chapter.summaryEnd
  ) {
    html += `
      <section class="chapter-synthesis">
        <h2 class="chapter-heading chapter-heading-synthesis">
          Synthèse
        </h2>

        ${renderParagraph(
          chapter.synthesis ||
            chapter.summaryEnd
        )}
      </section>
    `;
  }

  html += `
      </div>
    </section>
  `;

  return html;
};

/* ==========================================================
   COLLECTION DE CHAPITRES
   ========================================================== */

export const renderChapters = (
  chapters = [],
  design = {}
) => {
  const values = normalizeArray(
    chapters
  );

  if (!values.length) return "";

  return values
    .map((chapter, index) =>
      renderChapter(
        chapter,
        index,
        design
      )
    )
    .join("\n");
};

/* ==========================================================
   CHAPITRE DEPUIS UNE SECTION GÉNÉRIQUE
   ========================================================== */

export const renderChapterFromSection = (
  section = {},
  index = 0,
  design = {}
) => {
  return renderChapter(
    {
      ...section,
      title:
        section.title ||
        section.name ||
        `Chapitre ${index + 1}`,
      number:
        section.number ||
        index + 1,
    },
    index,
    design
  );
};

/* ==========================================================
   EXPORT PAR DÉFAUT
   ========================================================== */

export default {
  renderChapter,
  renderChapters,
  renderChapterFromSection,
};