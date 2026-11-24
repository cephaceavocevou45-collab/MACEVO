/**

* ============================================================

* MACEVO

* ------------------------------------------------------------

* Fichier : EditorContext.jsx

* Description : Contexte central unique de l'éditeur MACEVO.

* Version : 16.0.0 — PIPELINE CANONIQUE PRODUCTION

* Statut : Chargement + sauvegarde + templates +

*       moteur de design professionnel +

*       structure académique + pagination A4

* ============================================================

*/



import {

    createContext,

    useContext,
    useCallback,

    useMemo,

    useEffect,

    useRef,

    useState,

} from "react";



import { useLocation } from "react-router-dom";

import { useEditor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";

import { StarterKit } from "@tiptap/starter-kit";

import { Underline } from "@tiptap/extension-underline";

import { Superscript } from "@tiptap/extension-superscript";

import { Subscript } from "@tiptap/extension-subscript";

import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";

import { Color } from "@tiptap/extension-color";

import { Highlight } from "@tiptap/extension-highlight";

import { Link } from "@tiptap/extension-link";

import { Image } from "@tiptap/extension-image";

import { TextAlign } from "@tiptap/extension-text-align";

import { Table } from "@tiptap/extension-table";

import { TableRow } from "@tiptap/extension-table-row";

import { TableCell } from "@tiptap/extension-table-cell";

import { TableHeader } from "@tiptap/extension-table-header";

import { ScientificShapeExtension } from './extensions/ScientificShapeExtension';

import { MathNode } from './extensions/MathNode';
import { getMacevoModelSpec } from '../../../config/macevoModelSpecs';
import {
  createMacevoDocument,
  buildDocumentModel,
  serializeMacevoDocument,
  deserializeMacevoDocument,
} from "../../../core/document/macevoDocumentModel";
import { renderTemplateDocument } from "../../../core/document/templateDocumentRenderer";
import { buildAcademicModuleContent } from "../../../core/document/reportContentEngine";



import {

  PaginationPlus,

  PAGE_SIZES,

} from "tiptap-pagination-plus";



import FontSize from "./extensions/FontSizeExtension";

import LineHeight from "../../../pages/Reports/Editor/config/LineHeight";



import api from "../../../api/axios";



import {

  useDocumentState,

  useStatisticsState,

  useSelectionState,

  useSaveState,
  useReferenceState,

  useCommentState,

  useHistoryState,

  useThemeState,

  useAIState,

} from "./state";



import {

  reportTemplates,

  getReportTemplate,

} from "../../../config/reportTemplates";




/* ============================================================
 CONTENEURS VISUELS MACEVO
============================================================ */

const MacevoVisualContainer = Node.create({
    name: "macevoVisualContainer",
    priority: 1000,
    group: "block",
    content: "block*",
    defining: true,
    addAttributes() {
        return {
            tagName: { default: "div" },
            class: { default: null },
            style: { default: null },
            id: { default: null },
            "data-macevo-page": { default: null },
            "data-macevo-module": { default: null },
            "data-macevo-instance": { default: null },
            "data-macevo-number": { default: null },
            "data-macevo-template": { default: null },
            "data-macevo-layout": { default: null },
            "data-macevo-section-style": { default: null },
        };
    },
    parseHTML() {
        return [
            { tag: 'div[class*="macevo-"]' },
            { tag: 'section[class*="macevo-"]' },
            { tag: 'article[class*="macevo-"]' },
            { tag: 'figure[class*="macevo-"]' },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        const { tagName, ...attributes } = HTMLAttributes || {};
        return [tagName || "div", mergeAttributes(attributes), 0];
    },
});

/* ============================================================

 PAGE MACEVO — NOEUD TIPTAP

============================================================ */


/* ============================================================

 UTILITAIRES

============================================================ */



/**

* Échappe une valeur avant injection HTML.

*/

function escapeHtml(value) {

  if (value === null || value === undefined) {

      return "";

  }



  return String(value)

      .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")

         .replace(/>/g, "&gt;")

         .replace(/"/g, "&quot;")

         .replace(/'/g, "&#039;");

}




/**

* Vérifie si une chaîne contient déjà du HTML.

*/

function isHtmlContent(value) {

    if (!value || typeof value !== "string") {

         return false;

    }



  return /<(p|h1|h2|h3|h4|h5|h6|ul|ol|li|table|thead|tbody|tr|td|th|blockquote|strong|em|u|br|div|section|article)\b/i.test(value);

}




/**

* Transforme un texte brut en HTML.

*/

function textToHtml(text) {

    if (!text) {

         return "";
}



const value = String(text).trim();



if (!value) {

     return "";

}



if (isHtmlContent(value)) {

     return value;

}



const lines = value.split(/\r?\n/);



let html = "";

let currentList = null;



const closeList = () => {

     if (currentList === "ul") {

         html += "</ul>";

     }



     if (currentList === "ol") {

         html += "</ol>";

     }



     currentList = null;

};
lines.forEach((line) => {

  const trimmed = line.trim();



  if (!trimmed) {

      closeList();

      return;

  }



  /* Liste à puces */

  if (/^[-•*]\s+/.test(trimmed)) {

      if (currentList !== "ul") {

          closeList();

          html += "<ul>";

          currentList = "ul";

      }



      html += `

          <li>

            ${escapeHtml(

                 trimmed.replace(/^[-•*]\s+/, "")

            )}

          </li>

      `;



      return;

  }
  /* Liste numérotée */

  if (/^\d+[.)]\s+/.test(trimmed)) {

      if (currentList !== "ol") {

          closeList();

          html += "<ol>";

          currentList = "ol";

      }



      html += `

          <li>

            ${escapeHtml(

                 trimmed.replace(/^\d+[.)]\s+/, "")

            )}

          </li>

      `;



      return;

  }



  closeList();



  html += `

      <p>

          ${escapeHtml(trimmed)}

      </p>

  `;

});
    closeList();



    return html;

}




/* ============================================================

    LATEX → HTML

============================================================ */



function cleanLatexToHtml(text) {

    if (!text || typeof text !== "string") {

        return "";

    }



    if (isHtmlContent(text)) {

        return text;

    }



    const isLatex =


/\\documentclass|\\begin\{document\}|\\section\*?\{|\\subsection\*?\{|\\subsubsection\*?\{|\\textbf\{|\\textit\{|\\underline\{/.test(

             text

        );



    if (!isLatex) {

        return textToHtml(text);

    }
let content = text;



/* DOCUMENT */

content = content.replace(

     /\\documentclass(?:\[[^\]]*\])?\{[^}]*\}/g,

     ""

);



content = content.replace(

     /\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/g,

     ""

);



content = content.replace(

     /\\begin\{document\}/g,

     ""

);



content = content.replace(

     /\\end\{document\}/g,

     ""

);



/* COMMENTAIRES */

content = content.replace(

     /(^|[^\\])%[^\n]*$/gm,

     "$1"
);



/* TITRES */

content = content.replace(

     /\\chapter\*?\{([^}]*)\}/g,

     "<h1>$1</h1>"

);



content = content.replace(

     /\\section\*?\{([^}]*)\}/g,

     "<h2>$1</h2>"

);



content = content.replace(

     /\\subsection\*?\{([^}]*)\}/g,

     "<h3>$1</h3>"

);



content = content.replace(

     /\\subsubsection\*?\{([^}]*)\}/g,

     "<h4>$1</h4>"

);



/* MISE EN FORME */

content = content.replace(

     /\\textbf\{([^}]*)\}/g,

     "<strong>$1</strong>"

);
content = content.replace(

     /\\textit\{([^}]*)\}/g,

     "<em>$1</em>"

);



content = content.replace(

     /\\underline\{([^}]*)\}/g,

     "<u>$1</u>"

);



/* ESPACEMENTS */

content = content.replace(

     /\\vspace\*?\{[^}]*\}/g,

     ""

);



content = content.replace(

     /\\hspace\*?\{[^}]*\}/g,

     ""

);



/* LISTES */

content = content.replace(

     /\\begin\{enumerate\}/g,

     "<ol>"

);
content = content.replace(

     /\\end\{enumerate\}/g,

     "</ol>"

);



content = content.replace(

     /\\begin\{itemize\}/g,

     "<ul>"

);



content = content.replace(

     /\\end\{itemize\}/g,

     "</ul>"

);



content = content.replace(

     /\\item\s+([^\n]+)/g,

     "<li>$1</li>"

);



/* CENTRAGE */

content = content.replace(

     /\\begin\{center\}/g,

     '<div style="text-align:center;">'

);



content = content.replace(

     /\\end\{center\}/g,
     "</div>"

);



/* COMMANDES SIMPLES */

content = content.replace(

     /\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{([^}]*)\})?/g,

     "$1"

);



/* CARACTÈRES LATEX */

content = content

     .replace(/\\%/g, "%")

     .replace(/\\_/g, "_")

     .replace(/\\&/g, "&")

     .replace(/\\#/g, "#")

     .replace(/\\\$/g, "$")

     .replace(/\\\\/g, "<br>");



/* PARAGRAPHES */

const blocks = content

     .split(/\n\s*\n/)

     .map((block) => block.trim())

     .filter(Boolean);



return blocks

     .map((block) => {

       if (

          /^<h[1-6]\b/i.test(block) ||
                /^<(ul|ol|table|blockquote|div)\b/i.test(block) ||

                /^<p\b/i.test(block)

           ){

                return block;

           }



           return `

                <p>

                  ${block.replace(/\n/g, "<br>")}

                </p>

           `;

      })

      .join("");

}




/* ============================================================

    DESIGN SYSTEM

============================================================ */



function getTemplateDesign(template) {
    const rawDesign = template?.design;
    const design = rawDesign && typeof rawDesign === "object" ? rawDesign : {};
    const colors = design.colors || {};
    const sourceColors = template?.colors || {};
    const typography = design.typography || {};
    const layout = design.layout || {};
    const cover = design.cover || {};
    const spacing = design.spacing || {};
    const page = design.page || {};
    const borderType = String(template?.border || design.border || "thin").toLowerCase();
    const primary = colors.primary || sourceColors.primary || template?.themeColor || "#2563eb";
    const secondary = colors.secondary || sourceColors.secondary || "#f8fafc";
    const accent = colors.accent || sourceColors.accent || primary;
    const borderColor = colors.border || sourceColors.border || (borderType === "none" ? "transparent" : "#cbd5e1");
    const previewType = String(template?.type || template?.category || rawDesign || "").toLowerCase();
    const inferredLayout = layout.style || (previewType.includes("technical") || previewType.includes("stage") ? "professional" : "academic");
    const inferredCoverStyle = cover.style || (previewType.includes("modern") ? "modern" : previewType.includes("article") ? "article" : previewType.includes("scientific") ? "scientific" : "academic");

    return {
        colors: {
            primary,
            secondary,
            accent,
            text: colors.text || "#1f2937",
            muted: colors.muted || "#64748b",
            surface: colors.surface || secondary,
            border: borderColor,
            white: colors.white || "#ffffff",
        },
        typography: {
            bodyFont: typography.bodyFont || "Arial, sans-serif",
            headingFont: typography.headingFont || typography.bodyFont || "Arial, sans-serif",
            bodySize: typography.bodySize || "12pt",
            lineHeight: typography.lineHeight || "1.6",
            headingWeight: typography.headingWeight || 700,
            letterSpacing: typography.letterSpacing || "0",
        },
        layout: {
            style: inferredLayout,
            sectionStyle: layout.sectionStyle || "numbered",
            titleStyle: layout.titleStyle || "accent",
            headingStyle: layout.headingStyle || "accent",
            sidebar: Boolean(layout.sidebar || inferredLayout === "professional"),
            cards: Boolean(layout.cards),
        },
        cover: {
            style: inferredCoverStyle,
            alignment: cover.alignment || "center",
            showLogo: cover.showLogo !== false,
            showBadge: cover.showBadge !== false,
            showAccentLine: cover.showAccentLine !== false,
            showBottomBand: cover.showBottomBand ?? ["double", "thin", "accent"].includes(borderType),
            showPageNumber: cover.showPageNumber !== false,
        },
        border: {
            type: borderType,
            color: borderColor,
            width: borderType === "double" ? "5px" : borderType === "accent" ? "4px" : borderType === "none" ? "0" : "1px",
            css: borderType === "double" ? `5px double ${primary}` : borderType === "accent" ? `4px solid ${primary}` : borderType === "none" ? "none" : `1px solid ${borderColor}`,
        },
        spacing: {
            paragraph: spacing.paragraph || "10px",
            section: spacing.section || "28px",
            heading: spacing.heading || "18px",
            pageTop: spacing.pageTop ?? 55,
            pageBottom: spacing.pageBottom ?? 55,
            pageLeft: spacing.pageLeft ?? 70,
            pageRight: spacing.pageRight ?? 70,
        },
        page: {
            margins: page.margins || {
                top: spacing.pageTop ?? 55,
                bottom: spacing.pageBottom ?? 55,
                left: spacing.pageLeft ?? 70,
                right: spacing.pageRight ?? 70,
            },
            header: page.header || {},
            footer: page.footer || {},
        },
    };
}
/* ============================================================
 CONTENU DES SECTIONS
============================================================ */

function getDemoProfile(template = {}) {
    const spec = getMacevoModelSpec(template);
    return {
        ...spec,
        // Demonstration identities must never appear as real authors or jury members.
        student: "",
        institution: "",
        faculty: "",
        department: "",
        program: "",
        supervisor: "",
        academicSupervisor: "",
        period: spec.period || '',
    };
}

function normalizeSectionContent(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        return value.html || value.content || value.text || value.value || '';
    }
    return String(value);
}

function escapeScenarioText(value) {
    return escapeHtml(normalizeSectionContent(value));
}

