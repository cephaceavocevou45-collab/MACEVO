/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : CoverPage.js
 * Version : 1.0.0
 * Statut  : Composant page de garde professionnel
 * ==========================================================
 */

import {
  escapeHtml,
} from "../TemplateEngine";

/* ==========================================================
   UTILITAIRES
   ========================================================== */

function getValue(value, fallback = "") {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return escapeHtml(value);
}

function getDesign(template = {}, data = {}) {
  return (
    data.design ||
    template.design ||
    template.styles ||
    {}
  );
}

function getCoverConfig(template = {}, data = {}) {
  const design = getDesign(template, data);

  return {
    style:
      template?.cover?.style ||
      design?.cover?.style ||
      design?.coverStyle ||
      "scientific",

    alignment:
      template?.cover?.alignment ||
      design?.cover?.alignment ||
      "center",

    showLogo:
      template?.cover?.showLogo ??
      design?.cover?.showLogo ??
      true,

    showBadge:
      template?.cover?.showBadge ??
      design?.cover?.showBadge ??
      true,

    showAccentLine:
      template?.cover?.showAccentLine ??
      design?.cover?.showAccentLine ??
      true,

    showBottomBand:
      template?.cover?.showBottomBand ??
      design?.cover?.showBottomBand ??
      true,

    showPageNumber:
      template?.cover?.showPageNumber ??
      design?.cover?.showPageNumber ??
      false,
  };
}

/* ==========================================================
   STYLE INLINE
   ========================================================== */

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

    white: "#ffffff",
  };
}

/* ==========================================================
   PAGE DE GARDE SCIENTIFIQUE
   ========================================================== */

function renderScientificCover(
  template,
  data,
  colors,
  config
) {
  const title = getValue(
    data.title,
    "Titre du document scientifique"
  );

  const institution = getValue(
    data.institution,
    "Université / Institution"
  );

  const department = getValue(
    data.department,
    "Faculté / Département"
  );

  const field = getValue(
    data.scientificField,
    "Domaine scientifique"
  );

  const author = getValue(
    data.author,
    "Nom et prénom de l'auteur"
  );

  const supervisor = getValue(
    data.supervisor,
    "Directeur / Encadreur"
  );

  const academicYear = getValue(
    data.academicYear,
    "2026–2027"
  );

  const documentType = getValue(
    template?.documentType ||
      template?.badge ||
      template?.name ||
      "DOCUMENT SCIENTIFIQUE"
  );

  return `
    <section
      class="macevo-page macevo-cover-page macevo-cover-scientific"
      data-page-type="cover"
      data-cover-style="scientific"
      style="
        --cover-primary:${colors.primary};
        --cover-secondary:${colors.secondary};
        --cover-accent:${colors.accent};
        --cover-text:${colors.text};
        --cover-muted:${colors.muted};
      "
    >

      <!-- ==================================================
           EN-TÊTE
           ================================================== -->

      <div class="cover-header">

        ${
          config.showLogo
            ? `
              <div class="cover-logo-wrapper">

                <div class="cover-logo">
                  M
                </div>

              </div>
            `
            : ""
        }

        <div class="cover-institution-block">

          <div class="cover-institution">
            ${institution}
          </div>

          <div class="cover-department">
            ${department}
          </div>

        </div>

      </div>

      ${
        config.showAccentLine
          ? `
            <div class="cover-accent-line"></div>
          `
          : ""
      }

      <!-- ==================================================
           CORPS CENTRAL
           ================================================== -->

      <div class="cover-main">

        ${
          config.showBadge
            ? `
              <div class="cover-badge">
                ${documentType}
              </div>
            `
            : ""
        }

        <div class="cover-field">
          ${field}
        </div>

        <h1 class="cover-title">
          ${title}
        </h1>

        <div class="cover-title-underline"></div>

        <p class="cover-subtitle">
          Travail scientifique
        </p>

      </div>

      <!-- ==================================================
           INFORMATIONS AUTEUR
           ================================================== -->

      <div class="cover-information-grid">

        <div class="cover-information-item">

          <span class="cover-information-label">
            PRÉSENTÉ PAR
          </span>

          <strong class="cover-information-value">
            ${author}
          </strong>

        </div>

        <div class="cover-information-item">

          <span class="cover-information-label">
            SOUS LA DIRECTION DE
          </span>

          <strong class="cover-information-value">
            ${supervisor}
          </strong>

        </div>

      </div>

      <!-- ==================================================
           PIED DE PAGE
           ================================================== -->

      ${
        config.showBottomBand
          ? `
            <div class="cover-bottom-band">

              <span>
                ${academicYear}
              </span>

              <span>
                MACEVO
              </span>

            </div>
          `
          : ""
      }

      ${
        config.showPageNumber
          ? `
            <div class="cover-page-number">
              1
            </div>
          `
          : ""
      }

    </section>
  `;
}

