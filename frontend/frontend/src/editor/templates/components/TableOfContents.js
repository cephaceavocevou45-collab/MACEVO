/**
 * ==========================================================
 * MACEVO — TEMPLATE ENGINE
 * ----------------------------------------------------------
 * Fichier : TableOfContents.js
 * Version : 1.0.0
 * Rôle    : Génération du sommaire / table des matières
 * ==========================================================
 */

import { escapeHtml } from "../TemplateEngine";

/* ==========================================================
   OUTILS
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

/* ==========================================================
   NORMALISATION D'UN ÉLÉMENT
   ========================================================== */

const normalizeEntry = (
  entry,
  index = 0
) => {
  if (!entry) {
    return {
      number: String(index + 1),
      title: `Section ${index + 1}`,
      level: 1,
      page: "",
      type: "section",
    };
  }

  if (typeof entry === "string") {
    return {
      number: String(index + 1),
      title: entry,
      level: 1,
      page: "",
      type: "section",
    };
  }

  return {
    number:
      entry.number !== undefined
        ? safe(entry.number)
        : String(index + 1),

    title:
      entry.title ||
      entry.name ||
      entry.heading ||
      `Section ${index + 1}`,

    level:
      Number(entry.level) > 0
        ? Number(entry.level)
        : 1,

    page:
      entry.page !== undefined
        ? safe(entry.page)
        : entry.pageNumber !== undefined
          ? safe(entry.pageNumber)
          : "",

    type:
      entry.type ||
      entry.kind ||
      "section",

    children:
      entry.children ||
      entry.subsections ||
      entry.sections ||
      [],
  };
};

/* ==========================================================
   CLASSIFICATION
   ========================================================== */

const getEntryClass = (entry) => {
  const type = safe(
    entry.type
  ).toLowerCase();

  if (
    type.includes("cover") ||
    type.includes("garde") ||
    type.includes("titre")
  ) {
    return "toc-cover-entry";
  }

  if (
    type.includes("preliminary") ||
    type.includes("preliminaire") ||
    type.includes("dedication") ||
    type.includes("dedicace") ||
    type.includes("acknowledg") ||
    type.includes("remerci")
  ) {
    return "toc-preliminary-entry";
  }

  if (
    type.includes("chapter") ||
    type.includes("chapitre")
  ) {
    return "toc-chapter-entry";
  }

  if (
    type.includes("conclusion")
  ) {
    return "toc-conclusion-entry";
  }

  if (
    type.includes("bibliograph") ||
    type.includes("reference")
  ) {
    return "toc-reference-entry";
  }

  if (
    type.includes("annex")
  ) {
    return "toc-annex-entry";
  }

  return "toc-section-entry";
};

/* ==========================================================
   POINTILLÉS + NUMÉRO DE PAGE
   ========================================================== */

const renderPageNumber = (
  page,
  showPageNumbers = true
) => {
  if (!showPageNumbers) {
    return "";
  }

  if (
    page === null ||
    page === undefined ||
    page === ""
  ) {
    return `
      <span class="toc-leader"></span>
      <span class="toc-page-number">
        —
      </span>
    `;
  }

  return `
    <span class="toc-leader"></span>

    <span class="toc-page-number">
      ${escapeHtml(page)}
    </span>
  `;
};

/* ==========================================================
   ENTRÉE SIMPLE
   ========================================================== */

const renderEntry = (
  entry,
  index,
  options = {}
) => {
  const normalized =
    normalizeEntry(entry, index);

  const {
    showPageNumbers = true,
    clickable = true,
  } = options;

  const level = Math.max(
    1,
    Math.min(
      normalized.level,
      4
    )
  );

  const className = getEntryClass(
    normalized
  );

  const number =
    normalized.number || "";

  const title =
    normalized.title || "";

  const targetId =
    normalized.id ||
    normalized.anchor ||
    `toc-section-${index + 1}`;

  const titleHtml = clickable
    ? `
        <a
          class="toc-entry-link"
          href="#${escapeHtml(
            targetId
          )}"
        >
          ${
            number
              ? `
                <span class="toc-entry-number">
                  ${escapeHtml(number)}
                </span>
              `
              : ""
          }

          <span class="toc-entry-title">
            ${escapeHtml(title)}
          </span>
        </a>
      `
    : `
        <span class="toc-entry-link">
          ${
            number
              ? `
                <span class="toc-entry-number">
                  ${escapeHtml(number)}
                </span>
              `
              : ""
          }

          <span class="toc-entry-title">
            ${escapeHtml(title)}
          </span>
        </span>
      `;

  return `
    <li
      class="
        toc-entry
        toc-entry-level-${level}
        ${className}
      "
      data-level="${level}"
      data-toc-index="${index + 1}"
    >

      <div class="toc-entry-row">

        ${titleHtml}

        ${renderPageNumber(
          normalized.page,
          showPageNumbers
        )}

      </div>

      ${
        normalized.children &&
        normalizeArray(
          normalized.children
        ).length
          ? `
            <ol class="toc-children">
              ${normalizeArray(
                normalized.children
              )
                .map(
                  (
                    child,
                    childIndex
                  ) =>
                    renderEntry(
                      {
                        ...child,
                        level:
                          Number(
                            child.level
                          ) ||
                          level + 1,
                      },
                      `${index}-${childIndex}`,
                      options
                    )
                )
                .join("")}
            </ol>
          `
          : ""
      }

    </li>
  `;
};