function scenarioTable(spec) {
    if (!Array.isArray(spec.metric) || !Array.isArray(spec.values) || !spec.metric.length || spec.metric.length !== spec.values.length) return '';
    const labels = spec.metric || ['Indicateur A', 'Indicateur B', 'Indicateur C'];
    const values = spec.values || [70, 80, 90];
    const rows = labels.map((label, index) => {
        const value = Number(values[index] ?? 0);
        const target = Math.max(1, Math.round(value * 0.82));
        const delta = value - target;
        return `<tr><td>${escapeHtml(label)}</td><td>${target}%</td><td>${value}%</td><td>${delta >= 0 ? '+' : ''}${delta} pts</td></tr>`;
    }).join('');
    return `<table class="macevo-demo-table"><thead><tr><th>Indicateur</th><th>Situation initiale</th><th>Situation observée</th><th>Écart</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function scenarioSvgImage(svg, alt, width, height) {
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return `<img src="${src}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" style="display:block;width:100%;max-width:680px;height:auto;margin:12px auto" />`;
}

function scenarioFigure(spec) {
    if (!Array.isArray(spec.metric) || !Array.isArray(spec.values) || !spec.metric.length || spec.metric.length !== spec.values.length) return '';
    const labels = spec.metric || ['A', 'B', 'C'];
    const values = spec.values || [70, 80, 90];
    const width = 720;
    const top = 34;
    const rowHeight = 48;
    const height = top + labels.length * rowHeight + 20;
    const chartLeft = 300;
    const chartWidth = 330;
    const maximum = Math.max(1, ...values.map((value) => Number(value) || 0));
    const grid = Array.from({ length: 5 }, (_, index) => {
        const x = chartLeft + (chartWidth * index) / 4;
        const tick = Math.round((maximum * index) / 4);
        return `<line x1="${x}" y1="${top - 12}" x2="${x}" y2="${height - 16}" stroke="#dbe4ef"/><text x="${x}" y="${height - 2}" text-anchor="middle" fill="#64748b" font-size="12">${tick}</text>`;
    }).join('');
    const bars = labels.map((label, index) => {
        const value = Math.max(0, Number(values[index]) || 0);
        const y = top + index * rowHeight;
        const barWidth = Math.max(2, (value / maximum) * chartWidth);
        return `<text x="${chartLeft - 14}" y="${y + 20}" text-anchor="end" fill="#334155" font-size="13">${escapeHtml(label)}</text><rect x="${chartLeft}" y="${y}" width="${chartWidth}" height="25" rx="6" fill="#edf2f7"/><rect x="${chartLeft}" y="${y}" width="${barWidth}" height="25" rx="6" fill="#385b83"/><text x="${Math.min(chartLeft + barWidth + 8, width - 34)}" y="${y + 18}" fill="#1e293b" font-size="12" font-weight="700">${value}</text>`;
    }).join('');
    const svg = `<svg role="img" aria-label="${escapeHtml(spec.figureTitle || 'Graphique des indicateurs')}" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="${width / 2}" y="18" text-anchor="middle" fill="#243b53" font-size="15" font-weight="700">${escapeHtml(spec.figureTitle || 'Indicateurs du scénario')}</text>${grid}${bars}</svg>`;
    return `<figure class="macevo-figure-demo">${scenarioSvgImage(svg, spec.figureTitle || 'Graphique des indicateurs', width, height)}<figcaption>Figure — ${escapeHtml(spec.figureTitle || 'Synthèse des indicateurs')}</figcaption></figure>`;
}

function scenarioArchitecture(spec) {
    const isResearch = /article|thèse/i.test(String(spec.program || ''));
    const nodes = isResearch
        ? ['Données / observations', 'Traitement / méthode', 'Analyse', 'Interprétation']
        : ['Interface / usage', 'Services métier', 'Données', 'Pilotage'];
    const boxes = nodes.map((node, index) => {
        const y = 45 + index * 70;
        const fill = index === nodes.length - 1 ? '#385b83' : '#eef3f8';
        const color = index === nodes.length - 1 ? '#ffffff' : '#243b53';
        const arrow = index < nodes.length - 1 ? `<path d="M360 ${y + 42}v20m-6-6 6 6 6-6" fill="none" stroke="#8294a8" stroke-width="2"/>` : '';
        return `<rect x="145" y="${y}" width="430" height="42" rx="9" fill="${fill}" stroke="#9aafc4"/><text x="360" y="${y + 26}" text-anchor="middle" fill="${color}" font-size="14" font-weight="600">${escapeHtml(node)}</text>${arrow}`;
    }).join('');
    const svg = `<svg role="img" aria-label="Organisation fonctionnelle de ${escapeHtml(spec.domain || 'l’étude')}" xmlns="http://www.w3.org/2000/svg" width="720" height="340" viewBox="0 0 720 340"><text x="360" y="25" text-anchor="middle" fill="#243b53" font-size="15" font-weight="700">${escapeHtml(spec.domain || 'Organisation du dispositif')}</text>${boxes}</svg>`;
    return `<figure class="macevo-architecture">${scenarioSvgImage(svg, `Organisation fonctionnelle de ${spec.domain || 'l’étude'}`, 720, 340)}<figcaption>Figure — Organisation fonctionnelle du dispositif étudié</figcaption></figure>`;
}

function scenarioEquation(spec) {
    const expression = spec.equation || 'Indicateur = résultat observé / référence';
    const safeExpression = escapeHtml(expression);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="90" viewBox="0 0 1100 90"><rect x="1" y="1" width="1098" height="88" rx="10" fill="#f3f6fa" stroke="#d8e1eb"/><text x="550" y="54" text-anchor="middle" fill="#1e293b" font-family="Georgia,serif" font-size="25">${safeExpression}</text></svg>`;
    return `<figure class="macevo-equation-card">${scenarioSvgImage(svg, `Équation : ${expression}`, 1100, 90)}<figcaption class="macevo-equation-caption">Équation — ${safeExpression}</figcaption></figure>`;
}

function scenarioReferences(spec) {
    return (spec.references || []).map((ref, index) => {
        const citation = typeof ref === 'string'
            ? escapeHtml(ref)
            : `<a href="${escapeHtml(ref.url || '')}">${escapeHtml(ref.text || ref.title || '')}</a>`;
        return `<li><span>${index + 1}.</span> ${citation}</li>`;
    }).join('');
}

function getSectionContent(template, section) {
    const spec = getMacevoModelSpec(template);
    const profile = getDemoProfile(template);
    const key = String(section || '').toLowerCase();
    const configured = normalizeSectionContent(template?.sectionContent?.[section]);
    if (configured) return configured;
    if (template?.scientificBlueprint || spec.isNeutralFallback) {
        return buildAcademicModuleContent(template, { title: section }).html;
    }
    const reportingGuidance = (template?.reportingGuidelines || template?.documentRules?.reportingGuidelines || [])
        .map((guide) => `<p><strong>Guide de rapport :</strong> <a href="${escapeHtml(guide.url || '')}">${escapeHtml(guide.id || guide.title || '')}</a> — ${escapeHtml(guide.applicability || '')}</p>`)
        .join('');

    if (key.includes('introduction')) {
        return `<p>${escapeScenarioText(spec.title)} s'inscrit dans le domaine de <strong>${escapeScenarioText(spec.domain)}</strong>. Le travail part d'une situation concrète, identifie une difficulté mesurable et construit une réponse argumentée à partir d'une démarche méthodique.</p><p>La question directrice est la suivante : <em>${escapeScenarioText(spec.question)}</em></p><p>L'étude poursuit un objectif opérationnel : ${escapeScenarioText(spec.objective)}</p>`;
    }
    if (key.includes('revue') || key.includes('état de l’art') || key.includes('état de l\'art') || key.includes('related work')) {
        return `<p>La littérature et les travaux antérieurs montrent que la problématique étudiée doit être abordée à la fois par ses dimensions conceptuelles et par ses conditions de mise en œuvre. Les références retenues permettent de comparer les approches, d'identifier leurs avantages et de préciser le positionnement du présent travail.</p><p>La synthèse conduit à retenir trois critères de comparaison : pertinence pour le contexte, capacité d'évaluation et facilité d'intégration. Ce cadrage évite de réduire la discussion à une simple description des solutions existantes.</p><table class="macevo-demo-table"><thead><tr><th>Dimension</th><th>Approche dominante</th><th>Limite observée</th></tr></thead><tbody><tr><td>Conception</td><td>Approche structurée</td><td>Coût de mise en œuvre</td></tr><tr><td>Évaluation</td><td>Indicateurs mesurables</td><td>Dépendance aux données</td></tr><tr><td>Adoption</td><td>Accompagnement progressif</td><td>Effort organisationnel</td></tr></tbody></table>`;
    }
    if (key.includes('cadre théorique')) {
        return `<p>Le cadre théorique articule les notions de <strong>${escapeScenarioText(spec.domain)}</strong>, de performance et d'adoption. Il sert à définir les variables observées et à expliciter les relations attendues avant la collecte des données.</p><p>Le modèle d'analyse distingue les facteurs d'entrée, le mécanisme étudié et les résultats observables. Cette distinction permet de relier les choix méthodologiques aux hypothèses et aux indicateurs présentés plus loin.</p>${scenarioEquation(spec)}`;
    }
    if (key.includes('méthod') || key.includes('methodology') || key.includes('matériels')) {
        return `<p>${escapeScenarioText(spec.method)}</p>${reportingGuidance}<p>Le protocole est organisé de façon à assurer la traçabilité des observations et la comparabilité des résultats. Les indicateurs sont définis avant l'analyse afin de limiter les interprétations opportunistes.</p>${scenarioEquation(spec)}${scenarioTable(spec)}`;
    }
    if (key.includes('résultat') || key.includes('results') || key.includes('analyse des résultats')) {
        return `<p>${escapeScenarioText(spec.finding)}</p>${scenarioTable(spec)}${scenarioFigure(spec)}`;
    }
    if (key.includes('discussion') || key.includes('analyse')) {
        return `<p>Les résultats confirment l'intérêt de l'approche dans le contexte étudié, mais ils doivent être interprétés en tenant compte du périmètre de l'étude. ${escapeScenarioText(spec.finding)}</p><p>La principale limite concerne la généralisation des observations : les résultats sont directement valables pour le contexte étudié et doivent être confirmés sur un échantillon ou un environnement plus large avant toute généralisation.</p><p>Cette discussion conduit à recommander ${escapeScenarioText(spec.recommendation)}</p>`;
    }
    if (key.includes('conclusion') || key === 'bilan du stage' || key.includes('bilan')) {
        return `<p>Au terme de ce travail, la problématique — <em>${escapeScenarioText(spec.question)}</em> — reçoit une réponse fondée sur les observations et l'analyse présentées. L'objectif principal, qui consistait à ${escapeScenarioText(spec.objective).toLowerCase()}, est traité par une démarche cohérente allant du diagnostic à l'évaluation.</p><p>Le principal apport réside dans ${escapeScenarioText(spec.finding).toLowerCase()}</p><p>Pour la suite, ${escapeScenarioText(spec.recommendation)}</p>`;
    }
    if (key.includes('mission')) {
        return `<p>Les missions ont été organisées autour d'activités directement liées au fonctionnement de ${escapeScenarioText(profile.company || 'la structure étudiée')}. Elles ont permis de passer de l'observation à la production de livrables vérifiables.</p><table class="macevo-demo-table"><thead><tr><th>Activité</th><th>Livrable</th><th>Résultat</th></tr></thead><tbody><tr><td>Diagnostic</td><td>Cartographie du processus</td><td>Processus documenté</td></tr><tr><td>Conception / analyse</td><td>Proposition structurée</td><td>Solution validée</td></tr><tr><td>Évaluation</td><td>Indicateurs</td><td>Résultats mesurés</td></tr></tbody></table>`;
    }
    if (key.includes('travaux réalisés') || key.includes('implémentation') || key.includes('réalisation')) {
        return `<p>La réalisation a traduit les besoins prioritaires en livrables concrets. Les choix ont été documentés afin de rendre le résultat compréhensible et maintenable.</p>${scenarioArchitecture(spec)}<p>La mise en œuvre a été conduite par itérations, avec validation de chaque fonction critique avant intégration dans l'ensemble.</p>`;
    }
    if (key.includes('architecture')) return `${scenarioArchitecture(spec)}<p>L'architecture sépare les responsabilités essentielles et permet de limiter les dépendances inutiles. Cette organisation facilite les tests, la maintenance et l'évolution du dispositif.</p>`;
    if (key.includes('technologies')) return `<p>La sélection technique repose sur l'adéquation au besoin, la maturité des outils, la maintenabilité et la compatibilité avec l'environnement cible.</p><table class="macevo-demo-table"><thead><tr><th>Composant</th><th>Rôle</th><th>Critère de choix</th></tr></thead><tbody><tr><td>Couche interface</td><td>Interaction</td><td>Réutilisabilité</td></tr><tr><td>Couche métier</td><td>Traitement</td><td>Testabilité</td></tr><tr><td>Couche données</td><td>Persistance</td><td>Intégrité</td></tr></tbody></table>`;
    if (key.includes('tests')) return `<p>La validation couvre les scénarios fonctionnels critiques et les cas d'erreur. Chaque test associe une condition initiale, une action et un résultat attendu.</p><table class="macevo-demo-table"><thead><tr><th>Scénario</th><th>Résultat attendu</th><th>Statut</th></tr></thead><tbody><tr><td>Parcours principal</td><td>Résultat conforme</td><td>Validé</td></tr><tr><td>Donnée invalide</td><td>Erreur explicite</td><td>Validé</td></tr><tr><td>Charge / variation</td><td>Service stable</td><td>Validé</td></tr></tbody></table>`;
    if (key.includes('présentation de l’entreprise') || key.includes('présentation de l’organisation')) return `<p><strong>${escapeScenarioText(profile.company || profile.institution)}</strong> évolue dans le domaine de ${escapeScenarioText(spec.domain)}. L'organisation observée associe pilotage, expertise métier et fonctions de support afin d'assurer la continuité des activités.</p><table class="macevo-demo-table"><thead><tr><th>Pôle</th><th>Responsabilité</th></tr></thead><tbody><tr><td>Direction</td><td>Pilotage et arbitrage</td></tr><tr><td>Opérations</td><td>Production et suivi</td></tr><tr><td>Support</td><td>Qualité, assistance et coordination</td></tr></tbody></table>`;
    if (key.includes('présentation du service') || key.includes('environnement de travail')) return `<p>Le service d'accueil assure la coordination des activités liées à ${escapeScenarioText(spec.domain)}. Son fonctionnement repose sur une circulation régulière de l'information entre responsables, collaborateurs et bénéficiaires.</p><p>L'environnement de travail a permis d'observer les contraintes réelles de délai, de qualité et de coordination qui structurent les choix présentés dans ce rapport.</p>`;
    if (key.includes('compétences')) return `<p>La réalisation du travail a renforcé des compétences techniques, méthodologiques et professionnelles. Les acquis ne se limitent pas à la production du livrable : ils concernent également l'analyse des besoins, la justification des choix et la communication des résultats.</p><table class="macevo-demo-table"><thead><tr><th>Compétence</th><th>Situation mobilisée</th><th>Niveau acquis</th></tr></thead><tbody><tr><td>Analyse</td><td>Diagnostic initial</td><td>Maîtrisé</td></tr><tr><td>Conception</td><td>Production du dispositif</td><td>Maîtrisé</td></tr><tr><td>Communication</td><td>Restitution</td><td>Opérationnel</td></tr></tbody></table>`;
    if (key.includes('difficult') || key.includes('problème')) return `<p>Les difficultés rencontrées ont principalement concerné la disponibilité des informations, la clarification de certains besoins et la gestion des contraintes de délai. Elles ont été traitées par priorisation, vérification des hypothèses et échanges réguliers avec les responsables.</p><p>Cette expérience montre qu'une difficulté devient un levier d'amélioration lorsqu'elle est documentée, analysée et transformée en action corrective.</p>`;
    if (key.includes('solutions apportées') || key.includes('recommandations')) return `<p>Les solutions proposées privilégient les actions à fort impact et à mise en œuvre réaliste : ${escapeScenarioText(spec.recommendation)}</p>${scenarioTable(spec)}`;
    if (key.includes('planification')) return `<table class="macevo-demo-table"><thead><tr><th>Phase</th><th>Objectif</th><th>Livrable</th></tr></thead><tbody><tr><td>Préparation</td><td>Cadrer le besoin</td><td>Note de cadrage</td></tr><tr><td>Réalisation</td><td>Produire</td><td>Livrable principal</td></tr><tr><td>Validation</td><td>Mesurer</td><td>Rapport de validation</td></tr></tbody></table><p>La planification privilégie des jalons courts afin de détecter rapidement les écarts et de sécuriser les décisions.</p>`;
    if (key.includes('dimensionnement')) return `${scenarioEquation(spec)}<p>Le dimensionnement est conduit à partir du besoin énergétique, des conditions d'exploitation et d'un coefficient de sécurité. Les hypothèses sont explicitées afin de rendre le calcul vérifiable.</p>${scenarioTable(spec)}`;
    if (key.includes('jury')) return `<div class="macevo-jury"><div><strong>Présidence du jury</strong></div><div><strong>Rapport scientifique</strong></div><div><strong>Direction de recherche</strong></div></div>`;
    if (key.includes('résumé')) return `<p><strong>Contexte.</strong> ${escapeScenarioText(spec.title)}.</p><p><strong>Démarche.</strong> ${escapeScenarioText(spec.method)}</p><p><strong>Résultat principal.</strong> ${escapeScenarioText(spec.finding)}</p><p><strong>Conclusion.</strong> ${escapeScenarioText(spec.recommendation)}</p><p><strong>Mots-clés :</strong> ${escapeScenarioText(spec.domain)}, analyse, méthode, évaluation, performance.</p>`;
    if (key.includes('abstract')) return `<p><strong>Background.</strong> ${escapeScenarioText(spec.title)}.</p><p><strong>Methods.</strong> ${escapeScenarioText(spec.method)}</p><p><strong>Results.</strong> ${escapeScenarioText(spec.finding)}</p><p><strong>Conclusion.</strong> ${escapeScenarioText(spec.recommendation)}</p><p><strong>Keywords:</strong> ${escapeScenarioText(spec.domain)}, analysis, method, evaluation, performance.</p>`;
    if (key.includes('mots-clés') || key.includes('keywords')) return `<p class="macevo-keywords">${escapeScenarioText(spec.domain)} · analyse · méthode · évaluation · performance · transformation</p>`;
    if (key.includes('auteurs')) return `<div class="macevo-author-block"><strong>${escapeScenarioText(profile.student)}</strong><span>${escapeScenarioText(profile.department)} — ${escapeScenarioText(profile.institution)}</span></div>`;
    if (key.includes('affiliations')) return `<p><strong>${escapeScenarioText(profile.institution)}</strong><br>${escapeScenarioText(profile.faculty)}<br>${escapeScenarioText(profile.department)}</p>`;
    if (key.includes('liste des figures')) return `<div class="macevo-illustration-list"><div class="macevo-list-entry"><span>Figure 1</span><span class="macevo-list-label">${escapeHtml(spec.figureTitle || 'Synthèse des indicateurs')}</span><span class="macevo-list-dots"></span><span>—</span></div><div class="macevo-list-entry"><span>Figure 2</span><span class="macevo-list-label">Organisation fonctionnelle du dispositif</span><span class="macevo-list-dots"></span><span>—</span></div></div>`;
    if (key.includes('liste des tableaux')) return `<div class="macevo-illustration-list"><div class="macevo-list-entry"><span>Tableau 1</span><span class="macevo-list-label">${escapeHtml(spec.tableTitle || 'Synthèse des indicateurs')}</span><span class="macevo-list-dots"></span><span>—</span></div><div class="macevo-list-entry"><span>Tableau 2</span><span class="macevo-list-label">Paramètres et résultats</span><span class="macevo-list-dots"></span><span>—</span></div></div>`;
    if (key.includes('liste des abréviations')) return `<dl class="macevo-abbreviations"><dt>API</dt><dd>Application Programming Interface</dd><dt>IoT</dt><dd>Internet of Things</dd><dt>SI</dt><dd>Système d'information</dd><dt>UML</dt><dd>Unified Modeling Language</dd></dl>`;
    if (key.includes('dédicace')) return `<p class="macevo-dedication">À ma famille, à mes enseignants et à toutes les personnes dont le soutien a contribué à la réalisation de ce travail.</p>`;
    if (key.includes('remerci')) return `<p>Je remercie <strong>${escapeScenarioText(profile.academicSupervisor)}</strong> pour l'encadrement scientifique apporté à ce travail et <strong>${escapeScenarioText(profile.supervisor)}</strong> pour l'accompagnement professionnel. J'adresse également mes remerciements à l'équipe pédagogique, aux collaborateurs et aux participants qui ont contribué à la qualité de cette étude.</p>`;
    if (key.includes('bibliographie') || key.includes('références')) return `<ol class="macevo-reference-list">${scenarioReferences(spec)}</ol>`;
    if (key.includes('annexe')) return `<div class="macevo-annex-card"><strong>Annexe A — Instrument de collecte / protocole</strong><span>Grille, questionnaire, protocole ou fiche de test utilisé pour produire les données présentées.</span></div><div class="macevo-annex-card"><strong>Annexe B — Éléments techniques complémentaires</strong><span>Extraits de configuration, résultats détaillés, schémas ou tableaux complémentaires.</span></div>`;
    return `<p>Cette section expose les éléments nécessaires à la compréhension de <strong>${escapeScenarioText(spec.title)}</strong>. Elle conserve une progression logique entre contexte, argumentation, preuve et interprétation afin que le lecteur puisse suivre le raisonnement sans rupture.</p>`;
}

