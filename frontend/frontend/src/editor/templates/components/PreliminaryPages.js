/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : PreliminaryPages.js
 * Version : 1.0.0
 * Statut  : Pages préliminaires professionnelles
 * ==========================================================
 */

import {
  escapeHtml,
  normalizeContent,
} from "../TemplateEngine";

/* ==========================================================
   UTILITAIRES
   ========================================================== */

function getContent(section, fallback = "") {
  if (!section) return fallback;

  const content =
    section.content ||
    section.html ||
    section.body ||
    section.text ||
    "";

  return content
    ? normalizeContent(content)
    : fallback;
}

function getTitle(section, fallback) {
  return escapeHtml(
    section?.title ||
      section?.name ||
      section?.label ||
      fallback
  );
}

function getDesign(template = {}, data = {}) {
  return (
    data?.design ||
    template?.design ||
    template?.styles ||
    {}
  );
}

function getColors(template = {}, data = {}) {
  const design = getDesign(template, data);

  return {
    primary:
      design.primary ||
      design.primaryColor ||
      "#1d4ed8",

    secondary:
      design.secondary ||
      design.secondaryColor ||
      "#475569",

    accent:
      design.accent ||
      design.accentColor ||
      design.primary ||
      "#1d4ed8",

    text:
      design.text ||
      design.textColor ||
      "#111827",

    muted:
      design.muted ||
      design.mutedColor ||
      "#64748b",

    border:
      design.border ||
      design.borderColor ||
      "#e2e8f0",
  };
}

/* ==========================================================
   PAGE GÉNÉRIQUE PRÉLIMINAIRE
   ========================================================== */

function renderPreliminaryPage(
  section,
  template,
  data,
  options = {}
) {
  const colors = getColors(
    template,
    data
  );

  const title = getTitle(
    section,
    options.title || "Page préliminaire"
  );

  const content = getContent(
    section,
    options.fallback || `
      <p>
        Contenu à compléter.
      </p>
    `
  );

  return `
    <section
      class="macevo-page macevo-preliminary-page"
      data-page-type="preliminary"
      data-section-id="${escapeHtml(
        section?.id ||
          section?.slug ||
          options.type ||
          "preliminary"
      )}"
      style="
        --preliminary-primary:${colors.primary};
        --preliminary-secondary:${colors.secondary};
        --preliminary-accent:${colors.accent};
        --preliminary-text:${colors.text};
        --preliminary-muted:${colors.muted};
        --preliminary-border:${colors.border};
      "
    >

      <div class="preliminary-inner">

        <header class="preliminary-header">

          ${
            options.kicker
              ? `
                <div class="preliminary-kicker">
                  ${escapeHtml(
                    options.kicker
                  )}
                </div>
              `
              : ""
          }

          <h1 class="preliminary-title">
            ${title}
          </h1>

          ${
            options.showRule !== false
              ? `
                <div class="preliminary-rule"></div>
              `
              : ""
          }

        </header>

        <div class="preliminary-content">
          ${content}
        </div>

      </div>

    </section>
  `;
}

/* ==========================================================
   DÉDICACE
   ========================================================== */

export function renderDedication(
  section = {},
  template,
  data = {}
) {
  const content = getContent(
    section,
    `
      <p>
        À toutes les personnes qui ont contribué,
        de près ou de loin, à la réalisation de ce travail.
      </p>
    `
  );

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "dedication",
      title: "Dédicace",
      showRule: false,
    }
  ).replace(
    'class="preliminary-content"',
    'class="preliminary-content dedication-content"'
  );
}

/* ==========================================================
   REMERCIEMENTS
   ========================================================== */

export function renderAcknowledgements(
  section = {},
  template,
  data = {}
) {
  const content = getContent(
    section,
    `
      <p>
        Au terme de ce travail, nous tenons à exprimer
        notre profonde gratitude à toutes les personnes
        et institutions qui ont contribué à sa réalisation.
      </p>

      <p>
        Nous remercions particulièrement nos enseignants,
        nos encadreurs, nos collaborateurs ainsi que toutes
        les personnes ayant apporté leur soutien scientifique,
        technique ou moral.
      </p>
    `
  );

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "acknowledgements",
      title: "Remerciements",
      kicker: "REMERCIEMENTS",
    }
  );
}

