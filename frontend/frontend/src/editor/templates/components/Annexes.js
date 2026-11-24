/**
 * ==========================================================
 * MACEVO — TEMPLATE ENGINE
 * ----------------------------------------------------------
 * Fichier : Annexes.js
 * Version : 1.0.0
 * Rôle    : Génération des annexes scientifiques
 * ==========================================================
 */

import { escapeHtml, normalizeContent } from "../TemplateEngine";

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

const hasHtml = (value) => {
  return /<\/?[a-z][\s\S]*>/i.test(
    normalizeContent(value)
  );
};

/* ==========================================================
   CONTENU
   ========================================================== */

const renderContent = (content) => {
  const normalized = normalizeContent(content);

  if (!normalized) return "";

  if (hasHtml(normalized)) {
    return normalized;
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) => `
        <p class="annex-paragraph">
          ${escapeHtml(paragraph).replace(
            /\n/g,
            "<br />"
          )}
        </p>
      `
    )
    .join("");
};

/* ==========================================================
   LISTES
   ========================================================== */

const renderList = (
  items,
  ordered = false
) => {
  const values = normalizeArray(items);

  if (!values.length) return "";

  const tag = ordered ? "ol" : "ul";

  return `
    <${tag} class="annex-list ${
      ordered
        ? "annex-list-ordered"
        : "annex-list-unordered"
    }">

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

          return `
            <li>
              ${escapeHtml(item)}
            </li>
          `;
        })
        .join("")}

    </${tag}>
  `;
};

/* ==========================================================
   IMAGE
   ========================================================== */

const renderImage = (
  image,
  index = 0
) => {
  if (!image) return "";

  const src =
    image.src ||
    image.url ||
    image.path ||
    image.image ||
    "";

  const title =
    image.title ||
    image.caption ||
    `Illustration de l'annexe ${index + 1}`;

  const label =
    image.label ||
    `Illustration ${index + 1}`;

  if (!src) {
    return `
      <figure class="annex-figure annex-figure-placeholder">

        <div class="annex-placeholder-box">
          <span>
            Illustration / image
          </span>
        </div>

        <figcaption>
          <strong>
            ${escapeHtml(label)}.
          </strong>

          ${escapeHtml(title)}
        </figcaption>

      </figure>
    `;
  }

  return `
    <figure class="annex-figure">

      <div class="annex-image-container">

        <img
          src="${escapeHtml(src)}"
          alt="${escapeHtml(title)}"
        />

      </div>

      <figcaption>

        <strong>
          ${escapeHtml(label)}.
        </strong>

        ${escapeHtml(title)}

      </figcaption>

    </figure>
  `;
};

/* ==========================================================
   TABLEAU
   ========================================================== */