function getIllustrationList(template, type) {
    const spec = getMacevoModelSpec(template);
    if (type === 'figure') return `<div class="macevo-illustration-list"><div class="macevo-list-entry"><span>Figure 1</span><span class="macevo-list-label">${escapeHtml(spec.figureTitle || 'Synthèse des indicateurs')}</span><span class="macevo-list-dots"></span><span>—</span></div><div class="macevo-list-entry"><span>Figure 2</span><span class="macevo-list-label">Organisation fonctionnelle du dispositif</span><span class="macevo-list-dots"></span><span>—</span></div></div>`;
    return `<div class="macevo-illustration-list"><div class="macevo-list-entry"><span>Tableau 1</span><span class="macevo-list-label">${escapeHtml(spec.tableTitle || 'Synthèse des indicateurs')}</span><span class="macevo-list-dots"></span><span>—</span></div><div class="macevo-list-entry"><span>Tableau 2</span><span class="macevo-list-label">Paramètres et résultats</span><span class="macevo-list-dots"></span><span>—</span></div></div>`;
}


/* ============================================================

    TYPES DE SECTIONS

============================================================ */



function isCoverSection(section) {

    const value = String(section || "").toLowerCase();



    return (

         value === "page de garde" ||

         value === "page institutionnelle"

    );

}




function isPreliminarySection(section) {

    const value = String(section || "").toLowerCase();



    return [

         "dédicace",

         "remerciements",

         "résumé",

         "abstract",
         "table des matières",
         "sommaire",
         "page de titre",
         "jury",

         "liste des figures",

         "liste des tableaux",

         "liste des abréviations",

         "mots-clés",

         "auteurs",

    ].includes(value);

}




function isReferenceSection(section) {

    const value = String(section || "").toLowerCase();



    return (

         value.includes("bibliographie") ||

         value.includes("références")

    );

}




function isAnnexSection(section) {

    const value = String(section || "").toLowerCase();



    return value.includes("annexe");

}




function isConclusionSection(section) {
    const value = String(section || "").toLowerCase();



    return (

         value.includes("conclusion") ||

         value === "bilan du stage"

    );

}




/* ============================================================

    PAGE DE GARDE — DESIGN PROFESSIONNEL

============================================================ */



function generateCoverPage(template, options = {}) {

    const demoProfile = getDemoProfile(template);

    const title =
         options.title ||
         demoProfile.title;



    const author =
         options.author ||
         demoProfile.student;



    const institution =
         options.institution ||
         demoProfile.institution;



    const department =

         options.department ||
         `${demoProfile.faculty} — ${demoProfile.department}`;



const supervisor =
 options.supervisor ||
 demoProfile.academicSupervisor;



const academicYear =
 options.academicYear ||
 demoProfile.year;



const design =

 getTemplateDesign(template);



const colors =

 design.colors;



const cover =

 design.cover;



const primary =

 colors.primary;



const secondary =

 colors.secondary;



const accent =

 colors.accent;
const alignment =

  cover.alignment;



const badge =

  template?.badge ||

  "DOCUMENT ACADÉMIQUE";



const coverStyle =

  cover.style;



/* ---------------------------------------------------------

 COUVERTURE ACADÉMIQUE

--------------------------------------------------------- */



if (coverStyle === "academic") {

  return `

    <div

        class="macevo-cover macevo-cover-academic"

        style="

            --macevo-primary:${primary};

            --macevo-secondary:${secondary};

            --macevo-accent:${accent};

            text-align:${alignment};

        "

    >



        <div class="macevo-cover-top-line"></div>
${

    cover.showBadge

     ?`

         <div class="macevo-cover-badge">

            ${escapeHtml(badge)}

         </div>

     `

     : ""

}



${

    cover.showLogo

     ?`

         <div class="macevo-cover-brand">

            <div class="macevo-cover-logo">

             M

            </div>



            <div>

             <div class="macevo-cover-brand-name">

                 MACEVO

             </div>



             <div class="macevo-cover-brand-subtitle">

                 Édition académique

             </div>

            </div>

         </div>
     `

     : ""

}



<div class="macevo-cover-institution">

    ${escapeHtml(institution)}

</div>



<div class="macevo-cover-department">

    ${escapeHtml(department)}

</div>



${

    cover.showAccentLine

     ?`

         <div class="macevo-cover-accent-line"></div>

     `

     : ""

}



<h1 class="macevo-cover-title">

    ${escapeHtml(title)}

</h1>



<div class="macevo-cover-meta">



    <div class="macevo-cover-meta-block">

     <span>Présenté par</span>
      <strong>

          ${escapeHtml(author)}

      </strong>

     </div>



     <div class="macevo-cover-meta-block">

      <span>Directeur / Encadreur</span>

      <strong>

          ${escapeHtml(supervisor)}

      </strong>

     </div>



 </div>



 <div class="macevo-cover-year">

     ${escapeHtml(academicYear)}

 </div>



 ${

     cover.showBottomBand

      ?`

          <div class="macevo-cover-bottom-band"></div>

      `

      : ""

 }



</div>
     <div class="macevo-page-break-spacer"></div>

    `;

}



/* ---------------------------------------------------------

    COUVERTURE MODERNE

--------------------------------------------------------- */



if (coverStyle === "modern") {

    return `

     <div

         class="macevo-cover macevo-cover-modern"

         style="

             --macevo-primary:${primary};

             --macevo-secondary:${secondary};

             --macevo-accent:${accent};

         "

     >



         <div class="macevo-modern-sidebar"></div>



         <div class="macevo-modern-content">



             ${

              cover.showBadge

                  ?`

                   <div class="macevo-modern-badge">

                       ${escapeHtml(badge)}
         </div>

     `

     : ""

}



<div class="macevo-modern-brand">

    MACEVO

</div>



<div class="macevo-modern-institution">

    ${escapeHtml(institution)}

</div>



<h1 class="macevo-modern-title">

    ${escapeHtml(title)}

</h1>



<div class="macevo-modern-divider"></div>



<div class="macevo-modern-details">



    <div>

     <span>Département</span>

     <strong>

         ${escapeHtml(department)}

     </strong>

    </div>
            <div>

              <span>Auteur</span>

              <strong>

                  ${escapeHtml(author)}

              </strong>

            </div>



            <div>

              <span>Encadrement</span>

              <strong>

                  ${escapeHtml(supervisor)}

              </strong>

            </div>



          </div>



          <div class="macevo-modern-year">

            ${escapeHtml(academicYear)}

          </div>



         </div>



     </div>



     <div class="macevo-page-break-spacer"></div>

    `;

}
/* ---------------------------------------------------------

 COUVERTURE SCIENTIFIQUE

--------------------------------------------------------- */



if (coverStyle === "scientific") {

  return `

    <div

        class="macevo-cover macevo-cover-scientific"

        style="

            --macevo-primary:${primary};

            --macevo-secondary:${secondary};

            --macevo-accent:${accent};

        "

    >



        <div class="macevo-scientific-header">



            <div class="macevo-scientific-mark">

             M

            </div>



            <div>

             <strong>MACEVO</strong>

             <span>Research & Academic</span>

            </div>



        </div>
${

    cover.showBadge

     ?`

         <div class="macevo-scientific-badge">

            ${escapeHtml(badge)}

         </div>

     `

     : ""

}



<div class="macevo-scientific-institution">

    ${escapeHtml(institution)}

</div>



<div class="macevo-scientific-department">

    ${escapeHtml(department)}

</div>



<div class="macevo-scientific-rule"></div>



<h1>

    ${escapeHtml(title)}

</h1>



<div class="macevo-scientific-info">



    <div>

     <small>AUTEUR</small>
            <strong>

              ${escapeHtml(author)}

            </strong>

          </div>



          <div>

            <small>ENCADREMENT</small>

            <strong>

              ${escapeHtml(supervisor)}

            </strong>

          </div>



         </div>



         <div class="macevo-scientific-year">

          ${escapeHtml(academicYear)}

         </div>



     </div>



     <div class="macevo-page-break-spacer"></div>

    `;

}



/* ---------------------------------------------------------

    COUVERTURE ARTICLE

--------------------------------------------------------- */
if (coverStyle === "article") {

  return `

    <div

        class="macevo-cover macevo-cover-article"

        style="

            --macevo-primary:${primary};

            --macevo-secondary:${secondary};

            --macevo-accent:${accent};

        "

    >



        <div class="macevo-article-brand">

            MACEVO

        </div>



        <div class="macevo-article-type">

            ${escapeHtml(badge)}

        </div>



        <h1>

            ${escapeHtml(title)}

        </h1>



        <div class="macevo-article-authors">

            ${escapeHtml(author)}

        </div>



        <div class="macevo-article-institution">
          ${escapeHtml(institution)}

          ${

              department

               ? ` · ${escapeHtml(department)}`

               : ""

          }

         </div>



         <div class="macevo-article-year">

          ${escapeHtml(academicYear)}

         </div>



     </div>



     <div class="macevo-page-break-spacer"></div>

    `;

}



/* ---------------------------------------------------------

    COUVERTURE SIDEBAR

--------------------------------------------------------- */



if (coverStyle === "sidebar") {

    return `

     <div

         class="macevo-cover macevo-cover-sidebar"

         style="

          --macevo-primary:${primary};
        --macevo-secondary:${secondary};

        --macevo-accent:${accent};

    "

>



    <div class="macevo-sidebar-cover-panel">



        <div class="macevo-sidebar-cover-logo">

         M

        </div>



        <div class="macevo-sidebar-cover-brand">

         MACEVO

        </div>



        <div class="macevo-sidebar-cover-type">

         ${escapeHtml(badge)}

        </div>



        <div class="macevo-sidebar-cover-year">

         ${escapeHtml(academicYear)}

        </div>



    </div>



    <div class="macevo-sidebar-cover-main">



        <div class="macevo-sidebar-cover-institution">
   ${escapeHtml(institution)}

 </div>



 <div class="macevo-sidebar-cover-department">

   ${escapeHtml(department)}

 </div>



 <h1>

   ${escapeHtml(title)}

 </h1>



 <div class="macevo-sidebar-cover-line"></div>



 <div class="macevo-sidebar-cover-author">

   <span>Présenté par</span>

   <strong>

     ${escapeHtml(author)}

   </strong>

 </div>



 <div class="macevo-sidebar-cover-author">

   <span>Encadreur</span>

   <strong>

     ${escapeHtml(supervisor)}

   </strong>

 </div>



</div>
        </div>



        <div class="macevo-page-break-spacer"></div>

    `;

}



/* ---------------------------------------------------------

    FALLBACK

--------------------------------------------------------- */



return `

    <div

        class="macevo-cover macevo-cover-academic"

        style="

            --macevo-primary:${primary};

            --macevo-secondary:${secondary};

            --macevo-accent:${accent};

        "

    >



        <div class="macevo-cover-badge">

            ${escapeHtml(badge)}

        </div>



        <div class="macevo-cover-brand-name">

            MACEVO

        </div>
         <div class="macevo-cover-institution">

          ${escapeHtml(institution)}

         </div>



         <h1 class="macevo-cover-title">

          ${escapeHtml(title)}

         </h1>



         <div class="macevo-cover-meta-block">

          <span>Présenté par</span>

          <strong>

            ${escapeHtml(author)}

          </strong>

         </div>



         <div class="macevo-cover-year">

          ${escapeHtml(academicYear)}

         </div>



     </div>



     <div class="macevo-page-break-spacer"></div>

    `;

}