/* ==========================================================
   GROUPE
   ========================================================== */

const renderGroup = (
  title,
  entries,
  options = {}
) => {
  const values =
    normalizeArray(entries);

  if (!values.length) {
    return "";
  }

  return `
    <section class="toc-group">

      ${
        title
          ? `
            <h2 class="toc-group-title">
              ${escapeHtml(title)}
            </h2>
          `
          : ""
      }

      <ol class="toc-list">

        ${values
          .map(
            (entry, index) =>
              renderEntry(
                entry,
                index,
                options
              )
          )
          .join("")}

      </ol>

    </section>
  `;
};

/* ==========================================================
   CONSTRUCTION AUTOMATIQUE DEPUIS LES SECTIONS
   ========================================================== */

export const buildTableOfContents = (
  sections = []
) => {
  const values =
    normalizeArray(sections);

  return values.map(
    (section, index) => {
      const normalized =
        normalizeEntry(
          section,
          index
        );

      return {
        ...normalized,

        children:
          normalized.children
            ? normalizeArray(
                normalized.children
              ).map(
                (child, childIndex) =>
                  normalizeEntry(
                    {
                      ...child,
                      level:
                        Number(
                          child.level
                        ) ||
                        normalized.level +
                          1,
                    },
                    childIndex
                  )
              )
            : [],
      };
    }
  );
};

/* ==========================================================
   STRUCTURE ACADÉMIQUE PAR DÉFAUT
   ========================================================== */

export const getDefaultTableOfContents =
  () => [
    {
      number: "",
      title: "Dédicace",
      level: 1,
      type: "preliminary",
    },

    {
      number: "",
      title: "Remerciements",
      level: 1,
      type: "preliminary",
    },

    {
      number: "",
      title: "Résumé",
      level: 1,
      type: "preliminary",
    },

    {
      number: "",
      title: "Abstract",
      level: 1,
      type: "preliminary",
    },

    {
      number: "",
      title: "Liste des figures",
      level: 1,
      type: "preliminary",
    },

    {
      number: "",
      title: "Liste des tableaux",
      level: 1,
      type: "preliminary",
    },

    {
      number: "",
      title: "Liste des abréviations",
      level: 1,
      type: "preliminary",
    },

    {
      number: "1",
      title: "Introduction générale",
      level: 1,
      type: "chapter",

      children: [
        {
          number: "1.1",
          title: "Contexte de l'étude",
          level: 2,
        },

        {
          number: "1.2",
          title: "Problématique",
          level: 2,
        },

        {
          number: "1.3",
          title: "Questions de recherche",
          level: 2,
        },

        {
          number: "1.4",
          title: "Hypothèses",
          level: 2,
        },

        {
          number: "1.5",
          title: "Objectifs",
          level: 2,
        },
      ],
    },

    {
      number: "2",
      title: "Cadre théorique et revue de littérature",
      level: 1,
      type: "chapter",

      children: [
        {
          number: "2.1",
          title: "Cadre conceptuel",
          level: 2,
        },

        {
          number: "2.2",
          title: "Revue de littérature",
          level: 2,
        },

        {
          number: "2.3",
          title: "Cadre théorique",
          level: 2,
        },
      ],
    },

    {
      number: "3",
      title: "Méthodologie",
      level: 1,
      type: "chapter",

      children: [
        {
          number: "3.1",
          title: "Cadre de l'étude",
          level: 2,
        },

        {
          number: "3.2",
          title: "Population et échantillonnage",
          level: 2,
        },

        {
          number: "3.3",
          title: "Matériel et méthodes",
          level: 2,
        },

        {
          number: "3.4",
          title: "Analyse des données",
          level: 2,
        },
      ],
    },

    {
      number: "4",
      title: "Résultats",
      level: 1,
      type: "chapter",

      children: [
        {
          number: "4.1",
          title: "Présentation des résultats",
          level: 2,
        },

        {
          number: "4.2",
          title: "Résultats principaux",
          level: 2,
        },
      ],
    },

    {
      number: "5",
      title: "Discussion",
      level: 1,
      type: "chapter",

      children: [
        {
          number: "5.1",
          title: "Interprétation des résultats",
          level: 2,
        },

        {
          number: "5.2",
          title: "Comparaison avec la littérature",
          level: 2,
        },

        {
          number: "5.3",
          title: "Limites de l'étude",
          level: 2,
        },
      ],
    },

    {
      number: "",
      title: "Conclusion générale",
      level: 1,
      type: "conclusion",
    },

    {
      number: "",
      title: "Références bibliographiques",
      level: 1,
      type: "bibliography",
    },

    {
      number: "",
      title: "Annexes",
      level: 1,
      type: "annex",
    },
  ];

