/**
 * ==========================================================
 * MACEVO — TEMPLATE ENGINE
 * ----------------------------------------------------------
 * Fichier : Bibliography.js
 * Version : 1.0.0
 * Rôle    : Génération de la bibliographie scientifique
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

const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

/* ==========================================================
   FORMATAGE DU NOM D'AUTEUR
   ========================================================== */

const formatAuthors = (authors) => {
  if (!authors) return "";

  if (typeof authors === "string") {
    return authors;
  }

  const values = normalizeArray(authors);

  return values
    .map((author) => {
      if (typeof author === "string") {
        return author;
      }

      const firstName =
        author.firstName ||
        author.firstname ||
        author.givenName ||
        "";

      const lastName =
        author.lastName ||
        author.lastname ||
        author.familyName ||
        author.name ||
        "";

      if (firstName && lastName) {
        return `${lastName}, ${firstName}`;
      }

      return lastName || firstName || "";
    })
    .filter(Boolean)
    .join("; ");
};

/* ==========================================================
   FORMATAGE DE LA RÉFÉRENCE
   ========================================================== */

const renderReference = (
  reference,
  index,
  style = "apa"
) => {
  if (!reference) return "";

  /*
   * Si l'utilisateur a déjà fourni une référence
   * complète, elle est conservée.
   */
  if (typeof reference === "string") {
    return `
      <li
        class="bibliography-entry"
        data-reference-index="${index + 1}"
      >
        ${escapeHtml(reference)}
      </li>
    `;
  }

  /*
   * Permet également de recevoir directement du HTML.
   */
  if (reference.html) {
    return `
      <li
        class="bibliography-entry"
        data-reference-index="${index + 1}"
      >
        ${reference.html}
      </li>
    `;
  }

  const authors = formatAuthors(
    reference.authors ||
      reference.author
  );

  const year =
    reference.year ||
    reference.date ||
    reference.publicationYear ||
    "";

  const title =
    reference.title ||
    reference.name ||
    "";

  const journal =
    reference.journal ||
    reference.periodical ||
    reference.publication ||
    "";

  const publisher =
    reference.publisher ||
    reference.editor ||
    "";

  const volume =
    reference.volume || "";

  const issue =
    reference.issue ||
    reference.number ||
    "";

  const pages =
    reference.pages ||
    reference.pageRange ||
    "";

  const doi =
    reference.doi || "";

  const url =
    reference.url ||
    reference.link ||
    "";

  const edition =
    reference.edition ||
    "";

  const type =
    safe(reference.type)
      .toLowerCase()
      .trim();

  let citation = "";

  /* --------------------------------------------------------
     APA
  -------------------------------------------------------- */

  if (
    style === "apa" ||
    style === "apa7"
  ) {
    citation = `
      ${
        authors
          ? `<span class="reference-authors">${escapeHtml(
              authors
            )}</span>. `
          : ""
      }

      ${
        year
          ? `<span class="reference-year">(${escapeHtml(
              year
            )}).</span> `
          : ""
      }

      ${
        title
          ? `<span class="reference-title">${escapeHtml(
              title
            )}</span>. `
          : ""
      }

      ${
        journal
          ? `<em>${escapeHtml(
              journal
            )}</em>`
          : ""
      }

      ${
        volume
          ? `, <strong>${escapeHtml(
              volume
            )}</strong>`
          : ""
      }

      ${
        issue
          ? `(${escapeHtml(issue)})`
          : ""
      }

      ${
        pages
          ? `, ${escapeHtml(pages)}`
          : ""
      }

      ${
        journal || volume || issue || pages
          ? ". "
          : ""
      }

      ${
        doi
          ? `<span class="reference-doi">https://doi.org/${escapeHtml(
              doi.replace(
                /^https?:\/\/doi\.org\//i,
                ""
              )
            )}</span>`
          : ""
      }

      ${
        !doi && url
          ? `<span class="reference-url">${escapeHtml(
              url
            )}</span>`
          : ""
      }
    `;
  }

  /* --------------------------------------------------------
     IEEE
  -------------------------------------------------------- */

  else if (style === "ieee") {
    citation = `
      ${
        authors
          ? `${escapeHtml(authors)}, `
          : ""
      }

      ${
        title
          ? `“${escapeHtml(title)},” `
          : ""
      }

      ${
        journal
          ? `<em>${escapeHtml(
              journal
            )}</em>`
          : ""
      }

      ${
        volume
          ? `, vol. ${escapeHtml(
              volume
            )}`
          : ""
      }

      ${
        issue
          ? `, no. ${escapeHtml(
              issue
            )}`
          : ""
      }

      ${
        pages
          ? `, pp. ${escapeHtml(
              pages
            )}`
          : ""
      }

      ${
        year
          ? `, ${escapeHtml(year)}`
          : ""
      }

      ${
        doi
          ? `, doi: ${escapeHtml(
              doi
            )}`
          : ""
      }

      .
    `;
  }

  /* --------------------------------------------------------
     MLA
  -------------------------------------------------------- */

  else if (style === "mla") {
    citation = `
      ${
        authors
          ? `<span class="reference-authors">${escapeHtml(
              authors
            )}</span>. `
          : ""
      }

      ${
        title
          ? `“${escapeHtml(
              title
            )}.” `
          : ""
      }

      ${
        journal
          ? `<em>${escapeHtml(
              journal
            )}</em>, `
          : ""
      }

      ${
        volume
          ? `vol. ${escapeHtml(
              volume
            )}, `
          : ""
      }

      ${
        issue
          ? `no. ${escapeHtml(
              issue
            )}, `
          : ""
      }

      ${
        year
          ? `${escapeHtml(year)}, `
          : ""
      }

      ${
        pages
          ? `pp. ${escapeHtml(
              pages
            )}.`
          : ""
      }

      ${
        !pages
          ? "."
          : ""
      }
    `;
  }

  /* --------------------------------------------------------
     CHICAGO
  -------------------------------------------------------- */

  else if (
    style === "chicago"
  ) {
    citation = `
      ${
        authors
          ? `${escapeHtml(authors)}. `
          : ""
      }

      ${
        year
          ? `${escapeHtml(year)}. `
          : ""
      }

      ${
        title
          ? `“${escapeHtml(
              title
            )}.” `
          : ""
      }

      ${
        journal
          ? `<em>${escapeHtml(
              journal
            )}</em>`
          : ""
      }

      ${
        volume
          ? ` ${escapeHtml(volume)}`
          : ""
      }

      ${
        issue
          ? `, no. ${escapeHtml(
              issue
            )}`
          : ""
      }

      ${
        pages
          ? `: ${escapeHtml(
              pages
            )}`
          : ""
      }.
    `;
  }

  /* --------------------------------------------------------
     VANCOUVER
  -------------------------------------------------------- */

  else if (
    style === "vancouver"
  ) {
    citation = `
      ${
        authors
          ? `${escapeHtml(authors)}. `
          : ""
      }

      ${
        title
          ? `${escapeHtml(
              title
            )}. `
          : ""
      }

      ${
        journal
          ? `${escapeHtml(
              journal
            )}. `
          : ""
      }

      ${
        year
          ? `${escapeHtml(year)}`
          : ""
      }

      ${
        volume
          ? `;${escapeHtml(volume)}`
          : ""
      }

      ${
        issue
          ? `(${escapeHtml(issue)})`
          : ""
      }

      ${
        pages
          ? `:${escapeHtml(pages)}`
          : ""
      }.
    `;
  }

  /* --------------------------------------------------------
     LIVRE
  -------------------------------------------------------- */

  else if (
    type === "book" ||
    type === "livre"
  ) {
    citation = `
      ${
        authors
          ? `${escapeHtml(authors)}. `
          : ""
      }

      ${
        year
          ? `(${escapeHtml(year)}). `
          : ""
      }

      ${
        title
          ? `<em>${escapeHtml(
              title
            )}</em>. `
          : ""
      }

      ${
        edition
          ? `${escapeHtml(
              edition
            )} éd. `
          : ""
      }

      ${
        publisher
          ? `${escapeHtml(
              publisher
            )}.`
          : ""
      }
    `;
  }

  /* --------------------------------------------------------
     RÉFÉRENCE GÉNÉRIQUE
  -------------------------------------------------------- */

  else {
    citation = `
      ${
        authors
          ? `${escapeHtml(authors)}. `
          : ""
      }

      ${
        year
          ? `(${escapeHtml(year)}). `
          : ""
      }

      ${
        title
          ? `<span class="reference-title">${escapeHtml(
              title
            )}</span>. `
          : ""
      }

      ${
        journal
          ? `<em>${escapeHtml(
              journal
            )}</em>. `
          : ""
      }

      ${
        publisher
          ? `${escapeHtml(
              publisher
            )}. `
          : ""
      }

      ${
        url
          ? `${escapeHtml(url)}`
          : ""
      }
    `;
  }

  return `
    <li
      class="bibliography-entry"
      data-reference-index="${index + 1}"
    >
      ${citation}
    </li>
  `;
};