/* ============================================================
 TABLE DES MATIÈRES

============================================================ */



function generateTableOfContents(template) {
    if (!template?.sections?.length) return '';
    const tocIndex = template.sections.findIndex(s => /^(table des matières|sommaire)$/i.test(String(s).trim()));
    const excluded = new Set(['page de garde', 'page institutionnelle', 'page de titre', 'dédicace', 'remerciements']);
    const rows = template.sections
        .map((section, index) => ({ section: String(section), index }))
        .filter(({ section, index }) => index !== tocIndex && !excluded.has(section.toLowerCase()))
        .map(({ section, index }) => {
            const label = /^(chapitre|partie)/i.test(section) ? `<strong>${escapeHtml(section)}</strong>` : escapeHtml(section);
            return `<div class="macevo-toc-row"><span class="macevo-toc-title">${label}</span><span class="macevo-toc-dots"></span><span class="macevo-toc-page">—</span></div>`;
        }).join('');
    return `<section class="macevo-toc"><div class="macevo-toc-kicker">STRUCTURE DU DOCUMENT</div><h1>TABLE DES MATIÈRES</h1><div class="macevo-toc-intro">Sections, chapitres et éléments de référence</div><div class="macevo-toc-list">${rows}</div></section>`;
}


/* ============================================================

    SECTION PRÉLIMINAIRE

============================================================ */



function generatePreliminarySection(section, template) {
    const content = getSectionContent(template, section);
    const lower = String(section).toLowerCase();
    if (lower === 'table des matières' || lower === 'sommaire') return generateTableOfContents(template);
    const kicker = lower === 'auteurs' || lower === 'affiliations' || lower === 'jury' ? 'PUBLICATION' : 'ÉLÉMENTS PRÉLIMINAIRES';
    return `<div class="macevo-preliminary-heading"><span>${kicker}</span><h1>${escapeHtml(section)}</h1></div>${textToHtml(content)}`;
}

/* ============================================================

    SECTION ACADÉMIQUE

============================================================ */

function generateAcademicSection(section, chapterNumber, template) {
    const content = getSectionContent(template, section);
    const sectionName = escapeHtml(section);
    const n = Number(chapterNumber) || 1;
    const lower = String(section).toLowerCase();
    const isEndMatter = isReferenceSection(section) || isAnnexSection(section);
    const kicker = isReferenceSection(section)
        ? 'RÉFÉRENCES'
        : isAnnexSection(section)
            ? 'ANNEXES'
            : isConclusionSection(section)
                ? 'SYNTHÈSE'
                : /chapitre|partie|introduction|méthodologie|résultats|discussion|conception|architecture|implémentation|tests/i.test(lower)
                    ? `SECTION ${String(n).padStart(2, '0')}`
                    : 'DÉVELOPPEMENT';
    return `<div class="macevo-section-kicker">${kicker}</div><h1>${sectionName}</h1><div class="macevo-section-rule"></div>${content}${isEndMatter ? '' : ''}`;
}


/* ============================================================

    SECTION ACADÉMIQUE

============================================================ */





function generateTemplateHtml(

     template,

     options = {}

){

     if (

          !template ||

          !Array.isArray(template.sections)

     ){

          return "";

     }



     let html = "";



     const sections =

          template.sections;



     /* ---------------------------------------------------------

         PAGE DE GARDE

     --------------------------------------------------------- */



     const hasCover =
    sections.some(isCoverSection);



if (hasCover) {

    html += generateCoverPage(

         template,

         options

    );

}



/* ---------------------------------------------------------

    CONTENU

--------------------------------------------------------- */



let academicIndex = 0;

if (template.contentStatus === "scientific-blueprint" || getMacevoModelSpec(template).isNeutralFallback) {
    html += `<p class="macevo-demo-disclaimer"><strong>DOCUMENT EN COURS DE CONSTRUCTION —</strong> le plan et les repères méthodologiques viennent de vos choix. Les résultats, sources et illustrations empiriques doivent correspondre à votre recherche réelle.</p>`;
} else if (template.contentStatus === "illustrative-scenario") {
    html += `<p class="macevo-demo-disclaimer"><strong>SCÉNARIO DE DÉMONSTRATION —</strong> le sujet, les constats et les chiffres présentés illustrent la structure du modèle. Ils ne sont pas des résultats de recherche vérifiés.</p>`;
}



sections.forEach((section) => {

    if (isCoverSection(section)) {

         return;

    }



    /* Pages préliminaires */

    if (isPreliminarySection(section)) {

         html += `

          <div class="macevo-preliminary">

            ${generatePreliminarySection(

                 section,

                 template

            )}
           </div>



           <div class="macevo-page-break-spacer"></div>

          `;



          return;

      }



      /* Partie académique */

      academicIndex += 1;



      html += `

          <div class="macevo-academic-section">



           ${generateAcademicSection(

                section,

                academicIndex,

                template

           )}



          </div>



          <div class="macevo-section-spacer"></div>

      `;

    });



    return html;

}
/* ============================================================

 STATISTIQUES

============================================================ */



function calculateStatistics(html) {

 if (!html) {

      return {

           words: 0,

           characters: 0,

      };

 }



 const tempText =

      html

           .replace(/<[^>]*>/g, " ")

           .replace(/\s+/g, " ")

           .trim();



 return {

      words: tempText

           ? tempText.split(/\s+/).length

           : 0,



      characters:

           tempText.length,

 };
}




/* ============================================================

    CONTEXTE

============================================================ */



const EditorContext =

    createContext(null);




/* ============================================================

    PROVIDER

============================================================ */