/* ==========================================================
   PAGE DE GARDE ACADÉMIQUE
   ========================================================== */

function renderAcademicCover(
  template,
  data,
  colors,
  config
) {
  const title = getValue(
    data.title,
    "Titre du mémoire"
  );

  const institution = getValue(
    data.institution,
    "Université / Institution"
  );

  const department = getValue(
    data.department,
    "Faculté / Département"
  );

  const author = getValue(
    data.author,
    "Nom et prénom de l'auteur"
  );

  const supervisor = getValue(
    data.supervisor,
    "Directeur / Encadreur"
  );

  const academicYear = getValue(
    data.academicYear,
    "2026–2027"
  );

  const documentType = getValue(
    template?.documentType ||
      template?.badge ||
      "MÉMOIRE"
  );

  return `
    <section
      class="macevo-page macevo-cover-page macevo-cover-academic"
      data-page-type="cover"
      data-cover-style="academic"
      style="
        --cover-primary:${colors.primary};
        --cover-secondary:${colors.secondary};
        --cover-accent:${colors.accent};
        --cover-text:${colors.text};
        --cover-muted:${colors.muted};
      "
    >

      <div class="academic-cover-top">

        ${
          config.showLogo
            ? `
              <div class="academic-cover-logo">
                M
              </div>
            `
            : ""
        }

        <div class="academic-cover-institution">

          <strong>
            ${institution}
          </strong>

          <span>
            ${department}
          </span>

        </div>

      </div>

      ${
        config.showAccentLine
          ? `
            <div class="academic-cover-line"></div>
          `
          : ""
      }

      <div class="academic-cover-body">

        ${
          config.showBadge
            ? `
              <div class="academic-cover-badge">
                ${documentType}
              </div>
            `
            : ""
        }

        <h1 class="academic-cover-title">
          ${title}
        </h1>

        <div class="academic-cover-meta">

          <div>
            <span>
              Présenté par
            </span>

            <strong>
              ${author}
            </strong>
          </div>

          <div>
            <span>
              Directeur / Encadreur
            </span>

            <strong>
              ${supervisor}
            </strong>
          </div>

        </div>

      </div>

      ${
        config.showBottomBand
          ? `
            <div class="academic-cover-footer">
              ${academicYear}
            </div>
          `
          : ""
      }

    </section>
  `;
}

/* ==========================================================
   PAGE DE GARDE MODERNE
   ========================================================== */

function renderModernCover(
  template,
  data,
  colors,
  config
) {
  const title = getValue(
    data.title,
    "Titre du projet"
  );

  const institution = getValue(
    data.institution,
    "Université / Institution"
  );

  const department = getValue(
    data.department,
    "Faculté / Département"
  );

  const author = getValue(
    data.author,
    "Nom et prénom"
  );

  const academicYear = getValue(
    data.academicYear,
    "2026–2027"
  );

  const documentType = getValue(
    template?.documentType ||
      template?.badge ||
      "PROJET ACADÉMIQUE"
  );

  return `
    <section
      class="macevo-page macevo-cover-page macevo-cover-modern"
      data-page-type="cover"
      data-cover-style="modern"
      style="
        --cover-primary:${colors.primary};
        --cover-secondary:${colors.secondary};
        --cover-accent:${colors.accent};
        --cover-text:${colors.text};
        --cover-muted:${colors.muted};
      "
    >

      <div class="modern-cover-decoration"></div>

      <div class="modern-cover-content">

        ${
          config.showLogo
            ? `
              <div class="modern-cover-logo">
                M
              </div>
            `
            : ""
        }

        ${
          config.showBadge
            ? `
              <div class="modern-cover-badge">
                ${documentType}
              </div>
            `
            : ""
        }

        <div class="modern-cover-institution">
          ${institution}
        </div>

        <div class="modern-cover-department">
          ${department}
        </div>

        <h1 class="modern-cover-title">
          ${title}
        </h1>

        <div class="modern-cover-author">

          <span>
            Préparé par
          </span>

          <strong>
            ${author}
          </strong>

        </div>

      </div>

      ${
        config.showBottomBand
          ? `
            <div class="modern-cover-footer">

              <span>
                ${academicYear}
              </span>

              <span>
                MACEVO
              </span>

            </div>
          `
          : ""
      }

    </section>
  `;
}

