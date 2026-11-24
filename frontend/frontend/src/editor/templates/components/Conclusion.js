/**
 * ==========================================================
 * MACEVO — TEMPLATE ENGINE
 * ----------------------------------------------------------
 * Fichier : Conclusion.js
 * Version : 1.0.0
 * Rôle    : Génération de la conclusion scientifique
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

const renderText = (content) => {
  const normalized = normalizeContent(content);

  if (!normalized) return "";

  /*
   * Permet de conserver le HTML déjà fourni
   * par l'utilisateur ou par le moteur de modèle.
   */
  if (/<\/?[a-z][\s\S]*>/i.test(normalized)) {
    return normalized;
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) => `
        <p class="conclusion-paragraph">
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
   LISTE
   ========================================================== */

const renderList = (
  items,
  ordered = false
) => {
  const values = normalizeArray(items);

  if (!values.length) return "";

  const tag = ordered ? "ol" : "ul";

  return `
    <${tag} class="conclusion-list ${
      ordered
        ? "conclusion-list-ordered"
        : "conclusion-list-unordered"
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
   SECTION DE CONCLUSION
   ========================================================== */

const renderConclusionSection = (
  section,
  index = 0
) => {
  if (!section) return "";

  const title =
    section.title ||
    section.name ||
    section.heading ||
    `Élément ${index + 1}`;

  const content =
    section.content ||
    section.text ||
    section.body ||
    "";

  return `
    <section
      class="conclusion-subsection"
      data-conclusion-section="${index + 1}"
    >
      <h2 class="conclusion-heading">
        ${escapeHtml(title)}
      </h2>

      ${
        content
          ? renderText(content)
          : ""
      }

      ${
        section.items
          ? renderList(
              section.items,
              Boolean(section.ordered)
            )
          : ""
      }

      ${
        section.list
          ? renderList(
              section.list,
              Boolean(section.ordered)
            )
          : ""
      }
    </section>
  `;
};

/* ==========================================================
   STRUCTURE PAR DÉFAUT
   ========================================================== */

const getDefaultConclusionSections = () => [
  {
    title: "Synthèse des principaux résultats",
  },
  {
    title: "Réponse à la problématique",
  },
  {
    title: "Apports de l'étude",
  },
  {
    title: "Limites de l'étude",
  },
  {
    title: "Perspectives",
  },
];

/* ==========================================================
   EN-TÊTE
   ========================================================== */

const renderConclusionHeader = (
  conclusion,
  design = {}
) => {
  const number =
    conclusion.number !== undefined
      ? safe(conclusion.number)
      : "";

  const kicker =
    conclusion.kicker ||
    "CONCLUSION";

  const title =
    conclusion.title ||
    "Conclusion générale";

  return `
    <header
      class="conclusion-header"
      data-conclusion-style="${
        escapeHtml(
          design?.layout?.sectionStyle ||
            "numbered"
        )
      }"
    >

      <div class="conclusion-kicker">
        ${escapeHtml(kicker)}
      </div>

      ${
        number
          ? `
            <div class="conclusion-number">
              ${escapeHtml(number)}
            </div>
          `
          : ""
      }

      <h1 class="conclusion-title">
        ${escapeHtml(title)}
      </h1>

      ${
        conclusion.subtitle
          ? `
            <p class="conclusion-subtitle">
              ${escapeHtml(
                conclusion.subtitle
              )}
            </p>
          `
          : ""
      }

      <div class="conclusion-title-rule"></div>

    </header>
  `;
};

/* ==========================================================
   CONCLUSION GÉNÉRALE
   ========================================================== */