function EditorProvider({

    children,

}) {

    /* ========================================================

       NAVIGATION

    ======================================================== */



    const location = useLocation();
    const [loadedTemplate, setLoadedTemplate] = useState(null);



    /* ========================================================

       RAPPORT COURANT

    ======================================================== */
const storedReportRef =

     useRef(null);



if (

     storedReportRef.current === null

){

     try {

         const stored =

              sessionStorage.getItem(

                   "macevo_current_report"

              );



         storedReportRef.current =

              stored

                   ? JSON.parse(stored)

                   : null;

     } catch (error) {

         console.error(

              "Erreur lecture sessionStorage MACEVO :",

              error

         );



         storedReportRef.current =

              null;

     }

}



const navigationReportId =
  location?.state?.reportId ||
  null;

const reportId =
  navigationReportId ||
  storedReportRef.current?.reportId ||
  null;



const templateId =

  storedReportRef.current?.templateId ||

  null;



const templateName =

  storedReportRef.current?.templateName ||

  null;



/* --------------------------------------------------------

 TEMPLATE TRANSMIS PAR LA NAVIGATION

 Permet à Templates.jsx de transmettre le modèle sans

 dépendre uniquement du sessionStorage.

-------------------------------------------------------- */



const navigationTemplate =

  location?.state?.template ||

  null;



const navigationTemplateId =

  navigationTemplate?.id ||

  location?.state?.templateId ||

  null;



const effectiveTemplateId =

  templateId ||
 navigationTemplateId ||

 null;




/* ========================================================

 TEMPLATE

======================================================== */



const storedTemplate = storedReportRef.current?.template || null;

const selectedTemplate =
  navigationTemplate ||
    loadedTemplate ||
    storedTemplate ||
  (effectiveTemplateId ? getReportTemplate(effectiveTemplateId) : null) ||
  null;


const templateDesign =

 useMemo(

    () => getTemplateDesign(selectedTemplate),

   [selectedTemplate]
 );




/* ========================================================

 STATES

======================================================== */



const documentState =

 useDocumentState();



const statisticsState =

 useStatisticsState();



const selectionState =

 useSelectionState();



const saveState =

 useSaveState();



const referenceState =

 useReferenceState();



const commentState =

 useCommentState();



const historyState =

 useHistoryState();
const themeState =

 useThemeState();



const aiState =

 useAIState();




/* ========================================================

 REFS

======================================================== */



const isLoadingReport =

 useRef(false);



const saveTimeoutRef =

 useRef(null);


/*
 * AUTOSAVE ROBUSTE
 *
 * - saveGenerationRef identifie la dernière modification locale.
 * - saveQueueRef sérialise les PATCH afin qu'une ancienne requête
 *   ne puisse pas écraser une modification plus récente côté serveur.
 */
const saveGenerationRef =

 useRef(0);


const saveQueueRef =

 useRef(Promise.resolve());



const initialContentLoaded =

 useRef(false);



const isInitializingEditor =

 useRef(false);

/* ========================================================

 MODÈLE DOCUMENT CANONIQUE MACEVO

 Le document métier est conservé séparément du HTML TipTap.
 Le HTML est une représentation éditable du modèle.

======================================================== */

const macevoDocumentRef = useRef(null);

/* ========================================================

 PAGINATION

 Pagination réelle A4 avec reflow automatique.

 PAGE_SIZES.A4 = 794 x 1123 px.

======================================================== */



const PAGINATION_ENABLED = true;
/* ========================================================

 RENDU STRUCTURE BACKEND — SOURCE DE VÉRITÉ

======================================================== */

function resolveMediaUrl(value) {
    if (!value) return "";
    let raw = value;
    if (typeof value === "object") {
        raw = value.url || value.src || value.file || value.path || "";
    }
    if (!raw || typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (/^(?:https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    try {
        const base = api?.defaults?.baseURL || (typeof window !== "undefined" ? window.location.origin : "");
        return new URL(trimmed, base || undefined).toString();
    } catch (_) {
        return trimmed;
    }
}

function getReportLogoUrl(report = {}) {
    return resolveMediaUrl(
        report.institution_logo || report.institutionLogo || report.logo ||
        report.logo_url || report.logoUrl || ""
    );
}

function enrichDocumentModelWithReport(model, report = {}) {
    if (!model || !report) return model;
    const metadata = model.metadata || {};
    const logoUrl = getReportLogoUrl(report);
    model.metadata = {
        ...metadata,
        title: report.title || metadata.title || "",
        author: report.author || metadata.author || "",
        type: report.report_type || report.type || metadata.type || "Document académique",
        institution: report.institution || metadata.institution || "",
        faculty: report.faculty || metadata.faculty || "",
        department: report.department || metadata.department || "",
        program: report.program || metadata.program || "",
        specialty: report.specialty || metadata.specialty || "",
        academicYear: report.academic_year || metadata.academicYear || "",
        supervisor: report.supervisor || report.director || metadata.supervisor || "",
        coSupervisor: report.co_supervisor || metadata.coSupervisor || "",
        logoUrl: logoUrl || metadata.logoUrl || "",
        institutionLogo: logoUrl || metadata.institutionLogo || "",
    };
    return model;
}

function isGeneratedStarterContent(value) {
    if (!value || typeof value !== "string") return true;

    const normalized = value.trim();

    if (!normalized) return true;

    return (
        /data-macevo-placeholder/i.test(normalized) ||
        /Commencez votre rédaction/i.test(normalized) ||
        /^<h1[^>]*>[^<]*<\/h1>\s*<p[^>]*>[^<]*<\/p>$/i.test(normalized)
    );
}

function parseCanonicalDocumentCandidate(value) {
    if (!value) return null;

    try {
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed) return null;
            const parsed = JSON.parse(trimmed);
            if (
                parsed &&
                parsed.model === "MACEVO_DOCUMENT" &&
                parsed.modelVersion
            ) {
                return deserializeMacevoDocument(parsed);
            }
            return null;
        }

        if (
            typeof value === "object" &&
            value.model === "MACEVO_DOCUMENT" &&
            value.modelVersion
        ) {
            return deserializeMacevoDocument(value);
        }
    } catch (error) {
        return null;
    }

    return null;
}

function isLegacyStructureText(value) {
    if (typeof value !== "string") return false;
    const normalized = value.trim();
    if (!normalized) return false;

    return (
        /^#\s+Table des matières/im.test(normalized) ||
        /\]\(#node-[^)]+\)/i.test(normalized) ||
        /^#{1,6}\s+\d+(?:\.\d+)*\s+/m.test(normalized) ||
        /^#{1,6}\s+(?:Introduction|Revue|Méthodologie|Résultats|Discussion|Conclusion)\b/im.test(normalized) ||
        /(^|\n)\s*\|[^\n]*\|\s*\n\s*\|?\s*:?-{3,}:?/m.test(normalized)
    );
}

function looksLikeLegacyRenderedDocument(value) {
    if (!value || typeof value !== "string") return false;

    const source = value
        .replace(/<[^>]*>/g, "\n")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .trim();

    if (!source) return false;

    return (
        /^#{1,6}\s+\d+(?:\.\d+)*\s+/m.test(source) ||
        /^#{1,6}\s+(?:Page de garde|Dédicace|Remerciements|Résumé|Table des matières|Introduction|Problématique|Méthodologie|Résultats|Discussion|Conclusion|Références|Annexes)\b/im.test(source) ||
        /(^|\n)\s*\|[^\n]*\|\s*(?:\n|$)\s*\|\s*:?-{1,}:?/m.test(source)
    );
}

function normalizeReportStructure(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }
    return [];
}

function getReportDocumentModel(report, template = null) {
    if (!report) return null;
    const structure = normalizeReportStructure(report.structure);
    const hasStructure = structure.length > 0;
    const backendModel = parseCanonicalDocumentCandidate(report.macevo_document);

    if (backendModel) {
        return enrichDocumentModelWithReport(backendModel, report);
    }

    /*
     * Les rapports historiques sans snapshot canonique sont reconstruits
     * depuis leur structure backend.
     * Cela empêche un ancien Markdown/plain-text de masquer la couverture,
     * le logo, les tableaux et le design du modèle.
     */
    if (hasStructure) {
        const structuredModel = buildDocumentModel(
            { ...report, structure, content: report.content || "" },
            structure
        );
        if (structuredModel) {
            return enrichDocumentModelWithReport(structuredModel, report);
        }
    }

    const rootModel = parseCanonicalDocumentCandidate(report);
    if (rootModel) return enrichDocumentModelWithReport(rootModel, report);

    const sessionModel = parseCanonicalDocumentCandidate(storedReportRef.current?.macevoDocument);
    if (sessionModel) return enrichDocumentModelWithReport(sessionModel, report);

    const contentModel = parseCanonicalDocumentCandidate(report.content);
    if (contentModel) return enrichDocumentModelWithReport(contentModel, report);

    if (hasStructure) {
        const structuredModel = buildDocumentModel(
            { ...report, structure, content: report.content || "" },
            structure
        );
        if (structuredModel) return enrichDocumentModelWithReport(structuredModel, report);

        if (template) {
            const fallback = createMacevoDocument(template, {
                documentId: report.id || report.pk || null,
                metadata: {
                    title: report.title || template.name || template.label || "Nouveau document",
                    author: report.author || "",
                    type: report.report_type || report.type || template.type,
                    language: report.language,
                    academicLevel: report.academic_level,
                    scientificField: report.scientific_field,
                    citationStyle: report.citation_style,
                    createdAt: report.created_at,
                    updatedAt: report.updated_at,
                },
                academicContext: {
                    institution: report.institution,
                    department: report.department,
                    faculty: report.faculty,
                    program: report.program,
                    country: report.country,
                },
                profile: getDemoProfile(template),
            });
            return enrichDocumentModelWithReport(fallback, report);
        }
    }
    return null;
}

function buildTemplateDocument(template) {
    if (!template) {
        return null;
    }

    const profile = getDemoProfile(template);

    return createMacevoDocument(
        template,
        {
            title:
                profile.title ||
                template.title ||
                template.name ||
                "Nouveau document",

            author:
                profile.student ||
                "",

            type:
                template.category ||
                template.type ||
                "Document académique",

            language:
                Array.isArray(template.language)
                    ? template.language[0]
                    : template.language,

            academicLevel:
                Array.isArray(template.level)
                    ? template.level[0]
                    : template.level,

            scientificField:
                Array.isArray(template.fields)
                    ? template.fields[0]
                    : template.fields,

            citationStyle:
                template.citationStyle ||
                template.citation?.style ||
                "APA",

            institution:
                profile.institution ||
                template.academicContext?.institution ||
                null,

            faculty:
                profile.faculty ||
                template.academicContext?.faculty ||
                null,

            department:
                profile.department ||
                template.academicContext?.department ||
                null,

            program:
                profile.program ||
                template.academicContext?.program ||
                null,

            specialty:
                profile.specialty ||
                template.academicContext?.specialty ||
                null,
        }
    );
}

function renderMacevoDocumentModel(model, template = null) {
    return renderTemplateDocument(model, template);
}

function getDocumentHtml(model, template = null) {
    if (!model) return "";

    const storedHtml =
        typeof model?.editor?.html === "string"
            ? model.editor.html.trim()
            : "";

    /* Un HTML marqué comme provenant du template peut être régénéré sans
       risque. En revanche, un HTML explicitement édité par l'utilisateur
       doit être conservé. */
    const userEdited =
        model?.editor?.source === "user" ||
        model?.editor?.dirty === true;

    const unsafeGeneratedContent =
        isLegacyStructureText(storedHtml) ||
        looksLikeLegacyRenderedDocument(storedHtml) ||
        /^\s*\{\s*["']model["']\s*:\s*["']MACEVO_DOCUMENT/i.test(storedHtml);

    if (storedHtml && userEdited && !unsafeGeneratedContent) {
        return cleanLatexToHtml(storedHtml);
    }

    return renderMacevoDocumentModel(
        model,
        template
    );
}


/* ========================================================

 CHARGEMENT DU RAPPORT

======================================================== */



useEffect(() => {

  let cancelled = false;

  async function loadReport() {
      try {
          let bootstrapTemplate = false;

          try {
              bootstrapTemplate =
                  sessionStorage.getItem(
                      "macevo_template_needs_initialization"
                  ) === "true";
          } catch (_) {}

          isLoadingReport.current = true;
          isInitializingEditor.current = true;
          initialContentLoaded.current = false;

          saveState.setIsSaving(false);
          saveState.setIsSaved(true);

          /* ====================================================
             NOUVEAU DOCUMENT DEPUIS UN TEMPLATE
          ==================================================== */

          if (
              bootstrapTemplate &&
              selectedTemplate &&
              !reportId
          ) {
              const documentModel =
                  buildTemplateDocument(
                      selectedTemplate
                  );

              if (documentModel) {
                  macevoDocumentRef.current =
                      documentModel;

                  const html =
                      renderMacevoDocumentModel(
                          documentModel,
                          selectedTemplate
                      );

                  const title =
                      documentModel.metadata?.title ||
                      "";

                  const author =
                      documentModel.metadata?.author ||
                      "";

                  const type =
                      documentModel.metadata?.type ||
                      "Document académique";

                  documentState.setDocumentTitle(title);
                  documentState.setDocumentAuthor(author);
                  documentState.setDocumentType(type);
                  documentState.setContent(html);

                  const statistics =
                      calculateStatistics(html);

                  statisticsState?.setWordsCount?.(
                      statistics.words
                  );

                  statisticsState?.setCharactersCount?.(
                      statistics.characters
                  );

                  if (reportId) {
                      try {
                          await api.patch(
                              `reports/${reportId}/`,
                              {
                                  content: html,
                                  macevo_document:
                                      serializeMacevoDocument(
                                          documentModel
                                      ),
                              }
                          );
                      } catch (saveError) {
                          console.warn(
                              "MACEVO : impossible de sauvegarder le document initial :",
                              saveError?.response?.data ||
                                  saveError
                          );
                      }
                  }

                  try {
                      sessionStorage.removeItem(
                          "macevo_template_needs_initialization"
                      );
                  } catch (_) {}

                  initialContentLoaded.current =
                      Boolean(html);

                  return;
              }
          }

          /* ====================================================
             SANS REPORT ID : création locale depuis le template
          ==================================================== */

          if (!reportId) {
              console.warn(
                  "EditorContext v15 : aucun reportId. Initialisation depuis le modèle canonique."
              );

              const documentModel =
                  buildTemplateDocument(
                      selectedTemplate
                  );

              if (!cancelled && documentModel) {
                  macevoDocumentRef.current =
                      documentModel;

                  const html =
                      renderMacevoDocumentModel(
                          documentModel,
                          selectedTemplate
                      );

                  documentState.setDocumentTitle(
                      documentModel.metadata?.title || ""
                  );

                  documentState.setDocumentAuthor(
                      documentModel.metadata?.author || ""
                  );

                  documentState.setDocumentType(
                      documentModel.metadata?.type ||
                      "Document académique"
                  );

                  documentState.setContent(html);

                  const statistics =
                      calculateStatistics(html);

                  statisticsState?.setWordsCount?.(
                      statistics.words
                  );

                  statisticsState?.setCharactersCount?.(
                      statistics.characters
                  );

                  initialContentLoaded.current =
                      Boolean(html);
              }

              return;
          }

          /* ====================================================
             CHARGEMENT D'UN RAPPORT EXISTANT
          ==================================================== */

          const response = await api.get(
              `reports/${reportId}/`
          );

          if (cancelled) {
              return;
          }

          const report =
              response.data || {};

          const canonicalDocument =
              parseCanonicalDocumentCandidate(report.macevo_document);
          const reportTemplateId =
              report.template_key ||
              canonicalDocument?.template?.id ||
              report.template_details?.slug;
          const reportTemplate =
              canonicalDocument?.template?.snapshot ||
              (reportTemplateId ? getReportTemplate(reportTemplateId) : null);
          const activeTemplate = reportTemplate || selectedTemplate;

          if (reportTemplate) {
              setLoadedTemplate((previous) =>
                  previous?.id === reportTemplate.id
                      ? previous
                      : reportTemplate
              );
          }

          documentState.setCurrentDocument(
              report
          );

          documentState.setDocumentTitle(
              report.title || ""
          );

          documentState.setDocumentAuthor(
              report.author || ""
          );

          documentState.setDocumentType(
              report.report_type ||
              report.type ||
              activeTemplate?.type ||
              "Article"
          );

          documentState.setCreatedAt(
              report.created_at || null
          );

          documentState.setUpdatedAt(
              report.updated_at || null
          );

          /*
           * PRIORITÉ ABSOLUE : modèle MACEVO persistant.
           *
           * Le modèle devient la source de vérité.
           * Le HTML n'est plus utilisé pour reconstruire la structure.
           */
          let documentModel =
              getReportDocumentModel(
                  report,
                  activeTemplate
              );

          /*
           * Compatibilité : ancien rapport possédant seulement du HTML.
           */
          let htmlContent = "";

          if (documentModel) {
              macevoDocumentRef.current =
                  documentModel;

              const previousStoredHtml =
                  typeof documentModel?.editor?.html === "string"
                      ? documentModel.editor.html.trim()
                      : "";

              htmlContent = getDocumentHtml(
                  documentModel,
                  activeTemplate
              );

              /*
               * Migration d'un ancien cache Markdown/plain-text vers le
               * rendu HTML canonique. La structure des chapitres reste
               * intacte dans MACEVO Document.
               */
              const legacyEditorCache =
                  previousStoredHtml &&
                  isLegacyStructureText(previousStoredHtml) ||
                  looksLikeLegacyRenderedDocument(previousStoredHtml);

              if (legacyEditorCache) {
                  documentModel.editor = {
                      ...(documentModel.editor || {}),
                      html: htmlContent,
                      content: null,
                      source: "migration",
                      dirty: false,
                  };
                  macevoDocumentRef.current = documentModel;
              }

              /*
               * Migration progressive : si l'ancien rapport ne possédait
               * pas encore le modèle canonique, ou si son cache éditeur
               * contenait encore l'ancien Markdown, on sauvegarde le rendu
               * canonique maintenant.
               */
              if (
                  (!report.macevo_document && !report.modelVersion) ||
                  legacyEditorCache
              ) {
                  try {
                      await api.patch(
                          `reports/${reportId}/`,
                          {
                              content: htmlContent,
                              macevo_document:
                                  serializeMacevoDocument(
                                      documentModel
                                  ),
                          }
                      );
                  } catch (saveError) {
                      console.warn(
                          "MACEVO : migration du rapport vers le modèle canonique impossible :",
                          saveError?.response?.data ||
                              saveError
                      );
                  }
              }
          } else if (
              typeof report.content === "string" &&
              report.content.trim()
          ) {
              /*
               * Dernier niveau de compatibilité : ancien contenu éditorial.
               * Une ancienne structure Markdown/TOC n'est jamais injectée
               * dans TipTap : elle est remplacée par le document canonique.
               */
              if (isLegacyStructureText(report.content) && activeTemplate) {
                  documentModel = buildTemplateDocument(activeTemplate);
                  htmlContent = documentModel
                      ? renderMacevoDocumentModel(
                            documentModel,
                            activeTemplate
                        )
                      : "";
              } else {
                  htmlContent = cleanLatexToHtml(report.content);

                  documentModel = buildDocumentModel(
                      {
                          ...report,
                          content: htmlContent,
                      },
                      []
                  );

                  if (documentModel) {
                      documentModel.editor = {
                          ...(documentModel.editor || {}),
                          content: null,
                          html: htmlContent,
                          dirty: false,
                          initializedFromTemplate: false,
                          source: "legacy",
                      };
                  }
              }

              if (documentModel) {
                  macevoDocumentRef.current = documentModel;

                  try {
                      await api.patch(
                          `reports/${reportId}/`,
                          {
                              content: htmlContent,
                              macevo_document:
                                  serializeMacevoDocument(
                                      documentModel
                                  ),
                          }
                      );
                  } catch (saveError) {
                      console.warn(
                          "MACEVO : migration du contenu historique impossible :",
                          saveError?.response?.data || saveError
                      );
                  }
              }
          } else if (activeTemplate) {
              /*
               * Aucun contenu : on crée une instance propre du template.
               */
              documentModel =
                  buildTemplateDocument(
                      activeTemplate
                  );

              if (documentModel) {
                  macevoDocumentRef.current =
                      documentModel;

                  htmlContent =
                      renderMacevoDocumentModel(
                          documentModel,
                          activeTemplate
                      );

                  try {
                      await api.patch(
                          `reports/${reportId}/`,
                          {
                              content: htmlContent,
                              macevo_document:
                                  serializeMacevoDocument(
                                      documentModel
                                  ),
                          }
                      );
                  } catch (saveError) {
                      console.warn(
                          "MACEVO : sauvegarde du nouveau document impossible :",
                          saveError?.response?.data ||
                              saveError
                      );
                  }
              }
          }

          if (!cancelled) {
              documentState.setContent(
                  htmlContent || ""
              );

              const statistics =
                  calculateStatistics(
                      htmlContent || ""
                  );

              statisticsState?.setWordsCount?.(
                  statistics.words
              );

              statisticsState?.setCharactersCount?.(
                  statistics.characters
              );

              initialContentLoaded.current =
                  Boolean(htmlContent);
          }

      } catch (error) {
          console.error(
              "Erreur lors du chargement du rapport :",
              error?.response?.data || error
          );

          if (!cancelled && activeTemplate) {
              const fallbackModel =
                  buildTemplateDocument(
                      activeTemplate
                  );

              if (fallbackModel) {
                  macevoDocumentRef.current =
                      fallbackModel;

                  const fallbackHtml =
                      renderMacevoDocumentModel(
                          fallbackModel,
                          activeTemplate
                      );

                  documentState.setContent(
                      fallbackHtml
                  );

                  const statistics =
                      calculateStatistics(
                          fallbackHtml
                      );

                  statisticsState?.setWordsCount?.(
                      statistics.words
                  );

                  statisticsState?.setCharactersCount?.(
                      statistics.characters
                  );

                  initialContentLoaded.current =
                      true;
              }
          }
      } finally {
          if (!cancelled) {
              isLoadingReport.current = false;
              isInitializingEditor.current = false;
          }
      }
  }

  loadReport();

  return () => {
      cancelled = true;
  };

}, [reportId, selectedTemplate]);

 /* ========================================================

  ÉDITEUR TIPTAP

 ======================================================== */



 const editor =

   useEditor({

        extensions: [

MacevoVisualContainer,

StarterKit.configure({
    link: false,
    underline: false,
}),

Underline,

Superscript,

Subscript,

TextStyle,

FontFamily,
FontSize,

Color,

Highlight,

LineHeight,



Link.configure({

 openOnClick: false,

 autolink: true,

}),



TextAlign.configure({

 types: ["heading", "paragraph"],

}),



Image,



Table.configure({

 resizable: true,

}),



TableRow,

TableHeader,

TableCell,



...(PAGINATION_ENABLED

 ?[

      PaginationPlus.configure({

           pageWidth:
 PAGE_SIZES?.A4?.width ||

 794,



pageHeight:

 PAGE_SIZES?.A4?.height ||

 1123,



pageGap: 28,



pageHeaderHeight: 28,



pageFooterHeight: 28,



pageGapBorderSize: 1,



pageGapBorderColor:

 "#d1d5db",



pageBreakBackground:

 "#e5e7eb",



marginTop:

 templateDesign.page.margins.top,



marginBottom:

 templateDesign.page.margins.bottom,



marginLeft:
                templateDesign.page.margins.left,



            marginRight:

                templateDesign.page.margins.right,



            contentMarginTop: 0,



            contentMarginBottom: 0,



            footerLeft:

                "",



            footerRight:

                "",



            headerLeft:

                "",



            headerRight:

                "",

          }),

 ]

: []),

ScientificShapeExtension,

MathNode,

     ],
content: "",



autofocus: false,



editable: true,



injectCSS: true,


onCreate: ({ editor: ed }) => {
  const initialContent =
    typeof documentState.content === "string"
      ? documentState.content.trim()
      : "";

  if (initialContent && ed.getHTML() !== initialContent) {
    ed.commands.setContent(initialContent, false);
  }
},




/* ====================================================

 MODIFICATION

==================================================== */



onUpdate: ({

  editor: ed,

}) => {

  if (

       isLoadingReport.current ||

       isInitializingEditor.current

  ){

       return;

  }



  const html =

       ed.getHTML();



  const text =

       ed.getText();
/* STATISTIQUES */



const words =

     text.trim()

          ? text

            .trim()

            .split(/\s+/)

            .length

          : 0;



const characters =

     text.length;




if (

     statisticsState?.setWordsCount

){

     statisticsState.setWordsCount(

          words

     );

}



if (

     statisticsState?.setCharactersCount

){

     statisticsState.setCharactersCount(

          characters
     );

}




/* ====================================================
   DOCUMENT MODEL CANONIQUE
==================================================== */

const currentModel =
  macevoDocumentRef.current;

if (currentModel) {
  macevoDocumentRef.current = {
    ...currentModel,

    editor: {
      ...(currentModel.editor || {}),
      content:
        typeof ed.getJSON === "function"
          ? ed.getJSON()
          : null,
      html,
      dirty: true,
      source: "user",
      initializedFromTemplate: false,
    },

    metadata: {
      ...(currentModel.metadata || {}),
      title:
        currentModel.metadata?.title ||
        documentState.documentTitle ||
        "",
      author:
        currentModel.metadata?.author ||
        documentState.documentAuthor ||
        "",
      updatedAt:
        new Date().toISOString(),
    },
  };
}

documentState.setContent(
  html
);

/* SAUVEGARDE */

saveState.setIsSaved(false);

/*
 * Chaque modification reçoit un numéro de génération.
 * Si une sauvegarde plus ancienne termine après une modification
 * plus récente, elle ne pourra pas écraser la version courante.
 */
const saveGeneration =
  ++saveGenerationRef.current;

if (saveTimeoutRef.current) {
  clearTimeout(
    saveTimeoutRef.current
  );
}

/* AUTO SAVE */

if (
  saveState.autoSaveEnabled &&
  reportId
) {
  saveTimeoutRef.current = setTimeout(
    () => {
      const queuedHTML = html;
      const queuedGeneration =
        saveGeneration;

      /* Snapshot immuable de la version à sauvegarder. */
      const queuedDocument =
        macevoDocumentRef.current
          ? serializeMacevoDocument(
                macevoDocumentRef.current
            )
          : null;

      saveQueueRef.current =
        saveQueueRef.current
          .catch(() => {})
          .then(async () => {
            if (
              queuedGeneration !==
              saveGenerationRef.current
            ) {
              return;
            }

            saveState.setIsSaving(true);
            saveState.setIsSaved(false);

            try {
              const payload = {
                content: queuedHTML,
              };

              if (queuedDocument) {
                payload.macevo_document =
                  queuedDocument;
              }

              await api.patch(
                `reports/${reportId}/`,
                payload
              );

              if (
                queuedGeneration ===
                saveGenerationRef.current
              ) {
                saveState.setIsSaved(true);
                saveState.setLastSaved(
                  new Date()
                );

                if (
                  macevoDocumentRef.current
                ) {
                  macevoDocumentRef.current = {
                    ...macevoDocumentRef.current,
                    editor: {
                      ...(macevoDocumentRef.current.editor || {}),
                      dirty: false,
                    },
                  };
                }
              }
            } catch (error) {
              console.error(
                "MACEVO : erreur lors de la sauvegarde automatique :",
                error?.response?.data ||
                  error
              );

              if (
                queuedGeneration ===
                saveGenerationRef.current
              ) {
                saveState.setIsSaved(false);
              }
            } finally {
              if (
                queuedGeneration ===
                saveGenerationRef.current
              ) {
                saveState.setIsSaving(false);
              }
            }
          });
    },
    1500
  );
}

},

});
const updatePageSettings = useCallback(async (pageSettings = {}) => {
  const currentModel = macevoDocumentRef.current;
  if (!currentModel) return;

  const currentPage = currentModel.design?.page || {};
  const currentSettings = currentModel.settings || {};
  const nextModel = {
    ...currentModel,
    design: {
      ...(currentModel.design || {}),
      page: {
        ...currentPage,
        size: pageSettings.pageSize || currentPage.size || "A4",
        orientation: pageSettings.orientation || currentPage.orientation || "portrait",
        margins: pageSettings.margins || currentPage.margins || { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
        background: pageSettings.background ?? currentPage.background ?? "#FFFFFF",
        borders: pageSettings.borders ?? currentPage.borders ?? "none",
        watermark: Object.prototype.hasOwnProperty.call(pageSettings, "watermark") ? pageSettings.watermark : (currentPage.watermark ?? null),
        headerFooter: pageSettings.headerFooter ?? currentPage.headerFooter ?? {},
      },
      layout: {
        ...(currentModel.design?.layout || {}),
        columns: Number(pageSettings.columns) || 1,
        lineNumbers: pageSettings.lineNumbers ?? currentModel.design?.layout?.lineNumbers ?? "disable",
      },
    },
    settings: {
      ...currentSettings,
      pageSize: pageSettings.pageSize || currentPage.size || "A4",
      orientation: pageSettings.orientation || currentPage.orientation || "portrait",
      margins: pageSettings.margins || currentPage.margins || { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
      columns: Number(pageSettings.columns) || 1,
      background: pageSettings.background ?? currentPage.background ?? "#FFFFFF",
      borders: pageSettings.borders ?? currentPage.borders ?? "none",
      watermark: Object.prototype.hasOwnProperty.call(pageSettings, "watermark") ? pageSettings.watermark : (currentPage.watermark ?? null),
      headerFooter: pageSettings.headerFooter ?? currentPage.headerFooter ?? {},
      lineNumbers: pageSettings.lineNumbers ?? currentModel.design?.layout?.lineNumbers ?? "disable",
    },
    editor: {
      ...(currentModel.editor || {}),
      html: editor?.getHTML?.() || currentModel.editor?.html || "",
    },
  };

  macevoDocumentRef.current = nextModel;
  if (!reportId || isLoadingReport.current) return;

  saveState.setIsSaving(true);
  saveState.setIsSaved(false);
  const saveOperation = saveQueueRef.current
    .catch(() => {})
    .then(async () => {
      await api.patch(`reports/${reportId}/`, {
        content: nextModel.editor.html,
        macevo_document: serializeMacevoDocument(nextModel),
      });
    });
  saveQueueRef.current = saveOperation;

  try {
    await saveOperation;
    saveState.setIsSaved(true);
    saveState.setLastSaved(new Date());
  } catch (error) {
    saveState.setIsSaved(false);
    throw error;
  } finally {
    saveState.setIsSaving(false);
  }
}, [editor, reportId, saveState.setIsSaving, saveState.setIsSaved, saveState.setLastSaved]);

/* ========================================================

 INJECTION DU CONTENU

======================================================== */

useEffect(() => {

  if (!editor) {
    return;
  }

  const content =
    typeof documentState.content === "string"
      ? documentState.content.trim()
      : "";

  if (!content) {
    return;
  }

  const currentHTML = editor.getHTML();

  if (currentHTML !== content) {
    isInitializingEditor.current = true;

    // Tiptap doit recevoir le rendu HTML comme HTML, jamais comme texte.
    // Les documents générés par MACEVO utilisent uniquement des balises
    // HTML standards reconnues par StarterKit et les extensions actives.
    editor.commands.setContent(content, false);

    isInitializingEditor.current = false;
  }

  initialContentLoaded.current = true;

}, [editor, documentState.content]);


/* ========================================================

  STYLE DU TEMPLATE

======================================================== */



useEffect(() => {

   if (

        !editor ||

        !selectedTemplate ||

        !initialContentLoaded.current

   ){

        return;

   }



   const design =

        templateDesign;



   const colors =

        design.colors;
const typography =

 design.typography;



const layout =

 design.layout;



const spacing =

 design.spacing;




const primary =

 colors.primary;



const secondary =

 colors.secondary;



const accent =

 colors.accent;



const textColor =

 colors.text;



const muted =

 colors.muted;



const surface =

 colors.surface;
const border =

  colors.border;



const bodyFont =

  typography.bodyFont;



const headingFont =

  typography.headingFont;



const bodySize =

  typography.bodySize;



const lineHeight =

  typography.lineHeight;



const headingWeight =

  typography.headingWeight;



const letterSpacing =

  typography.letterSpacing;




const root =

  editor.view.dom;




/* -----------------------------------------------------
     VARIABLES CSS

----------------------------------------------------- */



root.style.setProperty(

     "--macevo-primary",

     primary

);



root.style.setProperty(

     "--macevo-secondary",

     secondary

);



root.style.setProperty(

     "--macevo-accent",

     accent

);



root.style.setProperty(

     "--macevo-text",

     textColor

);



root.style.setProperty(

     "--macevo-muted",

     muted

);
root.style.setProperty(

     "--macevo-surface",

     surface

);



root.style.setProperty(

     "--macevo-border",

     border

);



root.style.setProperty(

     "--macevo-body-font",

     bodyFont

);



root.style.setProperty(

     "--macevo-heading-font",

     headingFont

);



root.style.setProperty(

     "--macevo-body-size",

     bodySize

);



root.style.setProperty(

     "--macevo-line-height",

     lineHeight
);



root.style.setProperty(

     "--macevo-heading-weight",

     headingWeight

);



root.style.setProperty(

     "--macevo-letter-spacing",

     letterSpacing

);




root.style.fontFamily =

     bodyFont;



root.style.fontSize =

     bodySize;



root.style.lineHeight =

     lineHeight;



root.style.color =

     textColor;




root.dataset.macevoTemplate =

     selectedTemplate.id ||
    templateId ||

    "default";




root.dataset.macevoLayout =

    layout.style;



root.dataset.macevoSectionStyle =

    layout.sectionStyle;




/* -----------------------------------------------------

    STYLE GLOBAL

----------------------------------------------------- */



const styleId =

    "macevo-template-style";



const oldStyle =

    document.getElementById(

         styleId

    );



if (oldStyle) {

    oldStyle.remove();

}
const style =

  document.createElement(

       "style"

  );



style.id =

  styleId;




const templateSelector =

  `[data-macevo-template="${

       selectedTemplate.id ||

       templateId ||

       "default"

  }"]`;




style.textContent = `



  ${templateSelector} {

       font-family: ${bodyFont};

       font-size: ${bodySize};

       line-height: ${lineHeight};

       color: ${textColor};

       letter-spacing: ${letterSpacing};

       --macevo-primary: ${primary};
       --macevo-secondary: ${secondary};
       --macevo-accent: ${accent};
       --macevo-border: ${border};
       --macevo-page-border: ${templateDesign.border.css};

  }

  ${templateSelector} .macevo-cover,
  ${templateSelector} .macevo-preliminary,
  ${templateSelector} .macevo-academic-section {
       box-sizing: border-box;
  }

  /* =================================================
     RENDU STRUCTURÉ BACKEND
  ================================================= */
  ${templateSelector} .macevo-document-flow {
       width: 100%;
       box-sizing: border-box;
  }

  ${templateSelector} .macevo-document-page {
       box-sizing: border-box;
       width: 100%;
       min-height: 990px;
       padding: 58px 64px 62px;
       background: #ffffff;
       border: ${templateDesign.border.css};
       position: relative;
       break-after: page;
       page-break-after: always;
  }

  ${templateSelector} .macevo-cover-page {
       min-height: 1000px;
       padding: 0;
       display: flex;
       align-items: stretch;
       justify-content: stretch;
  }

  ${templateSelector} .macevo-cover-page .macevo-cover {
       width: 100%;
       min-height: 100%;
       box-sizing: border-box;
       border: 0;
  }

  ${templateSelector} .macevo-preliminary-page,
  ${templateSelector} .macevo-toc-page,
  ${templateSelector} .macevo-back-matter-page {
       min-height: 1000px;
  }

  ${templateSelector} .macevo-academic-flow {
       width: 100%;
       box-sizing: border-box;
       margin: 0;
       padding: 0;
       break-inside: auto;
       page-break-inside: auto;
  }

  ${templateSelector} .macevo-chapter-header {
       margin: 0 0 28px;
       padding: 0 0 18px;
       border-bottom: 1px solid ${border};
       break-after: avoid;
       page-break-after: avoid;
  }

  ${templateSelector} .macevo-chapter-number {
       color: ${primary};
       font-size: 30px;
       font-weight: 800;
       line-height: 1;
  }

  ${templateSelector} .macevo-chapter-label {
       margin-top: 7px;
       color: ${accent};
       font-size: 8px;
       font-weight: 800;
       letter-spacing: 2px;
       text-transform: uppercase;
  }

  ${templateSelector} .macevo-chapter-header .macevo-document-title {
       margin: 9px 0 0;
       border: 0;
       padding: 0;
  }

  ${templateSelector} .macevo-chapter-content,
  ${templateSelector} .macevo-section-content,
  ${templateSelector} .macevo-preliminary-content {
       width: 100%;
       box-sizing: border-box;
  }

  ${templateSelector} .macevo-subsection {
       margin: 0 0 ${spacing.section};
       break-inside: auto;
       page-break-inside: auto;
  }

  ${templateSelector} .macevo-subsection-title {
       display: flex;
       align-items: baseline;
       gap: 9px;
       color: ${primary};
       margin: 26px 0 12px;
       padding: 0;
       border: 0;
       break-after: avoid;
       page-break-after: avoid;
  }

  ${templateSelector} .macevo-section-number {
       flex: 0 0 auto;
       color: ${accent};
       font-weight: 800;
  }

  ${templateSelector} .macevo-toc-page {
       overflow: hidden;
  }

  ${templateSelector} .macevo-backend-toc {
       width: 100%;
       min-height: 900px;
  }

  ${templateSelector} .macevo-backend-toc-row {
       display: flex;
       align-items: baseline;
       gap: 8px;
       min-height: 27px;
       padding-top: 5px;
       padding-bottom: 5px;
       border-bottom: 1px dotted ${border};
       box-sizing: border-box;
  }

  ${templateSelector} .macevo-backend-toc-row .macevo-toc-number {
       flex: 0 0 auto;
       min-width: 42px;
       color: ${accent};
       font-weight: 800;
       font-size: 9px;
  }

  ${templateSelector} .macevo-backend-toc-row .macevo-toc-title {
       font-size: 10px;
       color: ${textColor};
  }

  ${templateSelector} .macevo-backend-toc-row .macevo-toc-dots {
       flex: 1;
       border-bottom: 1px dotted ${border};
  }

  ${templateSelector} .macevo-backend-cover-context {
       margin-top: 12px;
       color: ${muted};
       font-size: 9px;
  }

  ${templateSelector} .macevo-table-block,
  ${templateSelector} .macevo-figure-block,
  ${templateSelector} .macevo-schema-block {
       break-inside: avoid;
       page-break-inside: avoid;
  }

  ${templateSelector} .macevo-equation-block {
       margin: 18px auto;
       padding: 14px 18px;
       text-align: center;
       border-left: 4px solid ${accent};
       background: ${surface};
       break-inside: avoid;
       page-break-inside: avoid;
  }

  ${templateSelector} .macevo-equation-expression {
       font-family: Georgia, "Times New Roman", serif;
       font-size: 17px;
       line-height: 1.5;
  }

  ${templateSelector} .macevo-cover {
       width: 100%;
       min-height: 1000px;
       box-sizing: border-box;
       border: ${templateDesign.border.css};
       background: #ffffff;
       position: relative;
  }

  ${templateSelector} .macevo-backend-cover {
       min-height: 1000px;
       break-after: page;
       page-break-after: always;
  }

  ${templateSelector} .macevo-toc {
       min-height: 900px;
       break-after: page;
       page-break-after: always;
  }

  ${templateSelector} .macevo-academic-flow {
       break-before: page;
       page-break-before: always;
  }
/* =================================================

    PARAGRAPHES

================================================= */



${templateSelector} p {

    margin-top: 0;

    margin-bottom: ${spacing.paragraph};

    color: ${textColor};

    line-height: ${lineHeight};

    text-align: justify;

    font-family: ${bodyFont};

    font-size: ${bodySize};

}




/* =================================================

    H1

================================================= */



${templateSelector} h1 {

    color: ${primary};

    font-family: ${headingFont};

    font-weight: ${headingWeight};

    margin-top: 30px;

    margin-bottom: ${spacing.heading};

    line-height: 1.2;

    letter-spacing: -0.01em;

    break-after: avoid;
    page-break-after: avoid;

}




/* =================================================

    H2

================================================= */



${templateSelector} h2 {

    color: ${primary};

    font-family: ${headingFont};

    font-weight: ${headingWeight};

    margin-top: 24px;

    margin-bottom: 11px;

    line-height: 1.3;

    break-after: avoid;

    page-break-after: avoid;

}




/* =================================================

    H3

================================================= */



${templateSelector} h3 {

    color: ${secondary};

    font-family: ${headingFont};

    font-weight: 600;
    margin-top: 18px;

    margin-bottom: 8px;

    line-height: 1.3;

    break-after: avoid;

    page-break-after: avoid;

}




/* =================================================

    LISTES

================================================= */



${templateSelector} ul,

${templateSelector} ol {

    margin-top: 10px;

    margin-bottom: 16px;

    padding-left: 26px;

}




${templateSelector} li {

    margin-bottom: 6px;

    line-height: ${lineHeight};

}




/* =================================================

    LIENS
================================================= */



${templateSelector} a {

    color: ${primary};

    text-decoration: underline;

    text-decoration-thickness: 1px;

    text-underline-offset: 2px;

}




/* =================================================

    CITATIONS

================================================= */



${templateSelector} blockquote {

    border-left: 4px solid ${accent};

    margin: 20px 0;

    padding: 12px 18px;

    background: ${surface};

    color: ${muted};

    font-style: italic;

}




/* =================================================

    TABLEAUX

================================================= */
${templateSelector} table {

    width: 100%;

    border-collapse: collapse;

    margin-top: 18px;

    margin-bottom: 22px;

    font-size: 10.5pt;

    table-layout: fixed;

}




${templateSelector} th {

    background: ${primary};

    color: #ffffff;

    font-family: ${headingFont};

    font-weight: 700;

    padding: 9px 10px;

    border: 1px solid ${primary};

    text-align: left;

}




${templateSelector} td {

    border: 1px solid ${border};

    padding: 8px 10px;

    vertical-align: top;

}
${templateSelector} tr:nth-child(even) td {

    background: ${surface};

}




/* =================================================

    COUVERTURE

================================================= */



${templateSelector} .macevo-cover {

    box-sizing: border-box;

    width: 100%;

    min-height: 990px;

    position: relative;

    overflow: hidden;

    page-break-after: always;

    break-after: page;

    font-family: ${bodyFont};

}




${templateSelector} .macevo-page-break-spacer {

    height: 1px;

    page-break-after: always;

    break-after: page;

}
/* =================================================

    COUVERTURE ACADÉMIQUE

================================================= */



${templateSelector} .macevo-cover-academic {

    padding: 60px 55px;

    background: #ffffff;

}




${templateSelector} .macevo-cover-top-line {

    position: absolute;

    top: 0;

    left: 0;

    right: 0;

    height: 7px;

    background: ${primary};

}




${templateSelector} .macevo-cover-badge {

    display: inline-flex;

    align-items: center;

    justify-content: center;

    padding: 7px 13px;

    border: 1px solid ${border};

    color: ${secondary};

    border-radius: 999px;
    font-size: 9px;

    font-weight: 700;

    letter-spacing: 1.8px;

    text-transform: uppercase;

    margin-bottom: 30px;

}




${templateSelector} .macevo-cover-brand {

    display: flex;

    align-items: center;

    gap: 12px;

    margin-bottom: 70px;

}




${templateSelector} .macevo-cover-logo,
${templateSelector} .macevo-cover-logo-image-wrap {

    width: 64px;

    height: 64px;

    border-radius: 12px;

    display: flex;

    align-items: center;

    justify-content: center;

    background: ${primary};

    color: #ffffff;

    font-weight: 800;

    font-size: 22px;

}
${templateSelector} .macevo-cover-logo-image-wrap {
    background: #ffffff;
    border: 1px solid ${border};
    overflow: hidden;
}

${templateSelector} .macevo-cover-logo-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    background: #ffffff;
}

${templateSelector} .macevo-cover-brand-name {

    font-size: 18px;

    font-weight: 800;

    letter-spacing: 2px;

    color: ${primary};

}




${templateSelector} .macevo-cover-brand-subtitle {

    margin-top: 2px;

    font-size: 9px;

    color: ${muted};

    letter-spacing: 0.8px;

}




${templateSelector} .macevo-cover-institution {

    color: ${textColor};

    font-size: 13px;

    font-weight: 700;

    margin-bottom: 5px;

}




${templateSelector} .macevo-cover-department {

    color: ${muted};
    font-size: 11px;

}




${templateSelector} .macevo-cover-accent-line {

    width: 65px;

    height: 4px;

    background: ${accent};

    margin-top: 38px;

    margin-bottom: 35px;

}




${templateSelector} .macevo-cover-title {

    color: ${primary};

    font-family: ${headingFont};

    font-size: 31px;

    line-height: 1.2;

    max-width: 650px;

    margin: 0;

}




${templateSelector} .macevo-cover-meta {

    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 35px;

    margin-top: 90px;
}




${templateSelector} .macevo-cover-meta-block {

    display: flex;

    flex-direction: column;

    gap: 7px;

}




${templateSelector} .macevo-cover-meta-block span {

    color: ${muted};

    font-size: 9px;

    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 1.2px;

}




${templateSelector} .macevo-cover-meta-block strong {

    color: ${textColor};

    font-size: 13px;

}




${templateSelector} .macevo-cover-year {

    position: absolute;

    left: 55px;
    bottom: 45px;

    color: ${muted};

    font-size: 10px;

    font-weight: 700;

    letter-spacing: 1px;

}




${templateSelector} .macevo-cover-bottom-band {

    position: absolute;

    bottom: 0;

    right: 0;

    width: 42%;

    height: 7px;

    background: ${primary};

}




/* =================================================

    COUVERTURE MODERNE

================================================= */



${templateSelector} .macevo-cover-modern {

    display: grid;

    grid-template-columns: 26% 74%;

    min-height: 990px;

    background: #ffffff;

}
${templateSelector} .macevo-modern-sidebar {

    background:

      linear-gradient(

           180deg,

           ${primary},

           ${secondary}

      );

}




${templateSelector} .macevo-modern-content {

    padding: 75px 55px;

    position: relative;

}




${templateSelector} .macevo-modern-badge {

    color: ${primary};

    font-size: 9px;

    font-weight: 800;

    letter-spacing: 1.8px;

    margin-bottom: 25px;

}




${templateSelector} .macevo-modern-brand {
    color: ${primary};

    font-size: 18px;

    font-weight: 900;

    letter-spacing: 2px;

    margin-bottom: 65px;

}




${templateSelector} .macevo-modern-institution {

    color: ${muted};

    font-size: 11px;

    font-weight: 700;

    text-transform: uppercase;

    letter-spacing: 1px;

}




${templateSelector} .macevo-modern-title {

    color: ${textColor};

    font-size: 32px;

    line-height: 1.15;

    margin-top: 18px;

    margin-bottom: 25px;

}




${templateSelector} .macevo-modern-divider {

    width: 80px;
    height: 5px;

    background: ${accent};

    margin-bottom: 55px;

}




${templateSelector} .macevo-modern-details {

    display: grid;

    gap: 25px;

}




${templateSelector} .macevo-modern-details div {

    display: flex;

    flex-direction: column;

    gap: 6px;

    padding-bottom: 15px;

    border-bottom: 1px solid ${border};

}




${templateSelector} .macevo-modern-details span {

    color: ${muted};

    font-size: 8px;

    font-weight: 800;

    letter-spacing: 1.2px;

    text-transform: uppercase;

}
${templateSelector} .macevo-modern-details strong {

    color: ${textColor};

    font-size: 12px;

}




${templateSelector} .macevo-modern-year {

    position: absolute;

    bottom: 45px;

    right: 55px;

    color: ${muted};

    font-size: 10px;

    font-weight: 700;

}




/* =================================================

    COUVERTURE SCIENTIFIQUE

================================================= */



${templateSelector} .macevo-cover-scientific {

    padding: 55px;

    background: ${surface};

    border-top: 8px solid ${primary};

}
${templateSelector} .macevo-scientific-header {

    display: flex;

    align-items: center;

    gap: 12px;

    margin-bottom: 70px;

}




${templateSelector} .macevo-scientific-mark {

    width: 44px;

    height: 44px;

    display: flex;

    align-items: center;

    justify-content: center;

    background: ${primary};

    color: #ffffff;

    border-radius: 8px;

    font-weight: 800;

    font-size: 22px;

}




${templateSelector} .macevo-scientific-header strong {

    display: block;

    color: ${primary};

    font-size: 16px;

    letter-spacing: 1.5px;
}




${templateSelector} .macevo-scientific-header span {

    display: block;

    color: ${muted};

    font-size: 8px;

    margin-top: 3px;

}




${templateSelector} .macevo-scientific-badge {

    display: inline-block;

    background: ${primary};

    color: #ffffff;

    padding: 7px 12px;

    font-size: 8px;

    font-weight: 800;

    letter-spacing: 1.4px;

    margin-bottom: 25px;

}




${templateSelector} .macevo-scientific-institution {

    color: ${textColor};

    font-size: 13px;

    font-weight: 700;

}
${templateSelector} .macevo-scientific-department {

    color: ${muted};

    font-size: 10px;

    margin-top: 4px;

}




${templateSelector} .macevo-scientific-rule {

    width: 100%;

    height: 1px;

    background: ${border};

    margin: 30px 0;

}




${templateSelector} .macevo-cover-scientific h1 {

    color: ${textColor};

    font-size: 30px;

    max-width: 640px;

    margin: 0;

}




${templateSelector} .macevo-scientific-info {

    display: grid;

    grid-template-columns: 1fr 1fr;
    gap: 35px;

    margin-top: 90px;

}




${templateSelector} .macevo-scientific-info div {

    background: #ffffff;

    border: 1px solid ${border};

    padding: 18px;

    border-radius: 8px;

}




${templateSelector} .macevo-scientific-info small {

    display: block;

    color: ${primary};

    font-size: 8px;

    font-weight: 800;

    letter-spacing: 1px;

    margin-bottom: 8px;

}




${templateSelector} .macevo-scientific-info strong {

    color: ${textColor};

    font-size: 12px;

}
${templateSelector} .macevo-scientific-year {

    position: absolute;

    bottom: 45px;

    color: ${muted};

    font-size: 10px;

}




/* =================================================

    COUVERTURE ARTICLE

================================================= */



${templateSelector} .macevo-cover-article {

    display: flex;

    flex-direction: column;

    justify-content: center;

    padding: 80px;

    background: #ffffff;

}




${templateSelector} .macevo-article-brand {

    color: ${primary};

    font-size: 17px;

    font-weight: 900;

    letter-spacing: 2px;

    margin-bottom: 35px;
}




${templateSelector} .macevo-article-type {

    color: ${muted};

    font-size: 9px;

    font-weight: 800;

    letter-spacing: 1.5px;

    text-transform: uppercase;

    margin-bottom: 22px;

}




${templateSelector} .macevo-cover-article h1 {

    color: ${textColor};

    font-size: 31px;

    line-height: 1.18;

    margin: 0 0 35px;

    max-width: 630px;

}




${templateSelector} .macevo-article-authors {

    color: ${primary};

    font-size: 13px;

    font-weight: 700;

}
${templateSelector} .macevo-article-institution {

    color: ${muted};

    font-size: 10px;

    margin-top: 7px;

}




${templateSelector} .macevo-article-year {

    margin-top: 80px;

    color: ${muted};

    font-size: 10px;

}




/* =================================================

    COUVERTURE SIDEBAR

================================================= */



${templateSelector} .macevo-cover-sidebar {

    display: grid;

    grid-template-columns: 32% 68%;

    background: #ffffff;

}




${templateSelector} .macevo-sidebar-cover-panel {

    background: ${primary};
    color: #ffffff;

    padding: 45px 30px;

    display: flex;

    flex-direction: column;

}




${templateSelector} .macevo-sidebar-cover-logo {

    width: 50px;

    height: 50px;

    border-radius: 14px;

    background: rgba(255,255,255,0.16);

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 24px;

    font-weight: 900;

}




${templateSelector} .macevo-sidebar-cover-brand {

    margin-top: 18px;

    font-size: 17px;

    font-weight: 900;

    letter-spacing: 2px;

}
${templateSelector} .macevo-sidebar-cover-type {

    margin-top: auto;

    font-size: 9px;

    line-height: 1.5;

    font-weight: 700;

    letter-spacing: 1.2px;

    text-transform: uppercase;

}




${templateSelector} .macevo-sidebar-cover-year {

    margin-top: 30px;

    font-size: 10px;

    opacity: 0.75;

}




${templateSelector} .macevo-sidebar-cover-main {

    padding: 85px 50px;

}




${templateSelector} .macevo-sidebar-cover-institution {

    color: ${primary};

    font-size: 11px;

    font-weight: 800;

    text-transform: uppercase;

    letter-spacing: 1px;
}




${templateSelector} .macevo-sidebar-cover-department {

    color: ${muted};

    font-size: 10px;

    margin-top: 7px;

}




${templateSelector} .macevo-sidebar-cover-main h1 {

    color: ${textColor};

    font-size: 30px;

    line-height: 1.15;

    margin: 80px 0 25px;

}




${templateSelector} .macevo-sidebar-cover-line {

    width: 60px;

    height: 5px;

    background: ${accent};

    margin-bottom: 70px;

}




${templateSelector} .macevo-sidebar-cover-author {

    display: flex;
    flex-direction: column;

    gap: 5px;

    margin-bottom: 25px;

}




${templateSelector} .macevo-sidebar-cover-author span {

    color: ${muted};

    font-size: 8px;

    text-transform: uppercase;

    letter-spacing: 1px;

    font-weight: 800;

}




${templateSelector} .macevo-sidebar-cover-author strong {

    color: ${textColor};

    font-size: 12px;

}




/* =================================================

    SECTIONS

================================================= */



${templateSelector} .macevo-academic-section {

    text-align: justify;

    position: relative;
}




${templateSelector} .macevo-section-kicker {

    color: ${accent};

    font-family: ${headingFont};

    font-size: 8px;

    font-weight: 800;

    letter-spacing: 2px;

    text-transform: uppercase;

    margin-bottom: 8px;

}




${templateSelector} .macevo-academic-section > h1 {

    border-bottom: 1px solid ${border};

    padding-bottom: 13px;

}




/* =================================================

    PRÉLIMINAIRES

================================================= */



${templateSelector} .macevo-preliminary {

    min-height: 500px;

}
${templateSelector} .macevo-preliminary-heading {

    margin-bottom: 30px;

}




${templateSelector} .macevo-preliminary-heading > span {

    color: ${accent};

    font-size: 8px;

    font-weight: 800;

    letter-spacing: 1.7px;

    text-transform: uppercase;

}




${templateSelector} .macevo-preliminary-heading h1 {

    margin-top: 8px;

    margin-bottom: 0;

}




/* =================================================

    CARTES

================================================= */



${templateSelector} .macevo-info-card {

    background: ${surface};

    border: 1px solid ${border};
    border-left: 4px solid ${accent};

    border-radius: 8px;

    padding: 18px 20px;

    margin: 24px 0;

    break-inside: avoid;

    page-break-inside: avoid;

}




${templateSelector} .macevo-info-card h2 {

    margin-top: 0;

    font-size: 14px;

}




${templateSelector} .macevo-info-card p:last-child {

    margin-bottom: 0;

}




${templateSelector} .macevo-reference-card {

    border: 1px solid ${border};

    border-radius: 8px;

    padding: 20px;

    margin: 25px 0;

    background: #ffffff;

    break-inside: avoid;

    page-break-inside: avoid;
}




${templateSelector} .macevo-reference-card h2 {

    margin-top: 0;

    font-size: 14px;

}




/* =================================================
    CONTENU ACADÉMIQUE — TABLEAUX / FIGURES / ÉQUATIONS
================================================= */
${templateSelector} .macevo-demo-table { width:100%; border-collapse:collapse; margin:14px 0 10px; font-size:9px; }
${templateSelector} .macevo-demo-table th { background:${surface}; color:${primary}; font-weight:800; text-align:left; padding:7px 8px; border-bottom:2px solid ${accent}; }
${templateSelector} .macevo-demo-table td { padding:7px 8px; border-bottom:1px solid ${border}; }
${templateSelector} .macevo-demo-table tr:last-child td { border-bottom:1px solid ${border}; }
${templateSelector} .macevo-figure-demo { margin:15px auto 5px; padding:14px; border:1px solid ${border}; border-radius:8px; background:${surface}; max-width:82%; }
${templateSelector} .macevo-figure-caption, ${templateSelector} .macevo-equation-caption { text-align:center; font-size:8.5px; color:${muted}; margin:5px 0 12px; }
${templateSelector} .macevo-bar { height:22px; margin:7px 0; border-radius:4px; background:${primary}; color:#fff; font-size:8px; line-height:22px; padding-left:8px; box-sizing:border-box; }
${templateSelector} .macevo-bar.b1 { width:58%; opacity:.55; }
${templateSelector} .macevo-bar.b2 { width:91%; }
${templateSelector} .macevo-architecture { display:flex; flex-direction:column; align-items:center; gap:6px; font-size:9px; font-weight:700; }
${templateSelector} .macevo-architecture div { width:78%; text-align:center; padding:8px; border:1px solid ${accent}; border-radius:5px; background:#fff; color:${primary}; }
${templateSelector} .macevo-equation-card { margin:13px 0; padding:12px 18px; border-left:4px solid ${accent}; background:${surface}; text-align:center; }
${templateSelector} .macevo-equation { font-family:Georgia,serif; font-size:18px; color:${textColor}; }
${templateSelector} .macevo-dedication { text-align:center; max-width:78%; margin:80px auto 0; font-style:italic; font-size:12px; line-height:1.9; }
${templateSelector} .macevo-reference-list { padding-left:24px; font-size:9.5px; }
${templateSelector} .macevo-reference-list li { margin-bottom:8px; }
${templateSelector} .macevo-annex-card { border:1px solid ${border}; border-left:4px solid ${accent}; padding:10px 12px; margin:10px 0; background:${surface}; }
${templateSelector} .macevo-annex-card strong, ${templateSelector} .macevo-annex-card span { display:block; }
${templateSelector} .macevo-annex-card span { margin-top:4px; font-size:9px; color:${muted}; }
${templateSelector} .macevo-conclusion-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px; }
${templateSelector} .macevo-conclusion-grid > div { border-top:3px solid ${accent}; padding:10px; background:${surface}; }
${templateSelector} .macevo-conclusion-grid strong, ${templateSelector} .macevo-conclusion-grid span { display:block; }
${templateSelector} .macevo-conclusion-grid span { margin-top:5px; font-size:9px; color:${muted}; }
${templateSelector} .macevo-list-entry { display:flex; align-items:center; gap:8px; padding:9px 0; border-bottom:1px solid ${border}; font-size:9.5px; }
${templateSelector} .macevo-list-index { font-weight:800; color:${primary}; min-width:64px; }
${templateSelector} .macevo-list-label { font-weight:500; }
${templateSelector} .macevo-list-dots { flex:1; border-bottom:1px dotted ${border}; }
${templateSelector} .macevo-abbreviations { display:grid; grid-template-columns:80px 1fr; margin-top:18px; font-size:10px; }
${templateSelector} .macevo-abbreviations dt { font-weight:800; color:${primary}; padding:7px 0; }
${templateSelector} .macevo-abbreviations dd { margin:0; padding:7px 0; border-bottom:1px solid ${border}; }

/* =================================================

    TABLE DES MATIÈRES

================================================= */



${templateSelector} .macevo-toc {

    padding-top: 20px;

}




${templateSelector} .macevo-toc-kicker {

    color: ${accent};

    font-size: 8px;

    font-weight: 800;

    letter-spacing: 1.8px;

    text-align: center;

    margin-bottom: 8px;

}
${templateSelector} .macevo-toc h1 {

    text-align: center;

    margin-top: 0;

    border: none;

}




${templateSelector} .macevo-toc-intro {

    text-align: center;

    color: ${muted};

    font-size: 10px;

    margin-bottom: 30px;

}




${templateSelector} .macevo-toc ol {

    list-style: none;

    padding: 0;

    margin: 0;

}




${templateSelector} .macevo-toc li {

    display: flex;

    align-items: center;

    gap: 10px;

    padding: 10px 0;

    border-bottom: 1px dotted ${border};
    margin: 0;

}




${templateSelector} .macevo-toc-number {

    color: ${accent};

    font-weight: 800;

    font-size: 9px;

    min-width: 25px;

}




${templateSelector} .macevo-toc-title {

    color: ${textColor};

    font-weight: 600;

    font-size: 10.5pt;

}




${templateSelector} .macevo-toc-dots {

    flex: 1;

    border-bottom: 1px dotted ${border};

}




${templateSelector} .macevo-toc-page {

    color: ${muted};

    font-size: 9px;
}




${templateSelector} .macevo-toc-note {

    margin-top: 35px;

    padding: 14px 18px;

    background: ${surface};

    border-radius: 6px;

    color: ${muted};

    font-size: 9px;

    font-style: italic;

}




/* =================================================

    ESPACEMENT

================================================= */



${templateSelector} .macevo-section-spacer {

    height: ${spacing.section};

}




/* =================================================

    DESIGN SIDEBAR

================================================= */



${templateSelector}[data-macevo-layout="professional"]
.macevo-academic-section {

    border-left: 3px solid ${accent};

    padding-left: 22px;

}




${templateSelector}[data-macevo-layout="professional"]

.macevo-section-kicker {

    color: ${primary};

}




/* =================================================

    DESIGN COMPACT

================================================= */



${templateSelector}[data-macevo-layout="compact"] p {

    margin-bottom: 7px;

}




${templateSelector}[data-macevo-layout="compact"] h1 {

    margin-top: 20px;

    margin-bottom: 13px;

}




${templateSelector}[data-macevo-layout="compact"] h2 {
    margin-top: 17px;

    margin-bottom: 8px;

}




/* =================================================

    DESIGN PRÉSENTATION

================================================= */



${templateSelector}[data-macevo-layout="presentation"] h1 {

    font-size: 25px;

}




${templateSelector}[data-macevo-layout="presentation"] h2 {

    font-size: 17px;

}




${templateSelector}[data-macevo-layout="presentation"] p {

    font-size: 13pt;

    line-height: 1.55;

}




/* =================================================

    EMPÊCHER LES COUPURES

================================================= */
     ${templateSelector} table,

     ${templateSelector} blockquote,

     ${templateSelector} .macevo-info-card,

     ${templateSelector} .macevo-reference-card {

         break-inside: avoid;

         page-break-inside: avoid;

     }





  /* ============================================================
     MACEVO — RENDU A4 / IDENTITÉ VISUELLE / PRÉLIMINAIRES
  ============================================================ */
  `;
}, [

   editor,

   selectedTemplate,

   templateDesign,

   templateId,

]);




/* ========================================================

  PAGINATION

======================================================== */



useEffect(() => {

   if (!PAGINATION_ENABLED) {

        return;

   }



   if (

        !editor ||

        !selectedTemplate

   ){

        return;

   }



   const margins =

        templateDesign.page.margins;



   try {
editor

 .chain()

 .updatePageSize(

      PAGE_SIZES.A4

 )

 .updateMargins({

      top:

        margins.top ??

        55,



      bottom:

        margins.bottom ??

        55,



      left:

        margins.left ??

        70,



      right:

        margins.right ??

        70,

 })

 .updatePageGap(

      28

 )

 .updatePageBreakBackground(

      "#e5e7eb"

 )
            .run();



   } catch (error) {

       console.warn(

            "MACEVO : configuration pagination non appliquée :",

            error

       );

   }



}, [

   editor,

   selectedTemplate,

   templateDesign,

]);




/* ========================================================

  NETTOYAGE

======================================================== */



useEffect(() => {

   return () => {

       if (

            saveTimeoutRef.current

       ){

            clearTimeout(

                 saveTimeoutRef.current

            );
       }



       const style =

           document.getElementById(

                "macevo-template-style"

           );



       if (style) {

           style.remove();

       }

  };

}, []);




/* ========================================================

  VALUE

======================================================== */



const value =

  useMemo(

       () => ({

           /* ÉDITEUR */

           editor,



           /* STATES */

           ...documentState,



           ...statisticsState,
...selectionState,



...saveState,



...referenceState,



...commentState,



...historyState,



...themeState,



...aiState,



/* RAPPORT */

reportId,



templateId: effectiveTemplateId || selectedTemplate?.id || null,



templateName:

  templateName ||

    selectedTemplate?.name ||
    selectedTemplate?.title ||
    selectedTemplate?.label ||

  null,



selectedTemplate,



templateDesign,

updatePageSettings,



/* MODÈLE DOCUMENT CANONIQUE */


getMacevoDocument: () =>
  macevoDocumentRef.current,



createMacevoDocument,



serializeMacevoDocument,



deserializeMacevoDocument,
    /* TEMPLATES */

    reportTemplates,



    /* UTILITAIRES */

    generateTemplateHtml,



    getSectionContent,

}),



[

    editor,



    documentState,



    statisticsState,



    selectionState,



    saveState,



    referenceState,



    commentState,



    historyState,



    themeState,
                  aiState,



                  reportId,



                  effectiveTemplateId,



                  templateName,



                  navigationTemplate,



                  selectedTemplate,



                  templateDesign,

                  updatePageSettings,

              ]

         );




    return (

         <EditorContext.Provider

              value={value}

         >

              {children}

         </EditorContext.Provider>

    );

}
/* ============================================================

    HOOK

============================================================ */



function useEditorContext() {

    const context =

        useContext(

             EditorContext

        );



    if (!context) {

        throw new Error(

             "useEditorContext doit être utilisé dans EditorProvider."

        );

    }



    return context;

}




/* ============================================================

    EXPORTS

============================================================ */



export {

    EditorContext,

    EditorProvider,

    useEditorContext,
};



export default EditorContext;