/* ==========================================================
   RÉSUMÉ
   ========================================================== */

export function renderSummary(
  section = {},
  template,
  data = {}
) {
  const content =
    getContent(section) ||
    (
      data.abstract
        ? normalizeContent(data.abstract)
        : `
          <p>
            Le résumé présente de manière synthétique
            le contexte de l'étude, la problématique,
            les objectifs, la méthodologie, les principaux
            résultats et la conclusion.
          </p>
        `
    );

  const keywords = Array.isArray(
    data.keywords
  )
    ? data.keywords
    : String(data.keywords || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const keywordHtml = keywords.length
    ? keywords
        .map(
          (keyword) => `
            <span class="keyword">
              ${escapeHtml(keyword)}
            </span>
          `
        )
        .join("")
    : `
      <span class="keyword keyword-placeholder">
        À compléter
      </span>
    `;

  return renderPreliminaryPage(
    {
      ...section,
      title:
        section.title ||
        "Résumé",
      content: `
        ${content}

        <div class="scientific-keywords">
          <strong>Mots-clés :</strong>
          <div class="keyword-list">
            ${keywordHtml}
          </div>
        </div>
      `,
    },
    template,
    data,
    {
      type: "summary",
      title: "Résumé",
      kicker: "SYNTHÈSE",
    }
  );
}

/* ==========================================================
   ABSTRACT
   ========================================================== */

export function renderAbstract(
  section = {},
  template,
  data = {}
) {
  const content = getContent(
    section,
    `
      <p>
        This abstract provides a concise presentation
        of the research context, problem statement,
        objectives, methodology, main findings
        and conclusion.
      </p>
    `
  );

  const keywords =
    Array.isArray(data.keywords)
      ? data.keywords
      : [];

  const keywordHtml = keywords.length
    ? keywords
        .map(
          (keyword) => `
            <span class="keyword">
              ${escapeHtml(keyword)}
            </span>
          `
        )
        .join("")
    : `
      <span class="keyword keyword-placeholder">
        To be completed
      </span>
    `;

  return renderPreliminaryPage(
    {
      ...section,
      title:
        section.title ||
        "Abstract",
      content: `
        ${content}

        <div class="scientific-keywords">
          <strong>Keywords:</strong>

          <div class="keyword-list">
            ${keywordHtml}
          </div>
        </div>
      `,
    },
    template,
    data,
    {
      type: "abstract",
      title: "Abstract",
      kicker: "ABSTRACT",
    }
  );
}

/* ==========================================================
   AVANT-PROPOS
   ========================================================== */

export function renderForeword(
  section = {},
  template,
  data = {}
) {
  const content = getContent(
    section,
    `
      <p>
        Présenter ici les informations introductives
        nécessaires à la compréhension du document et
        de son contexte académique.
      </p>
    `
  );

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "foreword",
      title: "Avant-propos",
      kicker: "AVANT-PROPOS",
    }
  );
}

/* ==========================================================
   PRÉFACE
   ========================================================== */

export function renderPreface(
  section = {},
  template,
  data = {}
) {
  const content = getContent(
    section,
    `
      <p>
        Présenter ici la préface du document.
      </p>
    `
  );

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "preface",
      title: "Préface",
      kicker: "PRÉFACE",
    }
  );
}

/* ==========================================================
   LISTE DES ABRÉVIATIONS
   ========================================================== */

