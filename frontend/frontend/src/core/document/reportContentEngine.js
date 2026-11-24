/**
 * MACEVO — Academic Content Engine
 * v1.0.0
 *
 * Génère le contenu initial d'un document à partir du template.
 * Le moteur ne gère ni React, ni TipTap, ni l'API.
 */

import { getMacevoModelSpec } from "../../config/macevoModelSpecs";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const safe = (value, fallback = "") =>
  escapeHtml(value ?? fallback);

const normalizeKey = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const SECTION_ALIASES = [
  ["description-donnees", ["sample-description", "respondents", "profiles", "study-characteristics", "baseline"]],
  ["resultats-principaux", ["descriptive-results", "analytical-results", "hypothesis-results", "main-results", "secondary-results", "selection-results", "synthesis-results", "test-results", "performance", "outcomes"]],
  ["conception-etude", ["research-design", "study-design", "case-design", "design", "method-design"]],
  ["population", ["population", "participants", "eligibility", "recruitment"]],
  ["collecte-donnees", ["data-collection", "collection", "questionnaire", "procedure", "measurements", "extraction"]],
  ["analyse-donnees", ["data-analysis", "analysis", "estimation", "calculations", "synthesis-method"]],
  ["ethique", ["ethical-considerations", "ethics", "consent", "confidentiality"]],
  ["definitions", ["conceptual-definitions", "key-concepts", "concepts", "terms"]],
  ["cadre theorique", ["framework", "theory", "theoretical-framework", "analytical-frame"]],
  ["travaux-anterieurs", ["previous-studies", "prior-research", "evidence", "state-of-art", "related-studies"]],
  ["lacune", ["research-gap", "gap", "positioning", "positioning-study"]],
  ["objectifs-specifiques", ["specific-objectives", "research-objectives", "aims", "objectives"]],
  ["question-principale", ["main-question", "research-question", "question"]],
  ["questions-secondaires", ["secondary-questions"]],
  ["discussion-limites", ["limitations", "limits", "bias", "uncertainty"]],
  ["recommandations", ["recommendations", "academic-recommendations", "professional-recommendations"]],
  ["travaux-realises", ["work", "activities", "deliverables", "implementation", "components"]],
  ["evaluation", ["evaluation", "acceptance", "validation"]],
  ["introduction", [
    "node-introduction",
    "introduction",
    "introduction-generale",
    "general-introduction"
  ]],

  ["contexte", [
    "node-context",
    "context",
    "contexte",
    "study-context"
  ]],

  ["problematique", [
    "node-problem",
    "problem",
    "problematique",
    "research-problem"
  ]],

  ["objectifs", [
    "node-objectives",
    "objectives",
    "objectif",
    "objectifs",
    "research-objectives"
  ]],

  ["questions", [
    "node-questions",
    "questions",
    "question",
    "research-questions"
  ]],

  ["hypotheses", [
    "node-hypotheses",
    "hypotheses",
    "hypothese",
    "research-hypotheses"
  ]],

  ["revue", [
    "node-literature",
    "literature",
    "literature-review",
    "revue",
    "etat-de-l-art",
    "related-work"
  ]],

  ["cadre theorique", [
    "theoretical-framework",
    "cadre-theorique"
  ]],

  ["methodologie", [
    "node-methodology",
    "methodology",
    "method",
    "methodologie",
    "materiel",
    "protocole"
  ]],

  ["resultats", [
    "node-results",
    "results",
    "resultat",
    "resultats",
    "findings"
  ]],

  ["discussion", [
    "node-discussion",
    "discussion",
    "interpretation",
    "analysis"
  ]],

  ["conclusion", [
    "node-conclusion",
    "conclusion",
    "bilan",
    "perspectives"
  ]],
];

function resolveSectionKey(node = {}, sectionTitle = "") {
  const candidates = [
    node?.id,
    node?.key,
    node?.slug,
    node?.type,
    sectionTitle
  ]
    .filter(Boolean)
    .map(normalizeKey);

  for (const [canonical, aliases] of SECTION_ALIASES) {
    const normalizedAliases = aliases.map(normalizeKey);

    if (
      candidates.some((candidate) =>
        normalizedAliases.includes(candidate)
      )
    ) {
      return canonical;
    }
  }

  const titleKey = normalizeKey(sectionTitle);

  // Resolve common nested headings before broad title matching. This prevents
  // every subsection from receiving the same generic chapter paragraph.
  if (titleKey.includes("population") || titleKey.includes("participant") || titleKey.includes("échantillon") || titleKey.includes("eligibility")) return "population";
  if (titleKey.includes("cadre concept") || titleKey.includes("etat de l'art") || titleKey.includes("état de l'art")) return "cadre theorique";
  if (titleKey.includes("collecte") || titleKey.includes("questionnaire") || titleKey.includes("procedure") || titleKey.includes("protocole experimental")) return "collecte-donnees";
  if (titleKey.includes("analyse") && !titleKey.includes("discussion")) return "analyse-donnees";
  if (titleKey.includes("ethique") || titleKey.includes("consentement")) return "ethique";
  if (titleKey.includes("definition") || titleKey.includes("concept")) return "definitions";
  if (titleKey.includes("travaux anterieurs") || titleKey.includes("etudes anterieures")) return "travaux-anterieurs";
  if (titleKey.includes("lacune") || titleKey.includes("positionnement")) return "lacune";
  if (titleKey.includes("echantillon") || titleKey.includes("repondant") || titleKey.includes("participants")) return "description-donnees";
  if (titleKey.includes("resultat") || titleKey.includes("constat") || titleKey.includes("flux de selection")) return "resultats-principaux";
  if (titleKey.includes("limite") || titleKey.includes("biais") || titleKey.includes("incertitude")) return "discussion-limites";
  if (titleKey.includes("recommandation") || titleKey.includes("plan d'action")) return "recommandations";
  if (titleKey.includes("evaluation") || titleKey.includes("validation") || titleKey.includes("tests")) return "evaluation";

  if (titleKey.includes("contexte")) return "contexte";
  if (titleKey.includes("problemat")) return "problematique";
  if (titleKey.includes("objectif")) return "objectifs";
  if (titleKey.includes("question")) return "questions";
  if (titleKey.includes("hypoth")) return "hypotheses";

  if (
    titleKey.includes("revue") ||
    titleKey.includes("etat de l'art") ||
    titleKey.includes("related work")
  ) {
    return "revue";
  }

  if (titleKey.includes("cadre theorique")) {
    return "cadre theorique";
  }

  if (
    titleKey.includes("method") ||
    titleKey.includes("materiel") ||
    titleKey.includes("protocole")
  ) {
    return "methodologie";
  }

  if (
    titleKey.includes("resultat") ||
    titleKey.includes("findings")
  ) {
    return "resultats";
  }

  if (
    titleKey.includes("discussion") ||
    titleKey.includes("interpretation")
  ) {
    return "discussion";
  }

  if (
    titleKey.includes("conclusion") ||
    titleKey.includes("bilan")
  ) {
    return "conclusion";
  }

  return titleKey;
}