/* ==========================================================
   GROUPE DE RÉFÉRENCES
   ========================================================== */

const renderReferenceGroup = (
  title,
  references,
  style,
  startIndex = 0
) => {
  const values =
    normalizeArray(references);

  if (!values.length) return "";

  return `
    <section class="bibliography-group">

      ${
        title
          ? `
            <h2 class="bibliography-group-title">
              ${escapeHtml(title)}
            </h2>
          `
          : ""
      }

      <ol
        class="bibliography-list"
        start="${startIndex + 1}"
      >
        ${values
          .map((reference, index) =>
            renderReference(
              reference,
              startIndex + index,
              style
            )
          )
          .join("")}
      </ol>

    </section>
  `;
};

/* ==========================================================
   EN-TÊTE
   ========================================================== */

const renderBibliographyHeader = (
  bibliography,
  design = {}
) => {
  const title =
    bibliography.title ||
    "Références bibliographiques";

  const kicker =
    bibliography.kicker ||
    "RÉFÉRENCES";

  return `
    <header
      class="bibliography-header"
      data-bibliography-style="${escapeHtml(
        design?.layout?.sectionStyle ||
          "numbered"
      )}"
    >

      <div class="bibliography-kicker">
        ${escapeHtml(kicker)}
      </div>

      <h1 class="bibliography-title">
        ${escapeHtml(title)}
      </h1>

      ${
        bibliography.subtitle
          ? `
            <p class="bibliography-subtitle">
              ${escapeHtml(
                bibliography.subtitle
              )}
            </p>
          `
          : ""
      }

      <div class="bibliography-title-rule"></div>

    </header>
  `;
};