export function renderAbbreviations(
  section = {},
  template,
  data = {}
) {
  const abbreviations =
    data.abbreviations ||
    section.abbreviations ||
    [];

  let content = "";

  if (
    Array.isArray(abbreviations) &&
    abbreviations.length
  ) {
    content = `
      <div class="abbreviation-list">

        ${abbreviations
          .map((item) => {
            const abbreviation =
              typeof item === "string"
                ? item
                : item.abbreviation ||
                  item.code ||
                  "";

            const meaning =
              typeof item === "string"
                ? ""
                : item.meaning ||
                  item.definition ||
                  "";

            return `
              <div class="abbreviation-row">

                <strong>
                  ${escapeHtml(
                    abbreviation
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    meaning
                  )}
                </span>

              </div>
            `;
          })
          .join("")}

      </div>
    `;
  } else {
    content = `
      <div class="abbreviation-list">

        <div class="abbreviation-row">
          <strong>À compléter</strong>
          <span>Signification de l'abréviation</span>
        </div>

        <div class="abbreviation-row">
          <strong>Ex.</strong>
          <span>Exemple</span>
        </div>

      </div>
    `;
  }

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "abbreviations",
      title: "Liste des abréviations",
      kicker: "ABRÉVIATIONS",
    }
  );
}

/* ==========================================================
   LISTE DES FIGURES
   ========================================================== */

export function renderFiguresList(
  section = {},
  template,
  data = {}
) {
  const figures =
    data.figures ||
    section.figures ||
    [];

  const content =
    Array.isArray(figures) &&
    figures.length
      ? `
        <div class="preliminary-index">

          ${figures
            .map(
              (figure, index) => `
                <div class="index-entry">

                  <span>
                    Figure ${index + 1}
                    —
                    ${escapeHtml(
                      figure?.title ||
                        figure?.caption ||
                        `Figure ${index + 1}`
                    )}
                  </span>

                  <span class="index-leader"></span>

                  <span>
                    ${escapeHtml(
                      figure?.page ||
                        String(index + 1)
                    )}
                  </span>

                </div>
              `
            )
            .join("")}

        </div>
      `
      : `
        <div class="preliminary-index">

          <div class="index-entry">

            <span>
              Aucune figure enregistrée
            </span>

            <span class="index-leader"></span>

            <span>—</span>

          </div>

        </div>
      `;

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "figures",
      title: "Liste des figures",
      kicker: "FIGURES",
    }
  );
}

/* ==========================================================
   LISTE DES TABLEAUX
   ========================================================== */

export function renderTablesList(
  section = {},
  template,
  data = {}
) {
  const tables =
    data.tables ||
    section.tables ||
    [];

  const content =
    Array.isArray(tables) &&
    tables.length
      ? `
        <div class="preliminary-index">

          ${tables
            .map(
              (table, index) => `
                <div class="index-entry">

                  <span>
                    Tableau ${index + 1}
                    —
                    ${escapeHtml(
                      table?.title ||
                        table?.caption ||
                        `Tableau ${index + 1}`
                    )}
                  </span>

                  <span class="index-leader"></span>

                  <span>
                    ${escapeHtml(
                      table?.page ||
                        String(index + 1)
                    )}
                  </span>

                </div>
              `
            )
            .join("")}

        </div>
      `
      : `
        <div class="preliminary-index">

          <div class="index-entry">

            <span>
              Aucun tableau enregistré
            </span>

            <span class="index-leader"></span>

            <span>—</span>

          </div>

        </div>
      `;

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "tables",
      title: "Liste des tableaux",
      kicker: "TABLEAUX",
    }
  );
}

/* ==========================================================
   LISTE DES ÉQUATIONS
   ========================================================== */

export function renderEquationsList(
  section = {},
  template,
  data = {}
) {
  const equations =
    data.equations ||
    section.equations ||
    [];

  const content =
    Array.isArray(equations) &&
    equations.length
      ? `
        <div class="preliminary-index">

          ${equations
            .map(
              (equation, index) => `
                <div class="index-entry">

                  <span>
                    Équation ${index + 1}
                    —
                    ${escapeHtml(
                      equation?.title ||
                        equation?.label ||
                        `Équation ${index + 1}`
                    )}
                  </span>

                  <span class="index-leader"></span>

                  <span>
                    ${escapeHtml(
                      equation?.page ||
                        String(index + 1)
                    )}
                  </span>

                </div>
              `
            )
            .join("")}

        </div>
      `
      : `
        <p>
          Aucune équation enregistrée.
        </p>
      `;

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "equations",
      title: "Liste des équations",
      kicker: "ÉQUATIONS",
    }
  );
}