export const renderConclusion = (
  conclusion = {},
  design = {}
) => {
  const sections = normalizeArray(
    conclusion.sections
  );

  const finalSections =
    sections.length
      ? sections
      : conclusion.generateStructure !==
          false
        ? getDefaultConclusionSections()
        : [];

  let html = `
    <section
      class="macevo-page macevo-conclusion-page conclusion-page"
      data-section-type="conclusion"
    >

      ${renderConclusionHeader(
        conclusion,
        design
      )}

      <div class="conclusion-content">
  `;

  /* --------------------------------------------------------
     Introduction de la conclusion
  -------------------------------------------------------- */

  if (
    conclusion.introduction ||
    conclusion.opening
  ) {
    html += `
      <div class="conclusion-opening">
        ${renderText(
          conclusion.introduction ||
            conclusion.opening
        )}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Texte principal
  -------------------------------------------------------- */

  if (conclusion.content) {
    html += `
      <div class="conclusion-main-content">
        ${renderText(
          conclusion.content
        )}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Résultats principaux
  -------------------------------------------------------- */

  if (
    conclusion.mainFindings ||
    conclusion.keyResults
  ) {
    html += `
      <section class="conclusion-subsection conclusion-findings">

        <h2 class="conclusion-heading">
          Principaux résultats
        </h2>

        ${renderText(
          conclusion.mainFindings ||
            conclusion.keyResults
        )}

      </section>
    `;
  }

  /* --------------------------------------------------------
     Réponse à la problématique
  -------------------------------------------------------- */

  if (
    conclusion.problemAnswer ||
    conclusion.answer
  ) {
    html += `
      <section class="conclusion-subsection conclusion-problem-answer">

        <h2 class="conclusion-heading">
          Réponse à la problématique
        </h2>

        ${renderText(
          conclusion.problemAnswer ||
            conclusion.answer
        )}

      </section>
    `;
  }

  /* --------------------------------------------------------
     Objectifs atteints
  -------------------------------------------------------- */

  if (
    conclusion.objectives ||
    conclusion.objectivesAchieved
  ) {
    html += `
      <section class="conclusion-subsection conclusion-objectives">

        <h2 class="conclusion-heading">
          Atteinte des objectifs
        </h2>

        ${
          typeof (
            conclusion.objectives ||
            conclusion.objectivesAchieved
          ) === "string"
            ? renderText(
                conclusion.objectives ||
                  conclusion.objectivesAchieved
              )
            : renderList(
                conclusion.objectives ||
                  conclusion.objectivesAchieved
              )
        }

      </section>
    `;
  }

  /* --------------------------------------------------------
     Apports
  -------------------------------------------------------- */

  if (
    conclusion.contributions ||
    conclusion.contribution
  ) {
    html += `
      <section class="conclusion-subsection conclusion-contributions">

        <h2 class="conclusion-heading">
          Apports de l'étude
        </h2>

        ${
          typeof (
            conclusion.contributions ||
            conclusion.contribution
          ) === "string"
            ? renderText(
                conclusion.contributions ||
                  conclusion.contribution
              )
            : renderList(
                conclusion.contributions ||
                  conclusion.contribution
              )
        }

      </section>
    `;
  }

  /* --------------------------------------------------------
     Limites
  -------------------------------------------------------- */

  if (
    conclusion.limitations ||
    conclusion.limits
  ) {
    html += `
      <section class="conclusion-subsection conclusion-limitations">

        <h2 class="conclusion-heading">
          Limites de l'étude
        </h2>

        ${
          typeof (
            conclusion.limitations ||
            conclusion.limits
          ) === "string"
            ? renderText(
                conclusion.limitations ||
                  conclusion.limits
              )
            : renderList(
                conclusion.limitations ||
                  conclusion.limits
              )
        }

      </section>
    `;
  }

  /* --------------------------------------------------------
     Recommandations
  -------------------------------------------------------- */

  if (
    conclusion.recommendations ||
    conclusion.recommendation
  ) {
    html += `
      <section class="conclusion-subsection conclusion-recommendations">

        <h2 class="conclusion-heading">
          Recommandations
        </h2>

        ${
          typeof (
            conclusion.recommendations ||
            conclusion.recommendation
          ) === "string"
            ? renderText(
                conclusion.recommendations ||
                  conclusion.recommendation
              )
            : renderList(
                conclusion.recommendations ||
                  conclusion.recommendation,
                true
              )
        }

      </section>
    `;
  }

  /* --------------------------------------------------------
     Perspectives
  -------------------------------------------------------- */

  if (
    conclusion.perspectives ||
    conclusion.futureWork
  ) {
    html += `
      <section class="conclusion-subsection conclusion-perspectives">

        <h2 class="conclusion-heading">
          Perspectives
        </h2>

        ${
          typeof (
            conclusion.perspectives ||
            conclusion.futureWork
          ) === "string"
            ? renderText(
                conclusion.perspectives ||
                  conclusion.futureWork
              )
            : renderList(
                conclusion.perspectives ||
                  conclusion.futureWork
              )
        }

      </section>
    `;
  }

  /* --------------------------------------------------------
     Sections personnalisées
  -------------------------------------------------------- */

  if (finalSections.length) {
    html += `
      <div class="conclusion-structured-sections">
        ${finalSections
          .map((section, index) =>
            renderConclusionSection(
              section,
              index
            )
          )
          .join("")}
      </div>
    `;
  }

  /* --------------------------------------------------------
     Paragraphe final
  -------------------------------------------------------- */

  if (
    conclusion.finalStatement ||
    conclusion.closing
  ) {
    html += `
      <div class="conclusion-final-statement">
        ${renderText(
          conclusion.finalStatement ||
            conclusion.closing
        )}
      </div>
    `;
  }

  html += `
      </div>
    </section>
  `;

  return html;
};

/* ==========================================================
   CONCLUSION DE MÉMOIRE / THÈSE
   ========================================================== */

export const renderThesisConclusion = (
  conclusion = {},
  design = {}
) => {
  return renderConclusion(
    {
      ...conclusion,

      title:
        conclusion.title ||
        "Conclusion générale",

      sections:
        conclusion.sections ||
        [
          {
            title:
              "Synthèse des résultats",
            content:
              conclusion.summary || "",
          },
          {
            title:
              "Réponse aux objectifs",
            content:
              conclusion.objectivesResponse ||
              "",
          },
          {
            title:
              "Limites et difficultés",
            content:
              conclusion.limitations || "",
          },
          {
            title:
              "Perspectives de recherche",
            content:
              conclusion.perspectives || "",
          },
        ],
    },
    design
  );
};

/* ==========================================================
   CONCLUSION D'ARTICLE SCIENTIFIQUE
   ========================================================== */

export const renderArticleConclusion = (
  conclusion = {},
  design = {}
) => {
  return renderConclusion(
    {
      ...conclusion,

      title:
        conclusion.title ||
        "Conclusion",

      generateStructure: false,
    },
    design
  );
};

/* ==========================================================
   EXPORT
   ========================================================== */

export default {
  renderConclusion,
  renderThesisConclusion,
  renderArticleConclusion,
};