function table(rows = []) {
  return `
    <table class="macevo-demo-table">
      <tbody>
        ${rows.map((row) => `
          <tr>
            ${row.map((cell, index) =>
              index === 0
                ? `<th>${safe(cell)}</th>`
                : `<td>${safe(cell)}</td>`
            ).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function equation(spec) {
  if (!spec?.equation) return "";
  const expression = String(spec.equation);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="96" viewBox="0 0 1100 96" role="img" aria-label="${safe(`Équation : ${expression}`)}"><rect x="1" y="1" width="1098" height="94" rx="10" fill="#f3f6fa" stroke="#d8e1eb"/><text x="550" y="58" text-anchor="middle" fill="#1e293b" font-family="Georgia,serif" font-size="25">${safe(expression)}</text></svg>`;
  return `
    <figure class="macevo-equation-card">
      ${svgAsImage(svg, `Équation : ${expression}`, 1100, 96)}
      <figcaption class="macevo-equation-caption">
        Équation — Indicateur retenu pour l'analyse : ${safe(expression)}
      </figcaption>
    </figure>
  `;
}

function architecture(spec) {
  const nodes = [
    "Données / observations",
    "Traitement / méthode",
    "Analyse",
    "Interprétation",
  ];

  return `
    <figure class="macevo-architecture">
      <div class="macevo-architecture-title">
        ${safe(spec?.domain || "Architecture du dispositif")}
      </div>

      <div class="macevo-architecture-grid">
        ${nodes.map((node, i) => `
          <div class="macevo-architecture-node">
            <strong>${i + 1}</strong>
            <span>${safe(node)}</span>
          </div>
        `).join("")}
      </div>

      <figcaption>
        Figure — Organisation fonctionnelle du dispositif étudié
      </figcaption>
    </figure>
  `;
}

// Inline SVG keeps the figures sharp in the editor, PDF and print output.
function svgAsImage(svgMarkup, alt, width, height) {
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  return `<img src="${src}" alt="${safe(alt)}" width="${width}" height="${height}" style="display:block;width:100%;max-width:640px;height:auto;margin:12px auto" />`;
}

function indicatorChart(spec) {
  const labels = spec?.metric || [];
  const values = spec?.values || [];
  if (!labels.length || !values.length) return "";
  const width = 640;
  const rowHeight = 48;
  const top = 28;
  const height = top + labels.length * rowHeight + 24;
  const chartLeft = 218;
  const chartWidth = 330;
  const maxValue = Math.max(1, ...values.map((value) => Number(value) || 0));
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, index) => {
    const x = chartLeft + (chartWidth * index) / ticks;
    const value = Math.round((maxValue * index) / ticks);
    return `<line x1="${x}" y1="${top - 8}" x2="${x}" y2="${height - 16}" stroke="#dbe4ef" stroke-width="1"/><text x="${x}" y="${height - 2}" text-anchor="middle" fill="#64748b" font-size="11">${value}</text>`;
  }).join("");
  const rows = labels.map((label, index) => {
    const value = Math.max(0, Number(values[index]) || 0);
    const y = top + index * rowHeight;
    const barWidth = Math.max(3, (value / maxValue) * chartWidth);
    return `<text x="${chartLeft - 12}" y="${y + 18}" text-anchor="end" fill="#334155" font-size="12">${safe(label)}</text><rect x="${chartLeft}" y="${y}" width="${chartWidth}" height="24" rx="6" fill="#eef2f7"/><rect x="${chartLeft}" y="${y}" width="${barWidth}" height="24" rx="6" fill="#385b83"/><text x="${Math.min(chartLeft + barWidth + 8, width - 30)}" y="${y + 17}" fill="#1e293b" font-size="12" font-weight="700">${value}</text>`;
  }).join("");
  const dataRows = labels.map((label, index) => `<tr><th>${safe(label)}</th><td>${Number(values[index]) || 0}</td></tr>`).join("");
  const svg = `<svg role="img" aria-label="${safe(spec.figureTitle || "Graphique des indicateurs")}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${grid}${rows}</svg>`;
  return `<figure class="macevo-generated-figure" style="margin:16px auto;padding:14px;border:1px solid #dbe4ef;border-radius:10px;max-width:680px">${svgAsImage(svg, spec.figureTitle || "Graphique des indicateurs", width, height)}<table class="macevo-demo-table"><thead><tr><th>Indicateur</th><th>Valeur du scénario</th></tr></thead><tbody>${dataRows}</tbody></table><figcaption style="text-align:center;color:#64748b;font-size:11px;margin-top:8px">Figure — ${safe(spec.figureTitle || "Comparaison des indicateurs du scénario")}</figcaption></figure>`;
}

function conceptualCurve(spec) {
  const nodes = ["Facteurs étudiés", "Mécanismes", "Indicateurs", "Résultats à documenter"];
  const boxes = nodes.map((label, index) => {
    const x = 18 + index * 160;
    const fill = index === nodes.length - 1 ? "#385b83" : "#eef3f8";
    const color = index === nodes.length - 1 ? "#ffffff" : "#243b53";
    const arrow = index < nodes.length - 1 ? `<path d="M${x + 130} 89h18m-6-6 6 6-6 6" fill="none" stroke="#8294a8" stroke-width="2"/>` : "";
    return `<rect x="${x}" y="64" width="128" height="50" rx="8" fill="${fill}" stroke="#9aafc4"/><text x="${x + 64}" y="94" text-anchor="middle" fill="${color}" font-size="12">${safe(label)}</text>${arrow}`;
  }).join("");
  const svg = `<svg role="img" aria-label="Schéma conceptuel de l’étude, sans valeurs observées" width="660" height="150" viewBox="0 0 660 150" xmlns="http://www.w3.org/2000/svg"><text x="330" y="28" text-anchor="middle" fill="#243b53" font-size="15" font-weight="700">Cadre conceptuel — ${safe(spec.domain)}</text>${boxes}</svg>`;
  return `<figure class="macevo-generated-figure macevo-model-figure" style="margin:16px auto;padding:14px;border:1px solid #dbe4ef;border-radius:10px;max-width:680px">${svgAsImage(svg, "Schéma conceptuel, sans valeurs observées", 660, 150)}<figcaption style="text-align:center;color:#64748b;font-size:11px;margin-top:8px">Figure — Relation conceptuelle proposée pour ${safe(spec.title)} ; elle ne représente pas des résultats mesurés.</figcaption></figure>`;
}

function workflowDiagram(spec) {
  const steps = ["Cadre et question", "Protocole et collecte", "Analyse des données", "Interprétation et conclusion"];
  const boxes = steps.map((step, index) => {
    const y = 20 + index * 66;
    const accent = index === 3 ? "#385b83" : "#eaf0f6";
    const text = index === 3 ? "#ffffff" : "#243b53";
    const arrow = index < steps.length - 1 ? `<path d="M320 ${y + 43} v17 m-5 -5 5 5 5 -5" fill="none" stroke="#8294a8" stroke-width="2"/>` : "";
    return `<rect x="112" y="${y}" width="416" height="42" rx="9" fill="${accent}"/><text x="320" y="${y + 26}" text-anchor="middle" fill="${text}" font-size="14" font-weight="600">${safe(step)}</text>${arrow}`;
  }).join("");
  const svg = `<svg role="img" aria-label="Démarche méthodologique" width="640" height="292" viewBox="0 0 640 292" xmlns="http://www.w3.org/2000/svg"><text x="320" y="16" text-anchor="middle" fill="#243b53" font-size="14" font-weight="700">Démarche de l’étude</text>${boxes}</svg>`;
  return `<figure class="macevo-generated-figure macevo-model-figure" style="margin:16px auto;padding:14px;border:1px solid #dbe4ef;border-radius:10px;max-width:680px">${svgAsImage(svg, "Démarche méthodologique", 640, 292)}<table class="macevo-demo-table"><tbody><tr><th>1</th><td>Cadre et question</td></tr><tr><th>2</th><td>Protocole et collecte</td></tr><tr><th>3</th><td>Analyse des données</td></tr><tr><th>4</th><td>Interprétation et conclusion</td></tr></tbody></table><figcaption style="text-align:center;color:#64748b;font-size:11px;margin-top:8px">Figure — Séquence de travail appliquée à ${safe(spec.domain)}</figcaption></figure>`;
}

function references(spec) {
  const items = spec?.references || [];
  if (!items.length) return "";
  return `
    <ol class="macevo-reference-list">
      ${items.map((ref, i) =>
        `<li><span>${i + 1}.</span> ${typeof ref === "string"
          ? safe(ref)
          : `<a href="${safe(ref.url)}">${safe(ref.text || ref.title)}</a>`}</li>`
      ).join("")}
    </ol>
  `;
}

function blueprintSectionContent(blueprint, key, sectionTitle) {
  const research = blueprint?.research || {};
  const discipline = safe(blueprint?.document?.discipline || "discipline étudiée");
  const question = String(research.question || "").trim();
  const objective = String(research.objective || "").trim();
  const method = String(research.methodology || "").trim();
  const researchType = safe(research.type || "");
  const title = safe(sectionTitle || "Cette partie");
  const listItems = String(research.hypotheses || "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
  const listHtml = listItems.length
    ? `<ol>${listItems.map((item) => `<li>${safe(item)}</li>`).join("")}</ol>`
    : "";

  if (key === "introduction" || key === "contexte") {
    return `<p>Ce travail s’inscrit en <strong>${discipline}</strong>${researchType ? ` dans une démarche de type <strong>${researchType}</strong>` : ""}. Le cadrage situe le sujet, précise les personnes, organisations ou corpus concernés et délimite la période ainsi que le contexte d’observation.</p>${question ? `<p><strong>Question directrice :</strong> <em>${safe(question)}</em></p>` : ""}${objective ? `<p><strong>Objectif :</strong> ${safe(objective)}</p>` : ""}<p>La suite du document relie ce cadrage aux connaissances publiées, au protocole retenu et aux éléments empiriques effectivement recueillis. Cette progression aide le lecteur à distinguer les faits de contexte, les choix de méthode et les conclusions de l’étude.</p>`;
  }
  if (key === "problematique" || key === "questions" || key === "question-principale") {
    return `<p>La problématique précise l’écart de connaissance ou la difficulté observée qui justifie le travail. Elle doit être délimitée selon le domaine, le contexte, la période et l’unité d’analyse afin que les réponses restent vérifiables.</p>${question ? `<p><strong>Question retenue :</strong> <em>${safe(question)}</em></p>` : ""}<p>Les questions secondaires, lorsqu’elles sont nécessaires, déclinent cette question centrale en dimensions observables. Elles doivent correspondre aux objectifs et aux données que le protocole permet réellement de recueillir.</p>`;
  }
  if (key === "objectifs" || key === "objectifs-specifiques") {
    return `<p>Les objectifs traduisent la problématique en résultats de travail observables. Ils sont formulés avec des verbes d’action et suivent l’ordre de la démarche : caractériser le contexte, analyser le phénomène, puis évaluer la portée des constats.</p>${objective ? `<p><strong>Objectif général :</strong> ${safe(objective)}</p>` : ""}<table class="macevo-demo-table"><thead><tr><th>Étape</th><th>Fonction scientifique</th><th>Preuve attendue</th></tr></thead><tbody><tr><td>Décrire</td><td>Établir le contexte et le périmètre</td><td>Caractéristiques des sources ou participants</td></tr><tr><td>Analyser</td><td>Répondre à la question selon la méthode annoncée</td><td>Résultats traçables</td></tr><tr><td>Interpréter</td><td>Relier les constats au cadre scientifique</td><td>Conclusion proportionnée aux preuves</td></tr></tbody></table>`;
  }
  if (key === "hypotheses") {
    return `<p>Les hypothèses exposent les relations attendues avant l’analyse. Elles doivent découler du cadre théorique, préciser les variables ou dimensions concernées et pouvoir être confrontées au protocole retenu. Pour une étude exploratoire ou qualitative, des questions analytiques peuvent être plus appropriées qu’une hypothèse causale.</p>${listHtml}<p>L’analyse devra rapporter les éléments qui soutiennent ces propositions comme ceux qui les contredisent, en séparant les hypothèses formulées à l’avance des constats exploratoires.</p>`;
  }
  if (key === "revue" || key === "travaux-anterieurs" || key === "cadre theorique" || key === "definitions" || key === "lacune") {
    return `<p>La synthèse documentaire organise les publications autour des concepts, méthodes et résultats qui répondent à la question de recherche. Elle compare les travaux entre eux et explicite leurs contextes, leurs limites et le niveau de preuve disponible, au lieu d’aligner des résumés isolés.</p><p>Les sources doivent être retrouvées dans leur version consultée, évaluées selon leur pertinence et citées au point où elles soutiennent une affirmation. Les références inventées ou reprises sans vérification ne doivent pas être intégrées à la bibliographie.</p><table class="macevo-demo-table"><thead><tr><th>Axe de synthèse</th><th>Comparaison à conduire</th><th>Utilité pour l’étude</th></tr></thead><tbody><tr><td>Concepts</td><td>Définitions et cadres théoriques</td><td>Stabiliser les notions retenues</td></tr><tr><td>Méthodes</td><td>Populations, corpus et protocoles</td><td>Justifier les choix de recherche</td></tr><tr><td>Résultats</td><td>Convergences, divergences et limites</td><td>Établir le positionnement scientifique</td></tr></tbody></table>`;
  }
  if (key === "methodologie" || key === "conception-etude" || key === "population" || key === "collecte-donnees" || key === "analyse-donnees" || key === "ethique") {
    return `<p>${method ? safe(method) : `Le protocole de ${discipline} doit être choisi en fonction de la question, du type de preuve recherché et des contraintes du terrain ou du corpus.`}</p><p>La méthode expose le devis, le contexte, les critères de sélection, les instruments, les procédures de collecte et le plan d’analyse. Elle indique comment les données sont contrôlées, codées et conservées afin que les décisions puissent être retracées.</p><p>Lorsque des personnes ou des données sensibles sont impliquées, le protocole décrit le consentement, la confidentialité, les autorisations institutionnelles et la gestion des risques conformément aux règles applicables dans l’établissement et le pays concernés.</p>${workflowDiagram({ domain: blueprint?.document?.discipline || "Recherche" })}`;
  }
  if (key === "resultats" || key === "resultats-principaux" || key === "description-donnees") {
    return `<p>${title} présente les observations issues du protocole, dans l’ordre des objectifs ou des questions. Chaque résultat doit être accompagné de son unité, de son effectif ou périmètre, de sa période et des limites nécessaires à son interprétation.</p><p>Le document de départ ne contient pas de résultats empiriques : aucune valeur, tendance ou conclusion chiffrée n’est fabriquée. Les tableaux, graphiques et courbes ne doivent être produits qu’à partir des données réellement collectées ou d’un corpus vérifiable.</p><table class="macevo-demo-table"><thead><tr><th>Élément à rapporter</th><th>Exigence de présentation</th></tr></thead><tbody><tr><td>Résultat principal</td><td>Réponse liée à un objectif défini</td></tr><tr><td>Mesure ou thème</td><td>Unité, méthode de codage et périmètre</td></tr><tr><td>Précision et limites</td><td>Effectifs, incertitudes et données manquantes</td></tr></tbody></table>`;
  }
  if (key === "discussion" || key === "discussion-limites") {
    return `<p>La discussion met en relation les résultats établis avec la question, le cadre conceptuel et les publications consultées. Elle distingue les constats directement soutenus par les données des interprétations, et confronte les résultats aux explications alternatives.</p><p>La portée des conclusions dépend du devis, de la qualité des sources et des limites de l’échantillon ou du corpus. Les limites sont reliées à leurs effets possibles sur chaque conclusion, puis les implications sont formulées à une échelle proportionnée aux preuves.</p>`;
  }
  if (key === "conclusion") {
    return `<p>La conclusion répond directement à la question de recherche et récapitule les apports établis par le travail. Elle reprend les objectifs, indique ceux qui ont été atteints et distingue les résultats démontrés des pistes qui nécessitent encore une vérification.</p>${question ? `<p><strong>Question de recherche :</strong> ${safe(question)}</p>` : ""}${objective ? `<p><strong>Objectif général :</strong> ${safe(objective)}</p>` : ""}<p>Les recommandations et perspectives doivent découler des résultats présentés, préciser leurs conditions d’application et reconnaître les limites du travail. Une conclusion ne doit pas introduire de nouvelles données ni de nouvelles références.</p>`;
  }
  if (key.includes("bibliographie") || key.includes("reference")) {
    return `<p>La bibliographie finale doit recenser uniquement les sources effectivement consultées et citées dans le texte. Vérifiez la correspondance entre chaque citation et sa référence, puis appliquez le style sélectionné par votre établissement ou votre revue.</p>`;
  }
  return `<p>${title} contribue à la réponse à la question de recherche. Cette partie précise son lien avec les objectifs, les notions mobilisées et les éléments qui permettront d’en vérifier les conclusions.</p><p>La rédaction distingue les informations issues des sources, les décisions méthodologiques et les observations produites par l’étude. Cette séparation rend l’argumentation plus lisible et facilite l’évaluation du travail.</p>`;
}

/**
 * Retourne le HTML initial associé à une section.
 * Ce contenu est un contenu de démonstration/amorçage :
 * l'utilisateur peut ensuite le remplacer dans l'éditeur.
 */
export function getAcademicSectionContent(
  template,
  sectionTitle = "",
  profile = {},
  node = {}
) {
  const spec = getMacevoModelSpec(template);
  const key = resolveSectionKey(node, sectionTitle);

  if (template?.sectionContent?.[sectionTitle]) {
    return String(template.sectionContent[sectionTitle]);
  }

  const neutralBlueprint = spec.isNeutralFallback
    ? {
        document: {
          title: spec.title,
          discipline: spec.domain,
        },
        research: {
          type: template?.studyType || "",
          question: template?.researchQuestion || "",
          objective: template?.objective || "",
          methodology: template?.methodology || "",
          hypotheses: template?.hypotheses || "",
        },
      }
    : null;
  const blueprint = template?.scientificBlueprint || neutralBlueprint;

  if (blueprint) {
    return blueprintSectionContent(
      blueprint,
      key,
      sectionTitle || node?.title || node?.name
    );
  }

  if (key === "conception-etude") {
    return `<p>Le devis de l’étude est choisi en fonction de la question, de l’unité d’analyse et du niveau de preuve recherché. La distinction entre étude descriptive, analytique, expérimentale, qualitative ou appliquée doit être explicitée avant de présenter les procédures.</p><p>Les critères de sélection, les périodes d’observation et les conditions de comparaison sont précisés pour rendre le raisonnement reproductible et limiter les interprétations après coup.</p>`;
  }

  if (key === "population") {
    return `<p>La population cible, la population accessible et l’unité d’analyse sont distinguées. Les critères d’inclusion et d’exclusion sont définis avant la collecte, puis le mode de recrutement ou de sélection est décrit avec ses éventuels biais.</p><p>La taille de l’échantillon est justifiée par le devis et les ressources disponibles. Toute exclusion, donnée manquante ou différence entre personnes recrutées et analysées est documentée.</p>`;
  }

  if (key === "collecte-donnees") {
    return `<p>Les instruments de collecte sont choisis en fonction des variables ou thèmes étudiés. Leur contenu, leurs conditions d’administration, la formation des personnes chargées du recueil et les procédures de contrôle qualité sont consignés.</p><p>Les données sont codées selon un dictionnaire explicite. Les modifications apportées aux outils ou au protocole sont datées afin de préserver la traçabilité.</p>`;
  }

  if (key === "analyse-donnees") {
    return `<p>Le plan d’analyse relie chaque question de recherche aux variables, catégories ou matériaux mobilisés. Les transformations, exclusions et méthodes de comparaison sont décrites avant l’interprétation.</p>${equation(spec)}<p>Les résultats doivent être présentés avec les unités, les effectifs et les incertitudes utiles. Une association observée ne suffit pas à établir un lien causal lorsque le devis ne le permet pas.</p>`;
  }

  if (key === "ethique") {
    return `<p>La démarche précise les autorisations institutionnelles et éthiques applicables, le mode d’information des participants, le consentement, la confidentialité et la durée de conservation des données.</p><p>Les données permettant une identification directe sont limitées et protégées. Les risques, conflits d’intérêts et modalités de retrait sont exposés selon le protocole effectivement approuvé.</p>`;
  }

  if (key === "definitions") {
    return `<p>Les concepts centraux sont définis à partir de sources disciplinaires reconnues, puis traduits en dimensions utilisables dans l’analyse. Les définitions concurrentes sont comparées afin de justifier le sens retenu dans cette étude.</p><p>Chaque concept est relié à des indicateurs, catégories ou critères observables, sans confondre la définition théorique et sa mesure opérationnelle.</p>`;
  }

  if (key === "travaux-anterieurs") {
    return `<p>Les travaux antérieurs sont organisés par question, méthode ou résultat plutôt que par une succession de résumés. La comparaison relève les convergences, les divergences et les limites des preuves disponibles.</p><p>Les références mobilisées doivent être consultées et vérifiées dans leur source originale. Les résultats de la littérature sont séparés des constats produits par la présente étude.</p>`;
  }

  if (key === "lacune") {
    return `<p>Le positionnement de l’étude découle de la synthèse critique : il précise ce qui reste incertain, les populations ou contextes peu documentés et la contribution que le devis permet réellement d’apporter.</p><p>La lacune retenue est formulée de façon vérifiable et reliée directement à la question de recherche et aux objectifs.</p>`;
  }

  if (key === "description-donnees") {
    return `<p>Cette partie décrit les matériaux effectivement analysés : effectifs, période, provenance, critères de sélection et qualité des données. Les caractéristiques sont rapportées sans extrapoler au-delà de la population étudiée.</p>${table([["Élément à rapporter", "Description attendue"], ["Effectif analysé", "Nombre et éventuelles exclusions"], ["Période et source", "Dates et provenance des données"], ["Données manquantes", "Volume et traitement retenu"]])}`;
  }

  if (key === "resultats-principaux") {
    return `<p>Les résultats répondent à l’objectif correspondant à cette sous-section. Les constats sont présentés dans l’ordre du protocole, avec leurs unités et les éléments nécessaires pour juger leur précision.</p><p>La description distingue les résultats préspécifiés des analyses exploratoires et rapporte aussi les résultats qui ne vont pas dans le sens attendu.</p>`;
  }

  if (key === "discussion-limites") {
    return `<p>Les limites sont examinées en fonction de leur origine et de leurs conséquences possibles : sélection, mesure, confusion, données manquantes, taille d’échantillon ou transférabilité. Leur effet sur chaque conclusion est explicité.</p><p>La discussion évite de transformer une limite en simple réserve générale et indique quelles vérifications ou études futures pourraient réduire l’incertitude.</p>`;
  }

  if (key === "recommandations") {
    return `<p>Les recommandations sont directement rattachées aux constats étayés. Chacune précise le public concerné, le changement proposé, les conditions de mise en œuvre et un moyen de suivi.</p>${table([["Priorité", "Justification", "Suivi"], ["Action immédiate", "Constat documenté", "Indicateur et échéance"], ["Action à moyen terme", "Résultat à confirmer", "Revue périodique"]])}`;
  }

  if (key === "travaux-realises") {
    return `<p>Les activités sont décrites par leur objectif, la démarche suivie, les livrables produits et les critères de validation. Les choix techniques ou professionnels sont justifiés par les contraintes observées.</p>${architecture(spec)}`;
  }

  if (key === "evaluation") {
    return `<p>L’évaluation compare les résultats aux critères définis avant la réalisation. Les tests, observations ou retours sont associés à des preuves consultables et à leurs conditions de collecte.</p>${table([["Critère", "Méthode de vérification", "Preuve à rapporter"], ["Conformité", "Vérification fonctionnelle", "Résultat du test"], ["Utilisabilité ou performance", "Mesure ou observation", "Valeur et contexte"]])}`;
  }

  if (key.includes("introduction")) {
    return `
      <p>${safe(spec.title)} s'inscrit dans le domaine de
      <strong>${safe(spec.domain)}</strong>. Le travail part d'une situation
      concrète, identifie une difficulté mesurable et construit une réponse
      argumentée à partir d'une démarche méthodique.</p>

      <p>La question directrice est la suivante :
      <em>${safe(spec.question)}</em></p>

      <p>L'étude poursuit un objectif opérationnel :
      ${safe(spec.objective)}</p>

      <p>Le périmètre retenu relie la question de recherche aux observations
      réalisables, aux sources mobilisées et aux critères d’analyse. Cette
      délimitation permet de maintenir une continuité entre le problème posé,
      la méthode choisie et les conclusions présentées.</p>

      <p>La contribution attendue consiste à produire une analyse étayée,
      à expliciter ses limites et à dégager des implications utiles pour
      ${safe(spec.domain)}.</p>
    `;
  }

  if (key === "contexte") {
    return `
      <p>Le contexte de l'étude est défini à partir de la situation réelle dans laquelle s'inscrit <strong>${safe(spec.title)}</strong>. Il précise le domaine, les acteurs concernés, les contraintes observées et les enjeux qui justifient l'étude.</p>

      <p>L'analyse du contexte permet de passer d'un constat général à un cadre d'étude délimité, documenté et exploitable pour la suite du travail.</p>

      <p>Le cadrage distingue les caractéristiques du milieu, les acteurs
      concernés, la période couverte et les contraintes susceptibles
      d’influencer les observations. Il fournit ainsi les éléments nécessaires
      pour interpréter les résultats sans les détacher de leur environnement.</p>
    `;
  }

  if (key === "problematique") {
    return `
      <p>La problématique formalise le problème scientifique ou professionnel auquel le travail cherche à répondre. Elle met en évidence l'écart entre la situation observée et la situation recherchée.</p>

      <p><strong>Question centrale :</strong>
      <em>${safe(spec.question)}</em></p>

      <p>La formulation retenue servira de fil directeur pour les objectifs, les hypothèses, la méthodologie et l'interprétation des résultats.</p>

      <p>Pour éviter une question trop large, l’analyse précise les concepts
      centraux, les unités d’observation et les relations à examiner. Les
      choix de méthode présentés ensuite découlent directement de cette
      délimitation.</p>
    `;
  }

  if (key === "objectifs") {
    return `
      <p>L'objectif général est de produire une réponse structurée et évaluable à la problématique retenue.</p>

      <p><strong>Objectif général :</strong>
      ${safe(spec.objective)}</p>

      ${table([
        ["Objectif", "Résultat attendu"],
        ["Diagnostiquer", "Situation initiale caractérisée"],
        ["Concevoir / analyser", "Réponse structurée et justifiée"],
        ["Évaluer", "Résultats mesurables et interprétables"],
      ])}
    `;
  }

  if (key === "questions") {
    return `
      <p>Les questions de recherche déclinent la problématique en interrogations vérifiables et directement reliées aux objectifs de l'étude.</p>

      <ol>
        <li>Quels sont les principaux facteurs qui caractérisent la situation étudiée ?</li>
        <li>Quelles approches permettent d'apporter une réponse adaptée au contexte ?</li>
        <li>Quels indicateurs permettent d'évaluer la réponse proposée ?</li>
      </ol>
    `;
  }

  if (key === "hypotheses") {
    return `
      <p>Les hypothèses traduisent les relations attendues entre les variables ou dimensions étudiées. Elles seront confrontées aux données et aux résultats produits par la méthodologie.</p>

      <ol>
        <li>Une démarche structurée permet d'améliorer la maîtrise du problème étudié.</li>
        <li>Les facteurs identifiés dans le cadre théorique influencent les résultats observés.</li>
        <li>Une évaluation fondée sur des indicateurs explicites permet de vérifier les effets attendus.</li>
      </ol>
    `;
  }

  if (
    key.includes("revue") ||
    key.includes("etat de l'art") ||
    key.includes("related work")
  ) {
    return `
      <p>La littérature et les travaux antérieurs montrent que la
      problématique étudiée doit être abordée à la fois par ses dimensions
      conceptuelles et par ses conditions de mise en œuvre.</p>

      <p>La synthèse conduit à retenir trois critères de comparaison :
      pertinence pour le contexte, capacité d'évaluation et facilité
      d'intégration.</p>

      ${table([
        ["Dimension", "Approche dominante", "Limite observée"],
        ["Conception", "Approche structurée", "Coût de mise en œuvre"],
        ["Évaluation", "Indicateurs mesurables", "Dépendance aux données"],
        ["Adoption", "Accompagnement progressif", "Effort organisationnel"],
      ])}
    `;
  }

  if (key.includes("cadre theorique")) {
    return `
      <p>Le cadre théorique articule les notions de
      <strong>${safe(spec.domain)}</strong>, de performance et d'adoption.
      Il sert à définir les variables observées et à expliciter les relations
      attendues avant la collecte des données.</p>

      <p>Le modèle d'analyse distingue les facteurs d'entrée, le mécanisme
      étudié et les résultats observables.</p>

      ${equation(spec)}
      ${conceptualCurve(spec)}
    `;
  }

  if (
    key.includes("method") ||
    key.includes("materiel") ||
    key.includes("protocole")
  ) {
    const reportingGuidance = (template?.reportingGuidelines || template?.documentRules?.reportingGuidelines || [])
      .map((guide) => `<p><strong>Guide de rapport :</strong> <a href="${safe(guide.url)}">${safe(guide.id || guide.title)}</a> — ${safe(guide.applicability)}</p>`)
      .join("");
    return `
      <p>${safe(spec.method)}</p>

      ${reportingGuidance}

      <p>Le choix du dispositif est justifié par la nature de la question et
      par le type de preuve recherché. Le protocole précise les unités
      d’analyse, les critères de sélection, les outils de collecte et les
      conditions dans lesquelles les observations sont produites.</p>

      <p>La qualité des données repose sur des définitions stables, une
      documentation des décisions de collecte et une vérification des
      informations avant leur interprétation. Lorsque des participants ou des
      données sensibles sont concernés, la confidentialité, le consentement
      et les autorisations applicables sont intégrés au dispositif.</p>

      <p>Le protocole est organisé de façon à assurer la traçabilité des
      observations et la comparabilité des résultats. Les indicateurs sont
      définis avant l'analyse afin de limiter les interprétations opportunistes.</p>

      ${equation(spec)}

      ${table([
        ["Étape", "Objectif", "Sortie"],
        ["Préparation", "Cadrer le besoin", "Protocole"],
        ["Collecte", "Obtenir les données", "Corpus"],
        ["Analyse", "Interpréter", "Résultats"],
      ])}
      ${workflowDiagram(spec)}
    `;
  }

  if (
    key.includes("resultat") ||
    key.includes("analyse des resultats")
  ) {
    return `
      <p>${safe(spec.finding)}</p>

      <p>La présentation des résultats suit les questions et les objectifs de
      l’étude. Chaque observation est rapportée avec son unité de mesure, son
      périmètre et les éléments nécessaires pour en apprécier la portée.</p>

      ${table([
        ["Indicateur", "Observation", "Interprétation"],
        ["Pertinence", "Conforme au cadre", "Résultat exploitable"],
        ["Performance", "Écart maîtrisé", "Tendance favorable"],
        ["Robustesse", "Variation limitée", "Résultat à confirmer"],
      ])}

      ${indicatorChart(spec)}
      ${architecture(spec)}
    `;
  }

  if (
    key.includes("discussion") ||
    key === "analyse"
  ) {
    return `
      <p>Les résultats doivent être interprétés en tenant compte du
      périmètre de l'étude. ${safe(spec.finding)}</p>

      <p>L’interprétation met en relation les observations, le cadre
      conceptuel et les résultats des travaux antérieurs. Elle distingue les
      constats directement soutenus par les données des explications qui
      restent plausibles mais demandent une vérification complémentaire.</p>

      <p>La principale limite concerne la généralisation des observations :
      les résultats sont directement valables pour le contexte étudié et
      doivent être confirmés sur un environnement plus large.</p>

      <p>Cette discussion conduit à recommander
      ${safe(spec.recommendation)}</p>
    `;
  }

  if (
    key.includes("conclusion") ||
    key.includes("bilan")
  ) {
    return `
      <p>Au terme de ce travail, la problématique
      <em>${safe(spec.question)}</em> reçoit une réponse fondée sur les
      observations et l'analyse présentées.</p>

      <p>L'objectif principal, qui consistait à
      ${safe(spec.objective).toLowerCase()}, est traité par une démarche
      cohérente allant du diagnostic à l'évaluation.</p>

      <p>Pour la suite, ${safe(spec.recommendation)}</p>

      <p>La portée des conclusions dépend du dispositif, de la qualité des
      sources et des limites exposées dans la discussion. Les prolongements
      proposés doivent donc être compris comme des pistes argumentées à
      partir des résultats obtenus.</p>
    `;
  }

  if (key.includes("mission")) {
    return `
      <p>Les missions ont été organisées autour d'activités directement liées
      au fonctionnement de ${safe(profile.company || "la structure étudiée")}.
      Elles ont permis de passer de l'observation à la production de livrables
      vérifiables.</p>

      ${table([
        ["Activité", "Livrable", "Résultat"],
        ["Diagnostic", "Cartographie du processus", "Processus documenté"],
        ["Conception / analyse", "Proposition structurée", "Solution validée"],
        ["Évaluation", "Indicateurs", "Résultats mesurés"],
      ])}
    `;
  }

  if (
    key.includes("architecture") ||
    key.includes("travaux realises") ||
    key.includes("implementation") ||
    key.includes("realisation")
  ) {
    return `
      <p>La réalisation a traduit les besoins prioritaires en livrables
      concrets. Les choix ont été documentés afin de rendre le résultat
      compréhensible et maintenable.</p>

      ${architecture(spec)}

      <p>La mise en œuvre a été conduite par itérations, avec validation de
      chaque fonction critique avant intégration dans l'ensemble.</p>
    `;
  }

  if (key.includes("technologies")) {
    return `
      <p>La sélection technique repose sur l'adéquation au besoin, la maturité
      des outils, la maintenabilité et la compatibilité avec l'environnement cible.</p>

      ${table([
        ["Composant", "Rôle", "Critère de choix"],
        ["Couche interface", "Interaction", "Réutilisabilité"],
        ["Couche métier", "Traitement", "Testabilité"],
        ["Couche données", "Persistance", "Intégrité"],
      ])}
    `;
  }

  if (key.includes("tests")) {
    return `
      <p>La validation couvre les scénarios fonctionnels critiques et les cas
      d'erreur. Chaque test associe une condition initiale, une action et un
      résultat attendu.</p>

      ${table([
        ["Scénario", "Résultat attendu", "Statut"],
        ["Parcours principal", "Résultat conforme", "Validé"],
        ["Donnée invalide", "Erreur explicite", "Validé"],
        ["Charge / variation", "Service stable", "Validé"],
      ])}
    `;
  }

  if (
    key.includes("presentation de l'entreprise") ||
    key.includes("presentation de l'organisation")
  ) {
    return `
      <p><strong>${safe(profile.company || profile.institution)}</strong>
      évolue dans le domaine de ${safe(spec.domain)}.</p>

      ${table([
        ["Pôle", "Responsabilité"],
        ["Direction", "Pilotage et arbitrage"],
        ["Opérations", "Production et suivi"],
        ["Support", "Qualité, assistance et coordination"],
      ])}
    `;
  }

  if (key.includes("competence")) {
    return `
      <p>La réalisation du travail a renforcé des compétences techniques,
      méthodologiques et professionnelles.</p>

      ${table([
        ["Compétence", "Situation mobilisée", "Niveau acquis"],
        ["Analyse", "Diagnostic initial", "Maîtrisé"],
        ["Conception", "Production du dispositif", "Maîtrisé"],
        ["Communication", "Restitution", "Opérationnel"],
      ])}
    `;
  }

  if (
    key.includes("difficult") ||
    key.includes("probleme")
  ) {
    return `
      <p>Les difficultés rencontrées ont principalement concerné la
      disponibilité des informations, la clarification de certains besoins
      et la gestion des contraintes de délai.</p>

      <p>Elles ont été traitées par priorisation, vérification des hypothèses
      et échanges réguliers avec les responsables.</p>
    `;
  }

  if (
    key.includes("recommandation") ||
    key.includes("solutions apportees")
  ) {
    return `
      <p>Les solutions proposées privilégient les actions à fort impact et à
      mise en œuvre réaliste : ${safe(spec.recommendation)}</p>

      ${table([
        ["Action", "Impact attendu", "Priorité"],
        ["Optimisation", "Amélioration de l'efficacité", "Élevée"],
        ["Suivi", "Meilleure mesure", "Moyenne"],
        ["Capitalisation", "Réutilisation des acquis", "Moyenne"],
      ])}
    `;
  }

  if (key.includes("planification")) {
    return `
      ${table([
        ["Phase", "Objectif", "Livrable"],
        ["Préparation", "Cadrer le besoin", "Note de cadrage"],
        ["Réalisation", "Produire", "Livrable principal"],
        ["Validation", "Mesurer", "Rapport de validation"],
      ])}

      <p>La planification privilégie des jalons courts afin de détecter
      rapidement les écarts et de sécuriser les décisions.</p>
    `;
  }

  if (key.includes("dimensionnement")) {
    return `
      ${equation(spec)}

      <p>Le dimensionnement est conduit à partir du besoin, des conditions
      d'exploitation et d'un coefficient de sécurité. Les hypothèses sont
      explicitées afin de rendre le calcul vérifiable.</p>
    `;
  }

  if (key.includes("jury")) {
    return `
      <div class="macevo-jury">
        <div>
          <strong>Président du jury</strong>
        </div>

        <div>
          <strong>Rapporteur</strong>
        </div>

        <div>
          <strong>Directeur de recherche</strong>
        </div>
      </div>
    `;
  }

  if (key.includes("resume")) {
    return `
      <p><strong>Contexte.</strong> ${safe(spec.title)}.</p>

      <p><strong>Démarche.</strong> ${safe(spec.method)}</p>

      <p><strong>Résultat principal.</strong> ${safe(spec.finding)}</p>

      <p><strong>Conclusion.</strong> ${safe(spec.recommendation)}</p>

      <p><strong>Mots-clés :</strong>
      ${safe(spec.domain)}, analyse, méthode,
      évaluation, performance.</p>
    `;
  }

  if (key.includes("abstract")) {
    return `
      <p><strong>Background.</strong> ${safe(spec.title)}.</p>

      <p><strong>Methods.</strong> ${safe(spec.method)}</p>

      <p><strong>Results.</strong> ${safe(spec.finding)}</p>

      <p><strong>Conclusion.</strong> ${safe(spec.recommendation)}</p>

      <p><strong>Keywords:</strong>
      ${safe(spec.domain)}, analysis, method,
      evaluation, performance.</p>
    `;
  }

  if (
    key.includes("mot-cle") ||
    key.includes("keyword")
  ) {
    return `
      <p class="macevo-keywords">
        ${safe(spec.domain)} · analyse · méthode · évaluation · performance · transformation
      </p>
    `;
  }

  if (key.includes("auteur")) {
    return `
      <div class="macevo-author-block">
        <strong>${safe(profile.student || "Auteur")}</strong>
        <span>${safe(profile.department)} — ${safe(profile.institution)}</span>
      </div>
    `;
  }

  if (key.includes("affiliation")) {
    return `
      <p>
        <strong>${safe(profile.institution)}</strong><br>
        ${safe(profile.faculty)}<br>
        ${safe(profile.department)}
      </p>
    `;
  }

  if (key.includes("liste des figures")) {
    return `
      <div class="macevo-illustration-list">
        <div class="macevo-list-entry">
          <span>Figure 1</span>
          <span class="macevo-list-label">
            ${safe(spec.figureTitle || "Synthèse des indicateurs")}
          </span>
        </div>

        <div class="macevo-list-entry">
          <span>Figure 2</span>
          <span class="macevo-list-label">
            Organisation fonctionnelle du dispositif
          </span>
        </div>
      </div>
    `;
  }

  if (key.includes("liste des tableaux")) {
    return `
      <div class="macevo-illustration-list">
        <div class="macevo-list-entry">
          <span>Tableau 1</span>
          <span class="macevo-list-label">
            ${safe(spec.tableTitle || "Synthèse des indicateurs")}
          </span>
        </div>

        <div class="macevo-list-entry">
          <span>Tableau 2</span>
          <span class="macevo-list-label">
            Paramètres et résultats
          </span>
        </div>
      </div>
    `;
  }

  if (key.includes("dedicace")) {
    return `
      <p class="macevo-dedication">
        À ma famille, à mes enseignants et à toutes les personnes dont le
        soutien a contribué à la réalisation de ce travail.
      </p>
    `;
  }

  if (key.includes("remerci")) {
    return `
      <p>
        Je remercie
        <strong>
          ${safe(
            profile.academicSupervisor ||
            "l'encadrement académique"
          )}
        </strong>
        pour l'encadrement scientifique apporté à ce travail.
      </p>

      <p>
        J'adresse également mes remerciements à l'équipe pédagogique,
        aux collaborateurs et aux participants qui ont contribué à cette étude.
      </p>
    `;
  }

  if (
    key.includes("bibliographie") ||
    key.includes("reference")
  ) {
    return references(spec);
  }

  if (key.includes("annexe")) {
    return `
      <div class="macevo-annex-card">
        <strong>
          Annexe A — Instrument de collecte / protocole
        </strong>

        <span>
          Grille, questionnaire, protocole ou fiche de test utilisé
          pour produire les données.
        </span>
      </div>

      <div class="macevo-annex-card">
        <strong>
          Annexe B — Éléments complémentaires
        </strong>
      </div>
    `;
  }

  return `
    <p>
      Cette section expose les éléments nécessaires à la compréhension de
      <strong>${safe(spec.title)}</strong>. Elle conserve une progression logique
      entre contexte, argumentation, preuve et interprétation.
    </p>
  `;
}

export function htmlToCanonicalBlocks(html = "") {
  return [{
    type: "html",
    html: String(html).trim(),
  }];
}

export function buildAcademicModuleContent(
  template,
  node,
  options = {}
) {
  const title = node?.title || node?.name || "";

  const html = getAcademicSectionContent(
    template,
    title,
    options.profile || {},
    node || {}
  );

  return {
    html,
    blocks: htmlToCanonicalBlocks(html),
    generated: true,
    engine: "macevo-academic-content",
    engineVersion: "1.0.0",
  };
}

export default {
  getAcademicSectionContent,
  htmlToCanonicalBlocks,
  buildAcademicModuleContent,
};