/* ==========================================================
   MOTS-CLÉS
   ========================================================== */

export function renderKeywords(
  section = {},
  template,
  data = {}
) {
  const keywords =
    Array.isArray(data.keywords)
      ? data.keywords
      : String(
          data.keywords || ""
        )
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

  const content = `
    <div class="keyword-page">

      <p>
        Les principaux mots-clés associés
        au présent travail sont :
      </p>

      <div class="keyword-list keyword-list-large">

        ${
          keywords.length
            ? keywords
                .map(
                  (keyword) => `
                    <span class="keyword">
                      ${escapeHtml(keyword)}
                    </span>
                  `
                )
                .join("")
            : `
              <span class="keyword keyword-placeholder">
                À compléter
              </span>
            `
        }

      </div>

    </div>
  `;

  return renderPreliminaryPage(
    {
      ...section,
      content,
    },
    template,
    data,
    {
      type: "keywords",
      title: "Mots-clés",
      kicker: "MOTS-CLÉS",
    }
  );
}

/* ==========================================================
   FONCTION PRINCIPALE
   ========================================================== */

export function renderPreliminaryPageByType(
  section = {},
  template,
  data = {}
) {
  const rawType = String(
    section.type ||
      section.category ||
      section.id ||
      section.slug ||
      section.title ||
      ""
  ).toLowerCase();

  /*
   * Dédicace
   */
  if (
    rawType.includes("dedication") ||
    rawType.includes("dédicace")
  ) {
    return renderDedication(
      section,
      template,
      data
    );
  }

  /*
   * Remerciements
   */
  if (
    rawType.includes("acknowledg") ||
    rawType.includes("remerciement")
  ) {
    return renderAcknowledgements(
      section,
      template,
      data
    );
  }

  /*
   * Résumé
   */
  if (
    rawType.includes("résumé") ||
    rawType.includes("resume") ||
    rawType.includes("summary")
  ) {
    return renderSummary(
      section,
      template,
      data
    );
  }

  /*
   * Abstract anglais
   */
  if (
    rawType.includes("abstract")
  ) {
    return renderAbstract(
      section,
      template,
      data
    );
  }

  /*
   * Avant-propos
   */
  if (
    rawType.includes("foreword") ||
    rawType.includes("avant-propos")
  ) {
    return renderForeword(
      section,
      template,
      data
    );
  }

  /*
   * Préface
   */
  if (
    rawType.includes("preface") ||
    rawType.includes("préface")
  ) {
    return renderPreface(
      section,
      template,
      data
    );
  }

  /*
   * Abréviations
   */
  if (
    rawType.includes("abbreviation") ||
    rawType.includes("abréviation") ||
    rawType.includes("abreviation")
  ) {
    return renderAbbreviations(
      section,
      template,
      data
    );
  }

  /*
   * Figures
   */
  if (
    rawType.includes("figure") ||
    rawType.includes("illustration")
  ) {
    return renderFiguresList(
      section,
      template,
      data
    );
  }

  /*
   * Tableaux
   */
  if (
    rawType.includes("table")
  ) {
    return renderTablesList(
      section,
      template,
      data
    );
  }

  /*
   * Équations
   */
  if (
    rawType.includes("equation") ||
    rawType.includes("équation")
  ) {
    return renderEquationsList(
      section,
      template,
      data
    );
  }

  /*
   * Mots-clés
   */
  if (
    rawType.includes("keyword") ||
    rawType.includes("mot-clé") ||
    rawType.includes("mot clé")
  ) {
    return renderKeywords(
      section,
      template,
      data
    );
  }

  /*
   * Fallback
   */
  return renderPreliminaryPage(
    section,
    template,
    data
  );
}

/* ==========================================================
   EXPORT PAR DÉFAUT
   ========================================================== */

export default {
  renderPreliminaryPage,
  renderPreliminaryPageByType,
  renderDedication,
  renderAcknowledgements,
  renderSummary,
  renderAbstract,
  renderForeword,
  renderPreface,
  renderAbbreviations,
  renderFiguresList,
  renderTablesList,
  renderEquationsList,
  renderKeywords,
};