/* ==========================================================
   PAGE DE GARDE ARTICLE
   ========================================================== */

function renderArticleCover(
  template,
  data,
  colors,
  config
) {
  const title = getValue(
    data.title,
    "Titre de l'article scientifique"
  );

  const institution = getValue(
    data.institution,
    "Institution"
  );

  const author = getValue(
    data.author,
    "Auteur"
  );

  const field = getValue(
    data.scientificField,
    "Domaine scientifique"
  );

  return `
    <section
      class="macevo-page macevo-cover-page macevo-cover-article"
      data-page-type="cover"
      data-cover-style="article"
      style="
        --cover-primary:${colors.primary};
        --cover-secondary:${colors.secondary};
        --cover-accent:${colors.accent};
        --cover-text:${colors.text};
        --cover-muted:${colors.muted};
      "
    >

      <div class="article-cover-header">

        ${
          config.showLogo
            ? `
              <div class="article-cover-logo">
                M
              </div>
            `
            : ""
        }

        <div class="article-cover-journal">
          MACEVO SCIENTIFIC
        </div>

      </div>

      <div class="article-cover-content">

        ${
          config.showBadge
            ? `
              <div class="article-cover-badge">
                ARTICLE SCIENTIFIQUE
              </div>
            `
            : ""
        }

        <div class="article-cover-field">
          ${field}
        </div>

        <h1 class="article-cover-title">
          ${title}
        </h1>

        <div class="article-cover-author">
          ${author}
        </div>

        <div class="article-cover-institution">
          ${institution}
        </div>

      </div>

      ${
        config.showBottomBand
          ? `
            <div class="article-cover-footer">
              Généré avec MACEVO
            </div>
          `
          : ""
      }

    </section>
  `;
}

/* ==========================================================
   PAGE DE GARDE SIDEBAR
   ========================================================== */

function renderSidebarCover(
  template,
  data,
  colors,
  config
) {
  const title = getValue(
    data.title,
    "Titre du document"
  );

  const institution = getValue(
    data.institution,
    "Université / Institution"
  );

  const department = getValue(
    data.department,
    "Département"
  );

  const author = getValue(
    data.author,
    "Nom de l'auteur"
  );

  const academicYear = getValue(
    data.academicYear,
    "2026–2027"
  );

  return `
    <section
      class="macevo-page macevo-cover-page macevo-cover-sidebar"
      data-page-type="cover"
      data-cover-style="sidebar"
      style="
        --cover-primary:${colors.primary};
        --cover-secondary:${colors.secondary};
        --cover-accent:${colors.accent};
        --cover-text:${colors.text};
        --cover-muted:${colors.muted};
      "
    >

      <aside class="sidebar-cover-panel">

        ${
          config.showLogo
            ? `
              <div class="sidebar-cover-logo">
                M
              </div>
            `
            : ""
        }

        <div class="sidebar-cover-brand">
          MACEVO
        </div>

        <div class="sidebar-cover-year">
          ${academicYear}
        </div>

      </aside>

      <div class="sidebar-cover-main">

        <div class="sidebar-cover-institution">
          ${institution}
        </div>

        <div class="sidebar-cover-department">
          ${department}
        </div>

        ${
          config.showAccentLine
            ? `
              <div class="sidebar-cover-line"></div>
            `
            : ""
        }

        <h1 class="sidebar-cover-title">
          ${title}
        </h1>

        <div class="sidebar-cover-author">

          <span>
            Auteur
          </span>

          <strong>
            ${author}
          </strong>

        </div>

      </div>

    </section>
  `;
}

/* ==========================================================
   API PRINCIPALE
   ========================================================== */

export function renderCoverPage(
  template,
  data = {}
) {
  const config = getCoverConfig(
    template,
    data
  );

  const colors = getColors(
    template,
    data
  );

  const style = String(
    config.style || "scientific"
  ).toLowerCase();

  switch (style) {
    case "modern":
      return renderModernCover(
        template,
        data,
        colors,
        config
      );

    case "article":
      return renderArticleCover(
        template,
        data,
        colors,
        config
      );

    case "sidebar":
      return renderSidebarCover(
        template,
        data,
        colors,
        config
      );

    case "academic":
    case "classique":
    case "classic":
      return renderAcademicCover(
        template,
        data,
        colors,
        config
      );

    case "scientific":
    case "scientifique":
    default:
      return renderScientificCover(
        template,
        data,
        colors,
        config
      );
  }
}

/* ==========================================================
   EXPORT PAR DÉFAUT
   ========================================================== */

export default renderCoverPage;