const renderTable = (
  table,
  index = 0
) => {
  if (!table) return "";

  const title =
    table.title ||
    table.caption ||
    `Tableau de l'annexe ${index + 1}`;

  const label =
    table.label ||
    `Tableau ${index + 1}`;

  const headers = normalizeArray(
    table.headers ||
      table.columns
  );

  const rows = normalizeArray(
    table.rows ||
      table.data
  );

  return `
    <figure class="annex-table">

      <figcaption class="annex-table-caption">

        <strong>
          ${escapeHtml(label)}.
        </strong>

        ${escapeHtml(title)}

      </figcaption>

      ${
        headers.length || rows.length
          ? `
            <div class="annex-table-wrapper">

              <table>

                ${
                  headers.length
                    ? `
                      <thead>
                        <tr>
                          ${headers
                            .map(
                              (header) => `
                                <th>
                                  ${escapeHtml(
                                    typeof header ===
                                      "object"
                                      ? header.label ||
                                          header.title ||
                                          ""
                                      : header
                                  )}
                                </th>
                              `
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
                          .map(
                            (row) => {
                              const cells =
                                Array.isArray(
                                  row
                                )
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
                                      (
                                        cell
                                      ) => `
                                        <td>
                                          ${escapeHtml(
                                            typeof cell ===
                                              "object"
                                              ? cell.value ||
                                                  cell.text ||
                                                  ""
                                              : cell
                                          )}
                                        </td>
                                      `
                                    )
                                    .join("")}
                                </tr>
                              `;
                            }
                          )
                          .join("")}
                      </tbody>
                    `
                    : ""
                }

              </table>

            </div>
          `
          : `
            <div class="annex-placeholder-box">
              Tableau à compléter
            </div>
          `
      }

    </figure>
  `;
};

/* ==========================================================
   DOCUMENT / PIÈCE JOINTE
   ========================================================== */

const renderDocument = (
  document,
  index = 0
) => {
  if (!document) return "";

  const title =
    document.title ||
    document.name ||
    `Document ${index + 1}`;

  const description =
    document.description ||
    document.content ||
    "";

  const url =
    document.url ||
    document.href ||
    "";

  return `
    <div class="annex-document">

      <div class="annex-document-header">

        <span class="annex-document-icon">
          DOC
        </span>

        <div>

          <h3 class="annex-document-title">
            ${escapeHtml(title)}
          </h3>

          ${
            description
              ? `
                <p class="annex-document-description">
                  ${escapeHtml(
                    description
                  )}
                </p>
              `
              : ""
          }

        </div>

      </div>

      ${
        url
          ? `
            <p class="annex-document-reference">
              Source :
              ${escapeHtml(url)}
            </p>
          `
          : ""
      }

    </div>
  `;
};

/* ==========================================================
   FORMULAIRE
   ========================================================== */

const renderForm = (
  form
) => {
  if (!form) return "";

  const title =
    form.title ||
    "Formulaire / questionnaire";

  const description =
    form.description ||
    "";

  const fields =
    normalizeArray(
      form.fields
    );

  return `
    <section class="annex-form">

      <h3 class="annex-form-title">
        ${escapeHtml(title)}
      </h3>

      ${
        description
          ? `
            <p class="annex-form-description">
              ${escapeHtml(
                description
              )}
            </p>
          `
          : ""
      }

      ${
        fields.length
          ? `
            <div class="annex-form-fields">

              ${fields
                .map(
                  (field, index) => `
                    <div class="annex-form-field">

                      <span class="annex-form-field-number">
                        ${index + 1}.
                      </span>

                      <span class="annex-form-field-label">
                        ${escapeHtml(
                          typeof field ===
                            "object"
                            ? field.label ||
                                field.title ||
                                ""
                            : field
                        )}
                      </span>

                      <div class="annex-form-field-line">
                      </div>

                    </div>
                  `
                )
                .join("")}

            </div>
          `
          : ""
      }

    </section>
  `;
};

/* ==========================================================
   ANNEXE INDIVIDUELLE
   ========================================================== */

export const renderAnnex = (
  annex = {},
  index = 0,
  design = {}
) => {
  const letter =
    annex.letter ||
    annex.label ||
    String.fromCharCode(
      65 + index
    );

  const title =
    annex.title ||
    annex.name ||
    `Annexe ${letter}`;

  const type = safe(
    annex.type ||
      annex.kind ||
      "document"
  ).toLowerCase();

  let html = `
    <section
      class="macevo-page macevo-annex-page annex-page"
      data-annex="${escapeHtml(
        letter
      )}"
      data-annex-index="${index + 1}"
    >

      <header class="annex-header">

        <div class="annex-kicker">
          ANNEXE
        </div>

        <div class="annex-letter">
          ${escapeHtml(letter)}
        </div>

        <h1 class="annex-title">
          ${escapeHtml(title)}
        </h1>

        ${
          annex.subtitle
            ? `
              <p class="annex-subtitle">
                ${escapeHtml(
                  annex.subtitle
                )}
              </p>
            `
            : ""
        }

        <div class="annex-title-rule"></div>

      </header>

      <div class="annex-content">
  `;

  /* --------------------------------------------------------
     Description
  -------------------------------------------------------- */

  if (
    annex.description ||
    annex.introduction
  ) {
    html += `
      <div class="annex-introduction">
        ${renderContent(
          annex.description ||
            annex.introduction
        )}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Contenu principal
  -------------------------------------------------------- */

  if (annex.content) {
    html += `
      <div class="annex-main-content">
        ${renderContent(
          annex.content
        )}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Type image
  -------------------------------------------------------- */

  if (
    type === "image" ||
    type === "figure"
  ) {
    html += renderImage(
      annex,
      index
    );
  }

  /* --------------------------------------------------------
     Type tableau
  -------------------------------------------------------- */

  if (type === "table") {
    html += renderTable(
      annex,
      index
    );
  }

  /* --------------------------------------------------------
     Type document
  -------------------------------------------------------- */

  if (
    type === "document" ||
    type === "file" ||
    type === "attachment"
  ) {
    if (
      annex.document ||
      annex.file ||
      annex.url
    ) {
      html += renderDocument(
        annex.document || {
          ...annex,
          url:
            annex.url ||
            annex.file,
        },
        index
      );
    }
  }

  /* --------------------------------------------------------
     Type formulaire
  -------------------------------------------------------- */

  if (
    type === "form" ||
    type === "questionnaire" ||
    type === "survey"
  ) {
    html += renderForm(
      annex.form || annex
    );
  }

  /* --------------------------------------------------------
     Listes
  -------------------------------------------------------- */

  if (annex.items) {
    html += renderList(
      annex.items,
      Boolean(annex.ordered)
    );
  }

  if (annex.list) {
    html += renderList(
      annex.list,
      Boolean(annex.ordered)
    );
  }

  /* --------------------------------------------------------
     Images multiples
  -------------------------------------------------------- */

  if (annex.images) {
    html += `
      <div class="annex-images">

        ${normalizeArray(
          annex.images
        )
          .map(
            (image, imageIndex) =>
              renderImage(
                image,
                imageIndex
              )
          )
          .join("")}

      </div>
    `;
  }

  /* --------------------------------------------------------
     Tableaux multiples
  -------------------------------------------------------- */

  if (annex.tables) {
    html += `
      <div class="annex-tables">

        ${normalizeArray(
          annex.tables
        )
          .map(
            (table, tableIndex) =>
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
     Documents multiples
  -------------------------------------------------------- */

  if (annex.documents) {
    html += `
      <div class="annex-documents">

        ${normalizeArray(
          annex.documents
        )
          .map(
            (document, documentIndex) =>
              renderDocument(
                document,
                documentIndex
              )
          )
          .join("")}

      </div>
    `;
  }

  /* --------------------------------------------------------
     Formulaires multiples
  -------------------------------------------------------- */

  if (annex.forms) {
    html += `
      <div class="annex-forms">

        ${normalizeArray(
          annex.forms
        )
          .map((form) =>
            renderForm(form)
          )
          .join("")}

      </div>
    `;
  }

  /* --------------------------------------------------------
     Source
  -------------------------------------------------------- */

  if (annex.source) {
    html += `
      <p class="annex-source">
        <strong>Source :</strong>
        ${escapeHtml(
          annex.source
        )}
      </p>
    `;
  }

  html += `
      </div>
    </section>
  `;

  return html;
};

/* ==========================================================
   COLLECTION D'ANNEXES
   ========================================================== */

export const renderAnnexes = (
  annexes = [],
  design = {}
) => {
  const values =
    normalizeArray(annexes);

  if (!values.length) {
    return "";
  }

  return values
    .map((annex, index) =>
      renderAnnex(
        annex,
        index,
        design
      )
    )
    .join("\n");
};

/* ==========================================================
   PAGE D'INTRODUCTION DES ANNEXES
   ========================================================== */

export const renderAnnexesIntro = (
  annexes = [],
  design = {}
) => {
  const values =
    normalizeArray(annexes);

  if (!values.length) return "";

  return `
    <section
      class="macevo-page macevo-annexes-intro-page annexes-intro-page"
      data-section-type="annexes-introduction"
    >

      <div class="annexes-intro-content">

        <div class="annex-kicker">
          DOCUMENT COMPLÉMENTAIRE
        </div>

        <h1 class="annexes-intro-title">
          Annexes
        </h1>

        <div class="annex-title-rule"></div>

        <p class="annexes-intro-description">
          Les annexes regroupent les documents,
          données, instruments de collecte,
          tableaux, figures et autres éléments
          complémentaires nécessaires à la
          compréhension et à la vérification
          du présent travail scientifique.
        </p>

        <ol class="annexes-summary-list">

          ${values
            .map(
              (annex, index) => `
                <li>

                  <span class="annex-summary-letter">
                    ${escapeHtml(
                      annex.letter ||
                        annex.label ||
                        String.fromCharCode(
                          65 + index
                        )
                    )}
                  </span>

                  <span>
                    ${escapeHtml(
                      annex.title ||
                        annex.name ||
                        `Annexe ${
                          index + 1
                        }`
                    )}
                  </span>

                </li>
              `
            )
            .join("")}

        </ol>

      </div>

    </section>
  `;
};

/* ==========================================================
   STRUCTURE PAR DÉFAUT
   ========================================================== */

export const getDefaultAnnexes = () => [
  {
    letter: "A",
    title:
      "Instrument de collecte des données",
    type: "form",
    form: {
      title:
        "Questionnaire / guide d'entretien",
      fields: [
        "Question 1",
        "Question 2",
        "Question 3",
      ],
    },
  },
  {
    letter: "B",
    title:
      "Données complémentaires",
    type: "table",
    headers: [
      "Variable",
      "Valeur",
      "Observation",
    ],
    rows: [
      [
        "Variable 1",
        "—",
        "À compléter",
      ],
      [
        "Variable 2",
        "—",
        "À compléter",
      ],
    ],
  },
];

/* ==========================================================
   ANNEXES SCIENTIFIQUES
   ========================================================== */

export const renderScientificAnnexes = (
  annexes = [],
  design = {}
) => {
  const values =
    normalizeArray(annexes).length
      ? normalizeArray(annexes)
      : getDefaultAnnexes();

  return `
    ${renderAnnexesIntro(
      values,
      design
    )}

    ${renderAnnexes(
      values,
      design
    )}
  `;
};

/* ==========================================================
   EXPORT
   ========================================================== */

export default {
  renderAnnex,
  renderAnnexes,
  renderAnnexesIntro,
  renderScientificAnnexes,
  getDefaultAnnexes,
};