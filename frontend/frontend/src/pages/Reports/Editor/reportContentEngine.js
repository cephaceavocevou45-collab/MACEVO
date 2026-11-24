/**
 * MACEVO — Moteur de contenu académique
 * Version 2.0.0
 *
 * Rôle :
 * - Transformer un module de structure en contenu documentaire structuré.
 * - Ne pas inventer de résultats scientifiques.
 * - Préparer les éléments éditoriaux : paragraphes, titres, tableaux,
 *   figures, schémas, équations, listes et références.
 * - Être directement compatible avec documentModel.js.
 *
 * Architecture :
 *
 * report
 *   +
 * structure node
 *   ↓
 * buildAcademicModuleContent()
 *   ↓
 * ContentElement[]
 *   ↓
 * documentModel.js
 *   ↓
 * renderer
 */

const EMPTY_STRING = "";

/* =========================================================
 * 1. UTILITAIRES
 * ======================================================= */

function clean(value) {
    if (value === null || value === undefined) {
        return EMPTY_STRING;
    }

    return String(value).trim();
}

function normalizeId(value) {
    return clean(value)
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
    return clean(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeHtmlAttribute(value) {
    return escapeHtml(value);
}

function slugify(value) {
    return normalizeId(value);
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function firstNonEmpty(...values) {
    for (const value of values) {
        const normalized = clean(value);

        if (normalized) {
            return normalized;
        }
    }

    return EMPTY_STRING;
}

/* =========================================================
 * 2. NORMALISATION DU RAPPORT
 * ======================================================= */

function normalizeReport(report = {}) {
    const source = report && typeof report === "object"
        ? report
        : {};

    return {
        ...source,

        id: source.id ?? source.pk ?? null,

        title: clean(source.title),

        author: clean(
            source.author?.name ||
            source.author?.full_name ||
            source.author_name ||
            source.authorName
        ),

        institution: clean(source.institution),
        faculty: clean(source.faculty),
        department: clean(source.department),
        program: clean(source.program),
        specialty: clean(source.specialty),

        academicYear: firstNonEmpty(
            source.academic_year,
            source.academicYear
        ),

        supervisor: clean(source.supervisor),

        country: clean(source.country),

        reportType: firstNonEmpty(
            source.report_type,
            source.reportType
        ),

        academicLevel: firstNonEmpty(
            source.academic_level,
            source.academicLevel
        ),

        scientificField: clean(source.scientific_field),
        language: clean(source.language),

        studyType: firstNonEmpty(
            source.study_type,
            source.studyType
        ),

        citationStyle: firstNonEmpty(
            source.citation_style,
            source.citationStyle
        ),

        referenceLanguage: clean(source.reference_language),

        institutionalRequirements: clean(
            source.institutional_requirements
        ),

        otherRequirements: clean(
            source.other_requirements
        ),

        summary: clean(source.summary),

        content: clean(source.content),
    };
}

/* =========================================================
 * 3. CONSTRUCTEURS D'ÉLÉMENTS
 * ======================================================= */

function createParagraph(text = "", options = {}) {
    return {
        type: "paragraph",
        id: options.id || null,
        html: clean(text),
        className: options.className || null,
    };
}

function createHeading(text = "", level = 2, options = {}) {
    return {
        type: "heading",
        id: options.id || null,
        level: Math.max(1, Math.min(6, Number(level) || 2)),
        text: clean(text),
    };
}

function createList(items = [], options = {}) {
    return {
        type: options.ordered ? "ordered-list" : "bullet-list",
        id: options.id || null,
        items: normalizeArray(items)
            .map(item => clean(item))
            .filter(Boolean),
    };
}

function createTable({
    id = null,
    number = "",
    title = "",
    headers = [],
    rows = [],
    source = "",
    caption = "",
} = {}) {
    return {
        type: "table",
        id,
        number: clean(number),
        title: clean(title),
        caption: clean(caption || title),
        headers: normalizeArray(headers).map(clean),
        rows: normalizeArray(rows).map(row =>
            normalizeArray(row).map(clean)
        ),
        source: clean(source),
    };
}

function createFigure({
    id = null,
    number = "",
    title = "",
    html = "",
    caption = "",
    source = "",
    alt = "",
} = {}) {
    return {
        type: "figure",
        id,
        number: clean(number),
        title: clean(title),
        caption: clean(caption || title),
        html: clean(html),
        source: clean(source),
        alt: clean(alt),
    };
}

function createSchema({
    id = null,
    number = "",
    title = "",
    html = "",
    caption = "",
    source = "",
} = {}) {
    return {
        type: "schema",
        id,
        number: clean(number),
        title: clean(title),
        caption: clean(caption || title),
        html: clean(html),
        source: clean(source),
    };
}

function createEquation({
    id = null,
    number = "",
    latex = "",
    title = "",
    description = "",
} = {}) {
    return {
        type: "equation",
        id,
        number: clean(number),
        latex: clean(latex),
        title: clean(title),
        description: clean(description),
    };
}

function createReference({
    id = null,
    authors = "",
    year = "",
    title = "",
    publisher = "",
    journal = "",
    volume = "",
    issue = "",
    pages = "",
    doi = "",
    url = "",
} = {}) {
    return {
        type: "reference",
        id,
        authors: clean(authors),
        year: clean(year),
        title: clean(title),
        publisher: clean(publisher),
        journal: clean(journal),
        volume: clean(volume),
        issue: clean(issue),
        pages: clean(pages),
        doi: clean(doi),
        url: clean(url),
    };
}

function createSection({
    id = null,
    title = "",
    level = 1,
    number = "",
    content = [],
    children = [],
} = {}) {
    return {
        type: "section",
        id,
        title: clean(title),
        level,
        number: clean(number),
        content: normalizeArray(content),
        children: normalizeArray(children),
    };
}

/* =========================================================
 * 4. CONTEXTE ACADÉMIQUE
 * ======================================================= */

function getInstitutionContext(report) {
    const parts = [
        report.institution,
        report.faculty,
        report.department,
        report.program,
        report.specialty,
    ].filter(Boolean);

    return parts.join(", ");
}

function getStudyContext(report) {
    const parts = [
        report.studyType,
        report.scientificField,
        report.academicLevel,
    ].filter(Boolean);

    return parts.join(", ");
}

/* =========================================================
 * 5. CONTENU ÉDITORIAL DES MODULES
 * ======================================================= */

/**
 * Important :
 * Ces textes sont des amorces rédactionnelles professionnelles.
 *
 * Ils ne prétendent pas être les résultats réels d'une recherche.
 * Les données, observations, résultats statistiques, références
 * scientifiques et conclusions spécifiques doivent provenir du projet.
 */

function buildCoverContent(report) {
    return [];
}

function buildDedicationContent() {
    return [
        createParagraph(
            "Cette page est réservée à la dédicace de l'auteur."
        ),
    ];
}

function buildAcknowledgementsContent(report) {
    const context = getInstitutionContext(report);

    const paragraph = context
        ? `L'auteur exprime sa reconnaissance à l'ensemble des personnes et institutions ayant contribué à la réalisation de ce travail, notamment dans le cadre de ${context}.`
        : "L'auteur exprime sa reconnaissance à l'ensemble des personnes et institutions ayant contribué à la réalisation de ce travail.";

    return [
        createParagraph(paragraph),
        createParagraph(
            "Les contributions scientifiques, pédagogiques, techniques et personnelles pourront être précisées ici avant la version définitive du document."
        ),
    ];
}

function buildAbstractContent(report) {
    const field = report.scientificField
        ? ` dans le domaine ${report.scientificField}`
        : "";

    const study = report.studyType
        ? ` selon une approche ${report.studyType}`
        : "";

    return [
        createParagraph(
            `Ce travail porte sur « ${escapeHtml(report.title || "le sujet de recherche")} »${field}${study}.`
        ),
        createParagraph(
            "Le résumé définitif doit présenter de manière synthétique le contexte de l'étude, la problématique, les objectifs, la méthodologie employée, les principaux résultats obtenus et les conclusions qui en découlent."
        ),
        createParagraph(
            "Les informations scientifiques définitives doivent être renseignées à partir du travail effectivement réalisé et des données disponibles."
        ),
    ];
}

function buildSecondAbstractContent(report) {
    return [
        createParagraph(
            `This work focuses on “${escapeHtml(report.title || "the research topic")}”.`
        ),
        createParagraph(
            "The final abstract should summarize the research context, problem statement, objectives, methodology, main findings and conclusions."
        ),
    ];
}

function buildIntroductionContent(report) {
    const field = report.scientificField
        ? ` dans le domaine de ${report.scientificField}`
        : "";

    return [
        createParagraph(
            `Le présent travail s'inscrit${field}. Il vise à étudier de manière structurée la question définie par l'auteur et à présenter les différentes étapes de la démarche scientifique retenue.`
        ),
        createParagraph(
            "L'introduction définit le contexte général du travail, présente le sujet étudié et situe la recherche dans son environnement scientifique, professionnel ou institutionnel."
        ),
        createParagraph(
            "Elle conduit progressivement vers la problématique, les questions de recherche, les objectifs et, lorsque cela est pertinent, les hypothèses formulées pour guider l'étude."
        ),
    ];
}

function buildProblemStatementContent(report) {
    return [
        createParagraph(
            `La problématique de ce travail doit être formulée à partir du contexte réel de l'étude et des connaissances disponibles sur le sujet « ${escapeHtml(report.title || "sujet étudié")} ».`
        ),
        createParagraph(
            "Cette section présente le problème observé, ses manifestations, ses enjeux et les limites des connaissances ou pratiques existantes qui justifient la réalisation de l'étude."
        ),
        createParagraph(
            "La formulation définitive doit être étayée par des sources scientifiques, institutionnelles ou professionnelles pertinentes."
        ),
    ];
}

function buildResearchQuestionsContent() {
    return [
        createParagraph(
            "Les questions de recherche traduisent la problématique en interrogations précises auxquelles l'étude cherche à apporter une réponse."
        ),
        createList(
            [
                "Question principale de recherche.",
                "Question secondaire de recherche.",
                "Question complémentaire lorsque cela est nécessaire.",
            ]
        ),
    ];
}

function buildObjectivesContent() {
    return [
        createParagraph(
            "Les objectifs définissent les résultats scientifiques ou opérationnels que l'étude cherche à atteindre."
        ),
        createHeading("Objectif général", 3),
        createParagraph(
            "L'objectif général doit exprimer de manière précise la finalité principale du travail."
        ),
        createHeading("Objectifs spécifiques", 3),
        createList(
            [
                "Objectif spécifique 1.",
                "Objectif spécifique 2.",
                "Objectif spécifique 3.",
            ],
            { ordered: true }
        ),
    ];
}

function buildHypothesesContent() {
    return [
        createParagraph(
            "Les hypothèses constituent des propositions provisoires formulées pour orienter l'analyse et être confrontées aux données recueillies."
        ),
        createList(
            [
                "Hypothèse principale.",
                "Hypothèse secondaire.",
            ],
            { ordered: true }
        ),
    ];
}

function buildLiteratureReviewContent(report) {
    const field = report.scientificField
        ? ` dans le domaine ${report.scientificField}`
        : "";

    return [
        createParagraph(
            `La revue de littérature rassemble et analyse les travaux scientifiques pertinents${field}.`
        ),
        createParagraph(
            "Elle doit identifier les principaux concepts, théories, méthodes et résultats déjà établis, puis mettre en évidence les convergences, divergences et limites de la littérature existante."
        ),
        createParagraph(
            "La version définitive de cette partie doit être construite à partir de références effectivement consultées et vérifiables."
        ),
    ];
}

function buildTheoreticalFrameworkContent() {
    return [
        createParagraph(
            "Le cadre théorique présente les théories et concepts scientifiques utilisés pour analyser le phénomène étudié."
        ),
        createParagraph(
            "Chaque théorie retenue doit être définie, contextualisée et reliée explicitement à la problématique et aux objectifs de la recherche."
        ),
    ];
}

function buildConceptualFrameworkContent() {
    return [
        createParagraph(
            "Le cadre conceptuel précise les concepts centraux de l'étude ainsi que les relations envisagées entre eux."
        ),
        createParagraph(
            "Il permet de représenter de manière structurée les dimensions étudiées et de relier le cadre théorique aux variables ou catégories effectivement mobilisées dans la recherche."
        ),
    ];
}

/* =========================================================
 * 6. MÉTHODOLOGIE
 * ======================================================= */

function buildMethodologyContent(report) {
    const context = getStudyContext(report);

    return [
        createParagraph(
            `Cette partie présente la démarche méthodologique retenue pour réaliser l'étude${context ? ` (${escapeHtml(context)})` : ""}.`
        ),
        createParagraph(
            "Elle décrit de manière suffisamment précise les choix de recherche afin de permettre au lecteur de comprendre comment les données ont été obtenues, traitées et analysées."
        ),
        createParagraph(
            "Les informations spécifiques relatives au terrain, aux participants, aux instruments, aux procédures et aux traitements doivent correspondre aux opérations réellement réalisées."
        ),
    ];
}

function buildResearchDesignContent() {
    return [
        createParagraph(
            "Le design de recherche précise l'organisation générale de l'étude et la logique méthodologique suivie pour répondre aux questions de recherche."
        ),
    ];
}

function buildStudyPopulationContent() {
    return [
        createParagraph(
            "Cette section décrit la population concernée par l'étude, les critères d'inclusion et d'exclusion ainsi que, lorsque cela est applicable, la méthode d'échantillonnage."
        ),
    ];
}

function buildDataCollectionContent() {
    return [
        createParagraph(
            "Cette section présente les techniques et instruments utilisés pour recueillir les données, ainsi que les conditions et étapes de leur administration."
        ),
    ];
}

function buildDataAnalysisContent() {
    return [
        createParagraph(
            "Cette section décrit les méthodes utilisées pour organiser, traiter, analyser et interpréter les données recueillies."
        ),
    ];
}

function buildQuantitativeMethodologyContent() {
    return [
        createParagraph(
            "L'approche quantitative repose sur la mesure et l'analyse structurée des variables définies dans le protocole de recherche."
        ),
        createEquation({
            id: "quantitative-descriptive-statistics",
            number: "",
            latex: "\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i",
            title: "Moyenne arithmétique",
            description:
                "Expression générale de la moyenne arithmétique, lorsque cette mesure est pertinente pour l'analyse.",
        }),
    ];
}

function buildQualitativeMethodologyContent() {
    return [
        createParagraph(
            "L'approche qualitative vise à comprendre les phénomènes étudiés à partir des discours, expériences, pratiques ou observations recueillis sur le terrain."
        ),
    ];
}

function buildMixedMethodologyContent() {
    return [
        createParagraph(
            "L'approche mixte articule des méthodes quantitatives et qualitatives selon une stratégie définie par le protocole de recherche."
        ),
    ];
}

function buildExperimentalMethodologyContent() {
    return [
        createParagraph(
            "La méthodologie expérimentale décrit les conditions de l'expérience, les variables étudiées, les groupes concernés, les procédures appliquées et les modalités d'analyse."
        ),
    ];
}

function buildCaseStudyMethodologyContent() {
    return [
        createParagraph(
            "L'étude de cas analyse de manière approfondie une unité d'étude définie, en mobilisant les données et sources nécessaires à sa compréhension."
        ),
    ];
}

function buildEthicsContent() {
    return [
        createParagraph(
            "Cette section présente les considérations éthiques applicables à l'étude, notamment l'information des participants, le consentement, la confidentialité, la protection des données et les autorisations nécessaires."
        ),
    ];
}

/* =========================================================
 * 7. RÉSULTATS
 * ======================================================= */

function buildResultsContent(report) {
    return [
        createParagraph(
            "Cette partie présente les résultats effectivement obtenus à partir des données collectées et des méthodes d'analyse définies dans le protocole."
        ),
        createParagraph(
            "Les résultats doivent être organisés selon les questions de recherche, les objectifs ou les hypothèses afin de faciliter leur lecture et leur interprétation."
        ),
        createParagraph(
            "Les valeurs numériques, observations, mesures et conclusions statistiques ne doivent être insérées qu'à partir des données réelles de l'étude."
        ),
    ];
}

/* =========================================================
 * 8. DISCUSSION
 * ======================================================= */

function buildDiscussionContent() {
    return [
        createParagraph(
            "La discussion interprète les résultats obtenus en les mettant en relation avec la problématique, les objectifs, les hypothèses et les travaux antérieurs."
        ),
        createParagraph(
            "Elle permet notamment d'identifier les convergences et divergences avec la littérature, de discuter les implications des résultats et de présenter les limites de l'étude."
        ),
    ];
}

/* =========================================================
 * 9. CONCLUSION
 * ======================================================= */

function buildConclusionContent() {
    return [
        createParagraph(
            "La conclusion synthétise les principaux enseignements du travail et répond de manière structurée à la problématique et aux objectifs annoncés."
        ),
        createParagraph(
            "Elle peut également présenter les limites principales de l'étude ainsi que les perspectives de recherche ou d'application qui découlent des résultats effectivement obtenus."
        ),
    ];
}

/* =========================================================
 * 10. RÉFÉRENCES
 * ======================================================= */

function buildReferencesContent(report) {
    const style = report.citationStyle
        ? ` selon le style ${escapeHtml(report.citationStyle)}`
        : "";

    return [
        createParagraph(
            `La bibliographie doit regrouper l'ensemble des sources effectivement citées dans le document${style}.`
        ),
        createParagraph(
            "Les références doivent être complètes, cohérentes et vérifiables. Elles pourront être générées ou importées depuis les références réellement utilisées par l'auteur."
        ),
    ];
}

/* =========================================================
 * 11. ANNEXES
 * ======================================================= */

function buildAppendicesContent() {
    return [
        createParagraph(
            "Les annexes regroupent les documents complémentaires nécessaires à la compréhension ou à la vérification du travail."
        ),
        createList(
            [
                "Instrument de collecte.",
                "Documents complémentaires.",
                "Tableaux détaillés.",
                "Résultats complémentaires.",
                "Documents techniques ou institutionnels.",
            ]
        ),
    ];
}

/* =========================================================
 * 12. LISTES ET ÉLÉMENTS PRÉLIMINAIRES
 * ======================================================= */

function buildTableOfContentsContent() {
    return [];
}

function buildListOfFiguresContent() {
    return [];
}

function buildListOfTablesContent() {
    return [];
}

function buildAbbreviationsContent() {
    return [
        createParagraph(
            "Cette liste présente les abréviations et sigles utilisés dans le document."
        ),
    ];
}

function buildGlossaryContent() {
    return [
        createParagraph(
            "Le glossaire définit les principaux termes techniques ou spécialisés nécessaires à la compréhension du document."
        ),
    ];
}

/* =========================================================
 * 13. VISUALISATIONS STRUCTURÉES
 * ======================================================= */

/**
 * Schéma générique de structure documentaire.
 *
 * Ce n'est pas un résultat scientifique.
 * Il sert uniquement lorsque le document doit présenter
 * graphiquement l'organisation d'un modèle conceptuel ou
 * méthodologique et pourra être remplacé par le vrai schéma.
 */

function buildGenericResearchSchema(report) {
    const field = escapeHtml(
        report.scientificField || "Domaine de recherche"
    );

    const html = `
        <div class="macevo-schema macevo-schema-research">
            <div class="macevo-schema-node macevo-schema-node-primary">
                Problématique
            </div>

            <div class="macevo-schema-arrow">↓</div>

            <div class="macevo-schema-node">
                Questions de recherche
            </div>

            <div class="macevo-schema-arrow">↓</div>

            <div class="macevo-schema-node">
                Méthodologie
            </div>

            <div class="macevo-schema-arrow">↓</div>

            <div class="macevo-schema-node">
                Données et analyse
            </div>

            <div class="macevo-schema-arrow">↓</div>

            <div class="macevo-schema-node macevo-schema-node-result">
                Résultats
            </div>

            <div class="macevo-schema-domain">
                ${field}
            </div>
        </div>
    `;

    return createSchema({
        id: "research-methodology-schema",
        title: "Organisation générale de la démarche de recherche",
        caption:
            "Schéma général de la démarche de recherche",
        html,
    });
}

/* =========================================================
 * 14. ROUTAGE DES MODULES
 * ======================================================= */

function getModuleBuilder(moduleId) {
    const builders = {
        "cover-page": buildCoverContent,
        dedication: buildDedicationContent,
        acknowledgements: buildAcknowledgementsContent,
        abstract: buildAbstractContent,
        "abstract-second-language": buildSecondAbstractContent,

        "table-of-contents": buildTableOfContentsContent,
        "list-of-figures": buildListOfFiguresContent,
        "list-of-tables": buildListOfTablesContent,

        abbreviations: buildAbbreviationsContent,
        glossary: buildGlossaryContent,

        introduction: buildIntroductionContent,
        "problem-statement": buildProblemStatementContent,
        "research-questions": buildResearchQuestionsContent,
        objectives: buildObjectivesContent,
        hypotheses: buildHypothesesContent,

        "literature-review": buildLiteratureReviewContent,
        "theoretical-framework": buildTheoreticalFrameworkContent,
        "conceptual-framework": buildConceptualFrameworkContent,

        methodology: buildMethodologyContent,
        "research-design": buildResearchDesignContent,
        "study-population": buildStudyPopulationContent,
        "data-collection": buildDataCollectionContent,
        "data-analysis": buildDataAnalysisContent,

        "quantitative-methodology":
            buildQuantitativeMethodologyContent,

        "qualitative-methodology":
            buildQualitativeMethodologyContent,

        "mixed-methodology":
            buildMixedMethodologyContent,

        "experimental-methodology":
            buildExperimentalMethodologyContent,

        "case-study-methodology":
            buildCaseStudyMethodologyContent,

        ethics: buildEthicsContent,

        results: buildResultsContent,
        discussion: buildDiscussionContent,
        conclusion: buildConclusionContent,
        references: buildReferencesContent,
        appendices: buildAppendicesContent,
    };

    return builders[moduleId] || null;
}

/* =========================================================
 * 15. FONCTION PRINCIPALE
 * ======================================================= */

function buildAcademicModuleContent(
    node = {},
    report = {},
    number = ""
) {
    const normalizedReport = normalizeReport(report);

    const moduleId = normalizeId(
        node.id ||
        node.moduleId ||
        node.type
    );

    const builder = getModuleBuilder(moduleId);

    if (!builder) {
        return [
            createParagraph(
                "Cette section est prête à recevoir le contenu correspondant aux données et sources du travail."
            ),
        ];
    }

    const content = builder(normalizedReport, node, number);

    return normalizeArray(content).filter(Boolean);
}

/**
 * Alias conservé pour compatibilité avec d'anciens imports.
 */
function createContent(
    moduleIdOrNode,
    report = {},
    options = {}
) {
    if (
        moduleIdOrNode &&
        typeof moduleIdOrNode === "object"
    ) {
        return buildAcademicModuleContent(
            moduleIdOrNode,
            report,
            options.number || ""
        );
    }

    return buildAcademicModuleContent(
        {
            id: moduleIdOrNode,
        },
        report,
        options.number || ""
    );
}

/* =========================================================
 * 16. EXTRACTION DES ÉLÉMENTS VISUELS
 * ======================================================= */

function collectVisualElements(content = []) {
    const result = {
        figures: [],
        tables: [],
        schemas: [],
        equations: [],
        references: [],
    };

    function walk(elements) {
        for (const element of normalizeArray(elements)) {
            if (!element || typeof element !== "object") {
                continue;
            }

            switch (element.type) {
                case "figure":
                    result.figures.push(element);
                    break;

                case "table":
                    result.tables.push(element);
                    break;

                case "schema":
                    result.schemas.push(element);
                    break;

                case "equation":
                    result.equations.push(element);
                    break;

                case "reference":
                    result.references.push(element);
                    break;

                default:
                    break;
            }

            if (Array.isArray(element.children)) {
                walk(element.children);
            }

            if (Array.isArray(element.content)) {
                walk(element.content);
            }
        }
    }

    walk(content);

    return result;
}

/* =========================================================
 * 17. NUMÉROTATION DES ÉLÉMENTS VISUELS
 * ======================================================= */

function numberVisualElements(content = [], chapterNumber = "") {
    const counters = {
        figure: 0,
        table: 0,
        schema: 0,
        equation: 0,
    };

    function walk(elements) {
        return normalizeArray(elements).map(element => {
            if (!element || typeof element !== "object") {
                return element;
            }

            const copy = {
                ...element,
            };

            if (copy.type === "figure") {
                counters.figure += 1;

                copy.number = chapterNumber
                    ? `Figure ${chapterNumber}.${counters.figure}`
                    : `Figure ${counters.figure}`;
            }

            if (copy.type === "table") {
                counters.table += 1;

                copy.number = chapterNumber
                    ? `Tableau ${chapterNumber}.${counters.table}`
                    : `Tableau ${counters.table}`;
            }

            if (copy.type === "schema") {
                counters.schema += 1;

                copy.number = chapterNumber
                    ? `Schéma ${chapterNumber}.${counters.schema}`
                    : `Schéma ${counters.schema}`;
            }

            if (copy.type === "equation") {
                counters.equation += 1;

                copy.number = chapterNumber
                    ? `(${chapterNumber}.${counters.equation})`
                    : `(${counters.equation})`;
            }

            if (Array.isArray(copy.children)) {
                copy.children = walk(copy.children);
            }

            if (Array.isArray(copy.content)) {
                copy.content = walk(copy.content);
            }

            return copy;
        });
    }

    return walk(content);
}

/* =========================================================
 * 18. VALIDATION
 * ======================================================= */

function validateContentElements(content = []) {
    const errors = [];

    if (!Array.isArray(content)) {
        return {
            valid: false,
            errors: [
                "Le contenu du module doit être un tableau.",
            ],
        };
    }

    content.forEach((element, index) => {
        if (!element || typeof element !== "object") {
            errors.push(
                `Élément ${index + 1} : élément invalide.`
            );

            return;
        }

        if (!clean(element.type)) {
            errors.push(
                `Élément ${index + 1} : type manquant.`
            );
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/* =========================================================
 * 19. EXPORTS
 * ======================================================= */

export {
    normalizeReport,

    createParagraph,
    createHeading,
    createList,
    createTable,
    createFigure,
    createSchema,
    createEquation,
    createReference,
    createSection,

    buildAcademicModuleContent,
    createContent,

    collectVisualElements,
    numberVisualElements,
    validateContentElements,

    escapeHtml,
    escapeHtmlAttribute,
    slugify,
};

export default buildAcademicModuleContent;