import { getTemplateById, getTemplateDesign } from "../../config/reportTemplates";
import { getMacevoModelSpec } from "../../config/macevoModelSpecs";
import { renderMacevoDocument } from "./macevoDocumentModel";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function resolveCoverDesign(template) {
  const registryDesign = getTemplateDesign(template) || {};
  const rawDesign = template?.design && typeof template.design === "object"
    ? template.design
    : {};
  const sourceColors = rawDesign.colors || template?.colors || {};
  const borderType = String(template?.border || "thin").toLowerCase();
  const primary = sourceColors.primary || template?.themeColor || registryDesign.headingColor || "#1f4e79";
  const secondary = sourceColors.secondary || "#f8fafc";
  const accent = sourceColors.accent || registryDesign.accentColor || primary;
  const borderColor = sourceColors.border || (borderType === "none" ? "transparent" : "#cbd5e1");
  const designId = String(typeof template?.design === "string" ? template.design : template?.design?.id || "classique").toLowerCase();
  let layout = String(template?.coverLayout || rawDesign.cover?.layout || ({
    classique: "classic",
    scientifique: "scientific",
    moderne: "modern",
    elegant: "editorial",
    minimaliste: "minimal",
    institutionnel: "institutional",
    technique: "technical",
    editorial: "editorial",
    geometrique: "blocks",
    clinique: "clinical",
    terrain: "field",
    executif: "rail",
    monochrome: "minimal",
    donnees: "data",
  })[designId] || "classic").toLowerCase();
  if (!template?.coverLayout && template?.id) {
    if (String(template.id).includes("stage")) layout = "stage";
    else if (String(template.id).includes("article")) layout = "journal";
    else if (String(template.id).includes("these")) layout = "institutional";
  }

  return {
    colors: { primary, secondary, accent },
    cover: {
      showBadge: rawDesign.cover?.showBadge !== false,
      showLogo: rawDesign.cover?.showLogo !== false,
      showAccentLine: rawDesign.cover?.showAccentLine !== false,
      showBottomBand: rawDesign.cover?.showBottomBand ?? ["double", "thin", "accent"].includes(borderType),
      layout,
    },
    border: {
      css: borderType === "double"
        ? `5px double ${primary}`
        : borderType === "accent"
          ? `4px solid ${primary}`
          : borderType === "none"
            ? "none"
            : `1px solid ${borderColor}`,
    },
  };
}

function renderCover(metadata, template) {
  const design = resolveCoverDesign(template);
  const colors = design.colors;
  const cover = design.cover;
  const border = design.border;
  const institutionLine = [metadata.institution, metadata.faculty, metadata.department]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");
  const programLine = [metadata.program, metadata.specialty]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" — ");
  const contextLine = [metadata.scientificField, metadata.academicLevel]
    .filter(Boolean)
    .map(escapeHtml)
    .join(" · ");

  return `
    <div class="macevo-cover macevo-cover-academic macevo-backend-cover macevo-cover-layout-${design.cover.layout}" style="--macevo-primary:${colors.primary};--macevo-secondary:${colors.secondary};--macevo-accent:${colors.accent};--macevo-cover-border:${border.css}">
      ${cover.showBadge ? `<div class="macevo-cover-badge">${escapeHtml(metadata.reportType || "DOCUMENT ACADÉMIQUE")}</div>` : ""}
      ${cover.showLogo ? `
        <div class="macevo-cover-brand">
          ${metadata.logoUrl
            ? `<div class="macevo-cover-logo macevo-cover-logo-image-wrap"><img class="macevo-cover-logo-image" src="${escapeHtml(metadata.logoUrl)}" alt="Logo de l'institution" /></div>`
            : `<div class="macevo-cover-logo">M</div>`}
          <div>
            <div class="macevo-cover-brand-name">${escapeHtml(metadata.institution || "MACEVO")}</div>
            <div class="macevo-cover-brand-subtitle">${escapeHtml(metadata.reportType || "Édition académique")}</div>
          </div>
        </div>
      ` : ""}
      <div class="macevo-cover-institution">${institutionLine}</div>
      ${programLine ? `<div class="macevo-cover-department">${programLine}</div>` : ""}
      ${contextLine ? `<div class="macevo-backend-cover-context">${contextLine}</div>` : ""}
      ${cover.showAccentLine ? `<div class="macevo-cover-accent-line"></div>` : ""}
      <h1 class="macevo-cover-title">${escapeHtml(metadata.title || "")}</h1>
      <div class="macevo-cover-meta">
        ${metadata.author ? `<div class="macevo-cover-meta-block"><span>Présenté par</span><strong>${escapeHtml(metadata.author)}</strong></div>` : ""}
        ${metadata.supervisor ? `<div class="macevo-cover-meta-block"><span>Encadrement</span><strong>${escapeHtml(metadata.supervisor)}</strong></div>` : ""}
      </div>
      ${metadata.academicYear ? `<div class="macevo-cover-year">${escapeHtml(metadata.academicYear)}</div>` : ""}
      ${cover.showBottomBand ? `<div class="macevo-cover-bottom-band"></div>` : ""}
    </div>
  `;
}