/* ==========================================================
   BIBLIOGRAPHIE PRINCIPALE
   ========================================================== */

export const renderBibliography = (
  bibliography = {},
  design = {}
) => {
  const style = safe(
    bibliography.style ||
      bibliography.citationStyle ||
      bibliography.format ||
      "apa"
  )
    .toLowerCase()
    .replace(/\s+/g, "");

  const references = normalizeArray(
    bibliography.references ||
      bibliography.entries ||
      bibliography.items
  );

  const books = normalizeArray(
    bibliography.books
  );

  const articles = normalizeArray(
    bibliography.articles ||
      bibliography.journalArticles
  );

  const websites = normalizeArray(
    bibliography.websites ||
      bibliography.onlineSources
  );

  const theses = normalizeArray(
    bibliography.theses ||
      bibliography.dissertations
  );

  const reports = normalizeArray(
    bibliography.reports ||
      bibliography.technicalReports
  );

  let html = `
    <section
      class="macevo-page macevo-bibliography-page bibliography-page"
      data-section-type="bibliography"
      data-citation-style="${escapeHtml(style)}"
    >

      ${renderBibliographyHeader(
        bibliography,
        design
      )}

      <div class="bibliography-content">
  `;

  /* --------------------------------------------------------
     Introduction
  -------------------------------------------------------- */

  if (
    bibliography.introduction ||
    bibliography.description
  ) {
    const description =
      bibliography.introduction ||
      bibliography.description;

    html += `
      <div class="bibliography-introduction">
        ${
          /<\/?[a-z][\s\S]*>/i.test(
            normalizeContent(description)
          )
            ? normalizeContent(
                description
              )
            : `<p>${escapeHtml(
                description
              )}</p>`
        }
      </div>
    `;
  }

  /* --------------------------------------------------------
     Bibliographie générale
  -------------------------------------------------------- */

  if (references.length) {
    html += renderReferenceGroup(
      bibliography.groupTitle || "",
      references,
      style,
      0
    );
  }

  /*
   * Si aucune référence n'est fournie,
   * on affiche une structure propre et modifiable
   * plutôt qu'une page vide.
   */
  if (
    !references.length &&
    !books.length &&
    !articles.length &&
    !websites.length &&
    !theses.length &&
    !reports.length
  ) {
    html += `
      <section class="bibliography-group">

        <h2 class="bibliography-group-title">
          Références
        </h2>

        <ol class="bibliography-list">

          <li class="bibliography-entry bibliography-placeholder">
            Auteur, A. A. (année).
            <em>Titre de l'ouvrage ou de l'article</em>.
            Éditeur ou revue.
          </li>

          <li class="bibliography-entry bibliography-placeholder">
            Auteur, B. B. (année).
            <em>Titre de la publication scientifique</em>.
            Nom de la revue, volume(numéro), pages.
          </li>

          <li class="bibliography-entry bibliography-placeholder">
            Organisation ou auteur.
            (année).
            <em>Titre de la ressource</em>.
            Source ou éditeur.
          </li>

        </ol>

      </section>
    `;
  }

  /* --------------------------------------------------------
     Livres
  -------------------------------------------------------- */

  let currentIndex =
    references.length;

  if (books.length) {
    html += renderReferenceGroup(
      "Ouvrages",
      books,
      style,
      currentIndex
    );

    currentIndex += books.length;
  }

  /* --------------------------------------------------------
     Articles scientifiques
  -------------------------------------------------------- */

  if (articles.length) {
    html += renderReferenceGroup(
      "Articles scientifiques",
      articles,
      style,
      currentIndex
    );

    currentIndex += articles.length;
  }

  /* --------------------------------------------------------
     Thèses et mémoires
  -------------------------------------------------------- */

  if (theses.length) {
    html += renderReferenceGroup(
      "Thèses et mémoires",
      theses,
      style,
      currentIndex
    );

    currentIndex += theses.length;
  }

  /* --------------------------------------------------------
     Rapports
  -------------------------------------------------------- */

  if (reports.length) {
    html += renderReferenceGroup(
      "Rapports et documents techniques",
      reports,
      style,
      currentIndex
    );

    currentIndex += reports.length;
  }

  /* --------------------------------------------------------
     Sources électroniques
  -------------------------------------------------------- */

  if (websites.length) {
    html += renderReferenceGroup(
      "Sources électroniques",
      websites,
      style,
      currentIndex
    );
  }

  /* --------------------------------------------------------
     Note sur le style bibliographique
  -------------------------------------------------------- */

  if (bibliography.showStyleNote) {
    html += `
      <aside class="bibliography-style-note">

        <strong>
          Style bibliographique :
        </strong>

        ${escapeHtml(
          bibliography.styleLabel ||
            style.toUpperCase()
        )}

      </aside>
    `;
  }

  html += `
      </div>
    </section>
  `;

  return html;
};

/* ==========================================================
   BIBLIOGRAPHIE APA
   ========================================================== */

export const renderAPABibliography = (
  bibliography = {},
  design = {}
) => {
  return renderBibliography(
    {
      ...bibliography,
      style: "apa",
    },
    design
  );
};

/* ==========================================================
   BIBLIOGRAPHIE IEEE
   ========================================================== */

export const renderIEEEBibliography = (
  bibliography = {},
  design = {}
) => {
  return renderBibliography(
    {
      ...bibliography,
      style: "ieee",
    },
    design
  );
};

/* ==========================================================
   BIBLIOGRAPHIE VANCOUVER
   ========================================================== */

export const renderVancouverBibliography = (
  bibliography = {},
  design = {}
) => {
  return renderBibliography(
    {
      ...bibliography,
      style: "vancouver",
    },
    design
  );
};

/* ==========================================================
   EXPORT
   ========================================================== */

export default {
  renderBibliography,
  renderAPABibliography,
  renderIEEEBibliography,
  renderVancouverBibliography,
};