/* ==========================================================
   EN-TÊTE
   ========================================================== */

const renderTOCHeader = (
  options = {}
) => {
  const title =
    options.title ||
    "Table des matières";

  const kicker =
    options.kicker ||
    "SOMMAIRE";

  return `
    <header class="toc-header">

      <div class="toc-kicker">
        ${escapeHtml(kicker)}
      </div>

      <h1 class="toc-title">
        ${escapeHtml(title)}
      </h1>

      ${
        options.subtitle
          ? `
            <p class="toc-subtitle">
              ${escapeHtml(
                options.subtitle
              )}
            </p>
          `
          : ""
      }

      <div class="toc-title-rule"></div>

    </header>
  `;
};

/* ==========================================================
   TABLE DES MATIÈRES PRINCIPALE
   ========================================================== */

export const renderTableOfContents = (
  entries = [],
  options = {},
  design = {}
) => {
  let values =
    normalizeArray(entries);

  /*
   * Lorsque le moteur ne possède encore aucune
   * structure réelle, on fournit une structure
   * académique propre et modifiable.
   */
  if (!values.length) {
    values =
      getDefaultTableOfContents();
  }

  values =
    buildTableOfContents(values);

  const showPageNumbers =
    options.showPageNumbers !== false;

  const clickable =
    options.clickable !== false;

  return `
    <section
      class="
        macevo-page
        macevo-table-of-contents-page
        table-of-contents-page
      "
      data-section-type="table-of-contents"
    >

      ${renderTOCHeader(
        options
      )}

      <div class="toc-content">

        ${
          options.introduction
            ? `
              <div class="toc-introduction">
                <p>
                  ${escapeHtml(
                    options.introduction
                  )}
                </p>
              </div>
            `
            : ""
        }

        <nav
          class="toc-navigation"
          aria-label="Table des matières"
        >

          <ol class="toc-list">

            ${values
              .map(
                (entry, index) =>
                  renderEntry(
                    entry,
                    index,
                    {
                      showPageNumbers,
                      clickable,
                    }
                  )
              )
              .join("")}

          </ol>

        </nav>

      </div>

    </section>
  `;
};

/* ==========================================================
   SOMMAIRE COURT
   ========================================================== */

export const renderShortTableOfContents = (
  entries = [],
  options = {}
) => {
  let values =
    normalizeArray(entries);

  if (!values.length) {
    values =
      getDefaultTableOfContents();
  }

  values = values.filter(
    (entry) =>
      Number(
        entry.level || 1
      ) === 1
  );

  return `
    <section
      class="macevo-page macevo-short-toc-page"
      data-section-type="short-toc"
    >

      ${renderTOCHeader({
        ...options,
        title:
          options.title ||
          "Sommaire",
      })}

      <div class="toc-content">

        <ol class="toc-list toc-list-short">

          ${values
            .map(
              (entry, index) =>
                renderEntry(
                  entry,
                  index,
                  {
                    showPageNumbers:
                      options.showPageNumbers !==
                      false,

                    clickable:
                      options.clickable !==
                      false,
                  }
                )
            )
            .join("")}

        </ol>

      </div>

    </section>
  `;
};

/* ==========================================================
   LISTE DES CHAPITRES
   ========================================================== */

export const renderChapterOutline = (
  chapters = [],
  options = {}
) => {
  const values =
    normalizeArray(chapters);

  if (!values.length) {
    return "";
  }

  return `
    <section
      class="toc-chapter-outline"
      data-section-type="chapter-outline"
    >

      <h2 class="toc-group-title">
        Structure du document
      </h2>

      <ol class="toc-list">

        ${values
          .map(
            (chapter, index) =>
              renderEntry(
                {
                  ...chapter,
                  type: "chapter",
                  level: 1,
                },
                index,
                {
                  showPageNumbers:
                    options.showPageNumbers !==
                    false,

                  clickable:
                    options.clickable !==
                    false,
                }
              )
          )
          .join("")}

      </ol>

    </section>
  `;
};

/* ==========================================================
   EXPORT
   ========================================================== */

export default {
  renderTableOfContents,
  renderShortTableOfContents,
  renderChapterOutline,
  buildTableOfContents,
  getDefaultTableOfContents,
};