function renderTableOfContents(document) {
  const entries = Array.isArray(document?.tableOfContents)
    ? document.tableOfContents
    : [];
  const rows = entries.map((entry) => {
    const padding = Math.min((Number(entry.depth) || 0) * 24, 96);
    return `
      <div class="macevo-backend-toc-row" style="padding-left:${padding}px">
        <span class="macevo-toc-number">${escapeHtml(entry.number || "")}</span>
        <span class="macevo-toc-title">${escapeHtml(entry.title || "")}</span>
        <span class="macevo-toc-dots"></span>
        <span class="macevo-toc-page">${entry.page ?? "—"}</span>
      </div>
    `;
  }).join("");

  return `
    <section class="macevo-toc macevo-backend-toc">
      <div class="macevo-toc-kicker">STRUCTURE DU DOCUMENT</div>
      <h1>TABLE DES MATIÈRES</h1>
      <div class="macevo-toc-intro">Organisation hiérarchique du document</div>
      <div class="macevo-toc-list">${rows}</div>
    </section>
  `;
}

export function renderTemplateDocument(document, template = null) {
  if (!document) return "";

  const resolvedTemplate =
    template || document.template?.snapshot || getTemplateById(document.template?.id) || {};

  const rendered = renderMacevoDocument(document, {
    renderCover: (metadata) => renderCover({
      ...metadata,
      ...(document.academicContext || {}),
      reportType:
        metadata?.type ||
        metadata?.reportType ||
        resolvedTemplate.category ||
        resolvedTemplate.type ||
        "DOCUMENT ACADÉMIQUE",
      academicYear:
        metadata?.academicYear ||
        resolvedTemplate.academicYear ||
        resolvedTemplate.year ||
        "",
      supervisor:
        metadata?.supervisor ||
        resolvedTemplate.academicSupervisor ||
        "",
    }, resolvedTemplate),
    renderToc: renderTableOfContents,
  });

  const neutralTemplate = getMacevoModelSpec(resolvedTemplate).isNeutralFallback;
  if (!["illustrative-scenario", "scientific-blueprint"].includes(resolvedTemplate.contentStatus) && !neutralTemplate) {
    return rendered;
  }

  const noticeText = resolvedTemplate.contentStatus === "scientific-blueprint" || neutralTemplate
    ? "DOCUMENT EN COURS DE CONSTRUCTION — le plan et les repères méthodologiques viennent de votre blueprint. Les résultats, sources et illustrations empiriques doivent correspondre à votre recherche réelle."
    : "SCÉNARIO DE DÉMONSTRATION — le sujet, les constats et les chiffres illustrent la structure du modèle. Ils ne sont pas des résultats de recherche vérifiés.";
  const notice = `<p class="macevo-demo-disclaimer" role="note"><strong>${escapeHtml(noticeText.split(" — ")[0])} —</strong>${escapeHtml(noticeText.split(" — ").slice(1).join(" —"))}</p>`;
  return rendered.replace(/(<div\s+class="macevo-document"[^>]*>)/i, `$1${notice}`);
}
