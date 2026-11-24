/**
 * ============================================================
 * MACEVO
 * ------------------------------------------------------------
 * Fichier : scientificTemplates.js
 * Description :
 * Moteur central des modèles académiques et scientifiques MACEVO.
 *
 * Version : 1.0.0
 * Statut  : Stable
 *
 * ------------------------------------------------------------
 * OBJECTIF
 * ------------------------------------------------------------
 *
 * Ce fichier transforme un identifiant de modèle MACEVO en
 * document TipTap structuré et immédiatement modifiable.
 *
 * Exemples :
 *
 *   memoire-licence
 *   rapport-stage
 *   article-scientifique
 *   projet-fin-etudes
 *   these-doctorat
 *   rapport-technique
 *   etude-cas
 *   notes-cours
 *
 * Le document produit contient :
 *
 * - page de garde ;
 * - pages préliminaires ;
 * - résumé ;
 * - abstract ;
 * - sommaire ;
 * - chapitres ;
 * - sections ;
 * - sous-sections ;
 * - conclusion ;
 * - bibliographie ;
 * - annexes.
 *
 * ============================================================
 */


/* ============================================================
   CONSTANTES
============================================================ */

export const TEMPLATE_IDS = {
    MEMOIRE_LICENCE: "memoire-licence",
    RAPPORT_STAGE: "rapport-stage",
    ARTICLE_SCIENTIFIQUE: "article-scientifique",
    PROJET_FIN_ETUDES: "projet-fin-etudes",
    THESE_DOCTORAT: "these-doctorat",
    RAPPORT_TECHNIQUE: "rapport-technique",
    ETUDE_CAS: "etude-cas",
    NOTES_COURS: "notes-cours",
};


/* ============================================================
   OUTILS TIPTAP
============================================================ */

const textNode = (text = "", marks = []) => ({
    type: "text",
    text,
    ...(marks.length > 0 ? { marks } : {}),
});


const paragraph = (
    text = "",
    options = {}
) => {
    const {
        bold = false,
        italic = false,
        align = null,
    } = options;

    const marks = [];

    if (bold) {
        marks.push({ type: "bold" });
    }

    if (italic) {
        marks.push({ type: "italic" });
    }

    const node = {
        type: "paragraph",
        content: text
            ? [
                  textNode(text, marks),
              ]
            : [],
    };

    if (align) {
        node.attrs = {
            textAlign: align,
        };
    }

    return node;
};


const richParagraph = (
    parts = [],
    align = null
) => {
    const node = {
        type: "paragraph",

        content: parts.map((part) => {
            const marks = [];

            if (part.bold) {
                marks.push({ type: "bold" });
            }

            if (part.italic) {
                marks.push({ type: "italic" });
            }

            return textNode(
                part.text || "",
                marks
            );
        }),
    };

    if (align) {
        node.attrs = {
            textAlign: align,
        };
    }

    return node;
};


const heading = (
    text,
    level = 1,
    align = null
) => {
    const node = {
        type: "heading",

        attrs: {
            level,
        },

        content: [
            textNode(text),
        ],
    };

    if (align) {
        node.attrs.textAlign = align;
    }

    return node;
};


const emptyParagraphs = (
    count = 1
) => {
    return Array.from(
        { length: count },
        () => paragraph("")
    );
};


/* ============================================================
   SAUT DE SECTION
============================================================ */

/**
 * Ce marqueur est volontairement simple.
 *
 * Lorsque ton EditorContext sera branché dessus,
 * nous pourrons remplacer ce séparateur par ton vrai
 * node TipTap de saut de page si ton extension de pagination
 * en possède déjà un.
 */

const pageSeparator = () => ({
    type: "horizontalRule",
});


const newPage = () => [
    paragraph(""),
    pageSeparator(),
    paragraph(""),
];


/* ============================================================
   TEXTES D'AIDE
============================================================ */

const placeholder = (text) =>
    `[${text}]`;


/* ============================================================
   PAGE DE GARDE ACADÉMIQUE
============================================================ */

const academicCover = ({
    university = "UNIVERSITÉ / ÉTABLISSEMENT",
    faculty = "FACULTÉ / ÉCOLE / INSTITUT",
    department = "DÉPARTEMENT / FILIÈRE",
    degree = "MÉMOIRE",
    speciality = "",
    title = "TITRE DU TRAVAIL SCIENTIFIQUE",
    author = "Nom et prénom de l'étudiant",
    supervisor = "Nom et grade de l'encadreur",
    academicYear = "2026 – 2027",
}) => [
    ...emptyParagraphs(2),

    paragraph(
        university,
        {
            bold: true,
            align: "center",
        }
    ),

    paragraph(
        faculty,
        {
            bold: true,
            align: "center",
        }
    ),

    paragraph(
        department,
        {
            align: "center",
        }
    ),

    ...emptyParagraphs(3),

    heading(
        degree,
        1,
        "center"
    ),

    speciality
        ? paragraph(
              speciality,
              {
                  bold: true,
                  align: "center",
              }
          )
        : paragraph(""),

    ...emptyParagraphs(2),

    heading(
        title,
        2,
        "center"
    ),

    ...emptyParagraphs(3),

    paragraph(
        "Présenté par",
        {
            align: "center",
        }
    ),

    paragraph(
        author,
        {
            bold: true,
            align: "center",
        }
    ),

    ...emptyParagraphs(2),

    paragraph(
        "Sous la direction de",
        {
            align: "center",
        }
    ),

    paragraph(
        supervisor,
        {
            bold: true,
            align: "center",
        }
    ),

    ...emptyParagraphs(3),

    paragraph(
        `Année académique ${academicYear}`,
        {
            bold: true,
            align: "center",
        }
    ),
];


/* ============================================================
   PAGE DE DÉDICACE
============================================================ */

const dedicationPage = () => [
    heading(
        "DÉDICACE",
        1,
        "center"
    ),

    ...emptyParagraphs(4),

    paragraph(
        placeholder(
            "Rédigez ici votre dédicace."
        ),
        {
            italic: true,
            align: "center",
        }
    ),

    ...emptyParagraphs(3),

    paragraph(
        "Exemple : À mes parents, à ma famille et à toutes les personnes qui m'ont accompagné dans mon parcours académique.",
        {
            italic: true,
            align: "center",
        }
    ),
];


/* ============================================================
   REMERCIEMENTS
============================================================ */

const acknowledgementsPage = () => [
    heading(
        "REMERCIEMENTS",
        1,
        "center"
    ),

    ...emptyParagraphs(2),

    paragraph(
        placeholder(
            "Présentez vos remerciements de manière académique."
        )
    ),

    paragraph(
        "Vous pouvez notamment remercier votre encadreur scientifique, les enseignants, les responsables du laboratoire ou de l'institution, les membres du jury, les collaborateurs et les personnes ayant contribué à la réalisation du travail."
    ),

    paragraph(
        placeholder(
            "Remplacez ce texte par vos remerciements."
        )
    ),
];


/* ============================================================
   RÉSUMÉ
============================================================ */

const resumePage = () => [
    heading(
        "RÉSUMÉ",
        1,
        "center"
    ),

    ...emptyParagraphs(2),

    paragraph(
        placeholder(
            "Présentez en un texte concis le contexte de l'étude, la problématique, l'objectif principal, la méthodologie utilisée, les résultats majeurs et la conclusion essentielle."
        )
    ),

    ...emptyParagraphs(2),

    richParagraph([
        {
            text: "Mots-clés : ",
            bold: true,
        },
        {
            text:
                placeholder(
                    "mot-clé 1 ; mot-clé 2 ; mot-clé 3 ; mot-clé 4 ; mot-clé 5"
                ),
        },
    ]),
];


/* ============================================================
   ABSTRACT
============================================================ */

const abstractPage = () => [
    heading(
        "ABSTRACT",
        1,
        "center"
    ),

    ...emptyParagraphs(2),

    paragraph(
        placeholder(
            "Write here the English version of the abstract: context, research problem, objective, methodology, main results and conclusion."
        )
    ),

    ...emptyParagraphs(2),

    richParagraph([
        {
            text: "Keywords: ",
            bold: true,
        },
        {
            text:
                placeholder(
                    "keyword 1; keyword 2; keyword 3; keyword 4; keyword 5"
                ),
        },
    ]),
];


/* ============================================================
   LISTES
============================================================ */

const figuresPage = () => [
    heading(
        "LISTE DES FIGURES",
        1,
        "center"
    ),

    ...emptyParagraphs(2),

    paragraph(
        "Figure 1 — "
        + placeholder(
            "Titre de la figure"
        )
    ),

    paragraph(
        "Figure 2 — "
        + placeholder(
            "Titre de la figure"
        )
    ),
];


const tablesPage = () => [
    heading(
        "LISTE DES TABLEAUX",
        1,
        "center"
    ),

    ...emptyParagraphs(2),

    paragraph(
        "Tableau 1 — "
        + placeholder(
            "Titre du tableau"
        )
    ),

    paragraph(
        "Tableau 2 — "
        + placeholder(
            "Titre du tableau"
        )
    ),
];


const abbreviationsPage = () => [
    heading(
        "LISTE DES SIGLES ET ABRÉVIATIONS",
        1,
        "center"
    ),

    ...emptyParagraphs(2),

    paragraph(
        "IA — Intelligence artificielle"
    ),

    paragraph(
        placeholder(
            "Ajoutez ici les autres sigles et abréviations utilisés dans le document."
        )
    ),
];


/* ============================================================
   TABLE DES MATIÈRES
============================================================ */

const contentsPage = (
    entries = []
) => [
    heading(
        "TABLE DES MATIÈRES",
        1,
        "center"
    ),

    ...emptyParagraphs(2),

    ...entries.map(
        (entry) =>
            paragraph(entry)
    ),

    ...emptyParagraphs(2),

    paragraph(
        "La table des matières pourra être mise à jour automatiquement à partir des styles Titre 1, Titre 2 et Titre 3."
    ),
];


/* ============================================================
   INTRODUCTION SCIENTIFIQUE
============================================================ */

const generalIntroduction = () => [
    heading(
        "INTRODUCTION GÉNÉRALE",
        1
    ),

    ...emptyParagraphs(1),

    heading(
        "Contexte de l'étude",
        2
    ),

    paragraph(
        placeholder(
            "Présentez le contexte scientifique, académique, social, technologique ou professionnel dans lequel s'inscrit votre étude."
        )
    ),

    heading(
        "Problématique",
        2
    ),

    paragraph(
        placeholder(
            "Exposez clairement le problème scientifique ou pratique auquel le travail cherche à répondre."
        )
    ),

    heading(
        "Question de recherche",
        2
    ),

    paragraph(
        placeholder(
            "Formulez la question principale de recherche."
        )
    ),

    heading(
        "Objectif général",
        2
    ),

    paragraph(
        placeholder(
            "Indiquez l'objectif général du travail."
        )
    ),

    heading(
        "Objectifs spécifiques",
        2
    ),

    paragraph(
        "1. "
        + placeholder(
            "Premier objectif spécifique."
        )
    ),

    paragraph(
        "2. "
        + placeholder(
            "Deuxième objectif spécifique."
        )
    ),

    paragraph(
        "3. "
        + placeholder(
            "Troisième objectif spécifique."
        )
    ),

    heading(
        "Hypothèses de recherche",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les hypothèses lorsque la méthodologie de recherche l'exige."
        )
    ),

    heading(
        "Intérêt de l'étude",
        2
    ),

    paragraph(
        placeholder(
            "Expliquez les contributions scientifiques, méthodologiques, technologiques ou socio-économiques attendues."
        )
    ),

    heading(
        "Organisation du document",
        2
    ),

    paragraph(
        placeholder(
            "Présentez brièvement le contenu des différents chapitres."
        )
    ),
];


/* ============================================================
   CHAPITRE : REVUE DE LITTÉRATURE
============================================================ */

const literatureReview = () => [
    heading(
        "CHAPITRE I — REVUE DE LITTÉRATURE ET CADRE THÉORIQUE",
        1
    ),

    heading(
        "1.1 Introduction",
        2
    ),

    paragraph(
        placeholder(
            "Présentez l'objectif du chapitre et son organisation."
        )
    ),

    heading(
        "1.2 Concepts fondamentaux",
        2
    ),

    paragraph(
        placeholder(
            "Définissez les principaux concepts mobilisés dans le travail."
        )
    ),

    heading(
        "1.3 Fondements théoriques",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les théories, modèles ou cadres conceptuels pertinents."
        )
    ),

    heading(
        "1.4 État de l'art",
        2
    ),

    paragraph(
        placeholder(
            "Analysez les travaux scientifiques antérieurs en mettant en évidence leurs méthodes, résultats, limites et contributions."
        )
    ),

    heading(
        "1.5 Analyse critique de la littérature",
        2
    ),

    paragraph(
        placeholder(
            "Comparez les approches existantes et identifiez les insuffisances qui justifient votre étude."
        )
    ),

    heading(
        "1.6 Synthèse du chapitre",
        2
    ),

    paragraph(
        placeholder(
            "Résumez les principaux enseignements du chapitre."
        )
    ),
];


/* ============================================================
   CHAPITRE : MÉTHODOLOGIE
============================================================ */

const methodologyChapter = () => [
    heading(
        "CHAPITRE II — MATÉRIELS ET MÉTHODES",
        1
    ),

    heading(
        "2.1 Introduction",
        2
    ),

    paragraph(
        placeholder(
            "Présentez l'approche méthodologique générale."
        )
    ),

    heading(
        "2.2 Type et conception de l'étude",
        2
    ),

    paragraph(
        placeholder(
            "Précisez le type d'étude : expérimentale, descriptive, analytique, qualitative, quantitative, mixte, simulation, conception informatique, etc."
        )
    ),

    heading(
        "2.3 Cadre de l'étude",
        2
    ),

    paragraph(
        placeholder(
            "Présentez le lieu, l'environnement, le laboratoire, l'entreprise ou la population concernée."
        )
    ),

    heading(
        "2.4 Population et échantillonnage",
        2
    ),

    paragraph(
        placeholder(
            "Décrivez la population étudiée, les critères d'inclusion/exclusion et la méthode d'échantillonnage lorsque cela s'applique."
        )
    ),

    heading(
        "2.5 Matériels et outils",
        2
    ),

    paragraph(
        placeholder(
            "Présentez le matériel, les logiciels, instruments, bases de données, équipements ou technologies utilisés."
        )
    ),

    heading(
        "2.6 Méthodes de collecte des données",
        2
    ),

    paragraph(
        placeholder(
            "Expliquez précisément les procédures de collecte."
        )
    ),

    heading(
        "2.7 Méthodes d'analyse",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les analyses statistiques, mathématiques, informatiques, qualitatives ou expérimentales utilisées."
        )
    ),

    heading(
        "2.8 Considérations éthiques",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les considérations éthiques lorsque l'étude implique des participants, données personnelles ou expérimentations."
        )
    ),

    heading(
        "2.9 Synthèse du chapitre",
        2
    ),

    paragraph(
        placeholder(
            "Résumez la méthodologie employée."
        )
    ),
];


/* ============================================================
   CHAPITRE : RÉSULTATS
============================================================ */

const resultsChapter = () => [
    heading(
        "CHAPITRE III — RÉSULTATS",
        1
    ),

    heading(
        "3.1 Introduction",
        2
    ),

    paragraph(
        placeholder(
            "Présentez brièvement l'organisation des résultats."
        )
    ),

    heading(
        "3.2 Résultats descriptifs",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les premières observations, mesures, caractéristiques ou statistiques descriptives."
        )
    ),

    heading(
        "3.3 Résultats principaux",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les résultats correspondant directement aux objectifs ou hypothèses de recherche."
        )
    ),

    heading(
        "3.4 Tableaux, figures et graphiques",
        2
    ),

    paragraph(
        placeholder(
            "Insérez ici les tableaux, figures, graphiques, illustrations ou sorties expérimentales nécessaires."
        )
    ),

    heading(
        "3.5 Synthèse des résultats",
        2
    ),

    paragraph(
        placeholder(
            "Résumez les principaux résultats obtenus sans les interpréter excessivement."
        )
    ),
];


/* ============================================================
   CHAPITRE : DISCUSSION
============================================================ */

const discussionChapter = () => [
    heading(
        "CHAPITRE IV — DISCUSSION",
        1
    ),

    heading(
        "4.1 Introduction",
        2
    ),

    paragraph(
        placeholder(
            "Rappelez brièvement les résultats les plus importants."
        )
    ),

    heading(
        "4.2 Interprétation des résultats",
        2
    ),

    paragraph(
        placeholder(
            "Interprétez les résultats en lien avec les objectifs et les hypothèses."
        )
    ),

    heading(
        "4.3 Comparaison avec la littérature",
        2
    ),

    paragraph(
        placeholder(
            "Comparez vos résultats avec ceux des études antérieures."
        )
    ),

    heading(
        "4.4 Contributions de l'étude",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les contributions nouvelles de votre travail."
        )
    ),

    heading(
        "4.5 Limites de l'étude",
        2
    ),

    paragraph(
        placeholder(
            "Exposez les limites méthodologiques, expérimentales ou contextuelles."
        )
    ),

    heading(
        "4.6 Implications et perspectives",
        2
    ),

    paragraph(
        placeholder(
            "Présentez les implications pratiques, scientifiques et les pistes de recherche futures."
        )
    ),
];


/* ============================================================
   CONCLUSION GÉNÉRALE
============================================================ */

const conclusionPage = () => [
    heading(
        "CONCLUSION GÉNÉRALE",
        1
    ),

    ...emptyParagraphs(1),

    paragraph(
        placeholder(
            "Rappelez brièvement le contexte et la problématique du travail."
        )
    ),

    paragraph(
        placeholder(
            "Présentez les principaux résultats obtenus au regard des objectifs de recherche."
        )
    ),

    paragraph(
        placeholder(
            "Présentez la contribution principale de l'étude."
        )
    ),

    paragraph(
        placeholder(
            "Mentionnez les limites importantes."
        )
    ),

    paragraph(
        placeholder(
            "Terminez par les recommandations et perspectives de recherche."
        )
    ),
];


/* ============================================================
   BIBLIOGRAPHIE
============================================================ */

const bibliographyPage = () => [
    heading(
        "BIBLIOGRAPHIE",
        1
    ),

    ...emptyParagraphs(2),

    paragraph(
        placeholder(
            "Les références bibliographiques seront affichées ici selon le style sélectionné : APA, IEEE, Vancouver, Harvard, Chicago, etc."
        )
    ),

    paragraph(
        "Exemple APA : Auteur, A. A. (2026). Titre de l'article. Nom de la revue, volume(numéro), pages."
    ),

    paragraph(
        "Exemple IEEE : [1] A. Auteur, « Titre de l'article », Nom de la revue, vol. X, no. X, pp. XX–XX, 2026."
    ),
];


/* ============================================================
   ANNEXES
============================================================ */

const appendicesPage = () => [
    heading(
        "ANNEXES",
        1
    ),

    heading(
        "Annexe A",
        2
    ),

    paragraph(
        placeholder(
            "Questionnaire, code source, protocole expérimental, données supplémentaires, formulaire ou document complémentaire."
        )
    ),

    heading(
        "Annexe B",
        2
    ),

    paragraph(
        placeholder(
            "Autre document complémentaire."
        )
    ),
];


/* ============================================================
   MODÈLE MÉMOIRE LICENCE
============================================================ */

const buildLicenceMemory = () => ({
    type: "doc",

    content: [
        ...academicCover({
            degree:
                "MÉMOIRE DE LICENCE",

            speciality:
                "En vue de l'obtention du diplôme de Licence",

            title:
                "TITRE DU MÉMOIRE",

            academicYear:
                "2026 – 2027",
        }),

        ...newPage(),

        ...dedicationPage(),

        ...newPage(),

        ...acknowledgementsPage(),

        ...newPage(),

        ...resumePage(),

        ...newPage(),

        ...abstractPage(),

        ...newPage(),

        ...abbreviationsPage(),

        ...newPage(),

        ...figuresPage(),

        ...newPage(),

        ...tablesPage(),

        ...newPage(),

        ...contentsPage([
            "INTRODUCTION GÉNÉRALE",
            "CHAPITRE I — REVUE DE LITTÉRATURE ET CADRE THÉORIQUE",
            "CHAPITRE II — MATÉRIELS ET MÉTHODES",
            "CHAPITRE III — RÉSULTATS",
            "CHAPITRE IV — DISCUSSION",
            "CONCLUSION GÉNÉRALE",
            "BIBLIOGRAPHIE",
            "ANNEXES",
        ]),

        ...newPage(),

        ...generalIntroduction(),

        ...newPage(),

        ...literatureReview(),

        ...newPage(),

        ...methodologyChapter(),

        ...newPage(),

        ...resultsChapter(),

        ...newPage(),

        ...discussionChapter(),

        ...newPage(),

        ...conclusionPage(),

        ...newPage(),

        ...bibliographyPage(),

        ...newPage(),

        ...appendicesPage(),
    ],
});


/* ============================================================
   MODÈLE THÈSE DE DOCTORAT
============================================================ */

const buildDoctoralThesis = () => ({
    type: "doc",

    content: [
        ...academicCover({
            degree:
                "THÈSE DE DOCTORAT",

            speciality:
                "École doctorale • Discipline • Spécialité",

            title:
                "TITRE DE LA THÈSE",

            author:
                "Nom du doctorant",

            supervisor:
                "Directeur / Directrice de thèse",

            academicYear:
                "2026",
        }),

        ...newPage(),

        heading(
            "COMPOSITION DU JURY",
            1,
            "center"
        ),

        paragraph(
            "Président : "
            + placeholder(
                "Nom, grade et institution"
            )
        ),

        paragraph(
            "Rapporteur : "
            + placeholder(
                "Nom, grade et institution"
            )
        ),

        paragraph(
            "Rapporteur : "
            + placeholder(
                "Nom, grade et institution"
            )
        ),

        paragraph(
            "Examinateur : "
            + placeholder(
                "Nom, grade et institution"
            )
        ),

        paragraph(
            "Directeur de thèse : "
            + placeholder(
                "Nom, grade et institution"
            )
        ),

        ...newPage(),

        ...dedicationPage(),

        ...newPage(),

        ...acknowledgementsPage(),

        ...newPage(),

        ...resumePage(),

        ...newPage(),

        ...abstractPage(),

        ...newPage(),

        ...contentsPage([
            "INTRODUCTION GÉNÉRALE",
            "PARTIE I — ÉTAT DE L'ART ET FONDEMENTS THÉORIQUES",
            "CHAPITRE I — CONTEXTE SCIENTIFIQUE",
            "CHAPITRE II — ÉTAT DE L'ART",
            "PARTIE II — CONTRIBUTIONS SCIENTIFIQUES",
            "CHAPITRE III — MÉTHODOLOGIE",
            "CHAPITRE IV — PREMIÈRE CONTRIBUTION",
            "CHAPITRE V — DEUXIÈME CONTRIBUTION",
            "CHAPITRE VI — VALIDATION ET DISCUSSION",
            "CONCLUSION GÉNÉRALE",
            "BIBLIOGRAPHIE",
            "ANNEXES",
        ]),

        ...newPage(),

        ...generalIntroduction(),

        ...newPage(),

        heading(
            "PARTIE I — ÉTAT DE L'ART ET FONDEMENTS THÉORIQUES",
            1,
            "center"
        ),

        ...newPage(),

        heading(
            "CHAPITRE I — CONTEXTE SCIENTIFIQUE",
            1
        ),

        heading(
            "1.1 Domaine scientifique",
            2
        ),

        paragraph(
            placeholder(
                "Présentez le domaine scientifique dans lequel s'inscrit la thèse."
            )
        ),

        heading(
            "1.2 Concepts fondamentaux",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les concepts, théories et formalismes nécessaires à la compréhension du manuscrit."
            )
        ),

        heading(
            "1.3 Problèmes scientifiques ouverts",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les problèmes non résolus qui motivent la recherche."
            )
        ),

        ...newPage(),

        ...literatureReview(),

        ...newPage(),

        heading(
            "PARTIE II — CONTRIBUTIONS SCIENTIFIQUES",
            1,
            "center"
        ),

        ...newPage(),

        ...methodologyChapter(),

        ...newPage(),

        heading(
            "CHAPITRE IV — PREMIÈRE CONTRIBUTION SCIENTIFIQUE",
            1
        ),

        heading(
            "4.1 Introduction",
            2
        ),

        paragraph(
            placeholder(
                "Présentez le problème scientifique traité dans cette contribution."
            )
        ),

        heading(
            "4.2 Formulation du problème",
            2
        ),

        paragraph(
            placeholder(
                "Formulez mathématiquement, théoriquement ou expérimentalement le problème."
            )
        ),

        heading(
            "4.3 Méthode proposée",
            2
        ),

        paragraph(
            placeholder(
                "Décrivez votre contribution originale."
            )
        ),

        heading(
            "4.4 Résultats",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les résultats obtenus."
            )
        ),

        heading(
            "4.5 Discussion",
            2
        ),

        paragraph(
            placeholder(
                "Analysez les résultats et comparez-les aux travaux existants."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE V — DEUXIÈME CONTRIBUTION SCIENTIFIQUE",
            1
        ),

        heading(
            "5.1 Introduction",
            2
        ),

        paragraph(
            placeholder(
                "Présentez la deuxième contribution."
            )
        ),

        heading(
            "5.2 Approche proposée",
            2
        ),

        paragraph(
            placeholder(
                "Décrivez la méthode, démonstration, architecture, modèle ou protocole proposé."
            )
        ),

        heading(
            "5.3 Validation",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les expériences, preuves, simulations ou évaluations."
            )
        ),

        heading(
            "5.4 Analyse des résultats",
            2
        ),

        paragraph(
            placeholder(
                "Analysez les résultats."
            )
        ),

        ...newPage(),

        ...discussionChapter(),

        ...newPage(),

        ...conclusionPage(),

        ...newPage(),

        ...bibliographyPage(),

        ...newPage(),

        ...appendicesPage(),
    ],
});


/* ============================================================
   ARTICLE SCIENTIFIQUE IMRAD
============================================================ */

const buildScientificArticle = () => ({
    type: "doc",

    content: [
        heading(
            "TITRE DE L'ARTICLE SCIENTIFIQUE",
            1,
            "center"
        ),

        paragraph(
            placeholder(
                "Auteur 1, Auteur 2, Auteur 3"
            ),
            {
                align: "center",
            }
        ),

        paragraph(
            placeholder(
                "Affiliation institutionnelle • Département • Université"
            ),
            {
                italic: true,
                align: "center",
            }
        ),

        paragraph(
            placeholder(
                "Auteur correspondant : adresse e-mail"
            ),
            {
                align: "center",
            }
        ),

        ...emptyParagraphs(2),

        ...resumePage(),

        ...newPage(),

        heading(
            "1. INTRODUCTION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le contexte scientifique, la lacune dans la littérature, la problématique et l'objectif de l'étude."
            )
        ),

        heading(
            "2. MATÉRIELS ET MÉTHODES",
            1
        ),

        paragraph(
            placeholder(
                "Décrivez précisément les matériels, données, participants, protocoles, méthodes et analyses."
            )
        ),

        heading(
            "3. RÉSULTATS",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les résultats de manière objective à l'aide de textes, tableaux et figures."
            )
        ),

        heading(
            "4. DISCUSSION",
            1
        ),

        paragraph(
            placeholder(
                "Interprétez les résultats, comparez-les à la littérature et présentez leurs implications."
            )
        ),

        heading(
            "5. CONCLUSION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les conclusions principales et les perspectives."
            )
        ),

        heading(
            "DÉCLARATION DE CONFLITS D'INTÉRÊTS",
            1
        ),

        paragraph(
            placeholder(
                "Déclarez ici les éventuels conflits d'intérêts."
            )
        ),

        heading(
            "CONTRIBUTIONS DES AUTEURS",
            1
        ),

        paragraph(
            placeholder(
                "Décrivez les contributions des différents auteurs."
            )
        ),

        ...bibliographyPage(),
    ],
});


/* ============================================================
   RAPPORT DE STAGE
============================================================ */

const buildInternshipReport = () => ({
    type: "doc",

    content: [
        ...academicCover({
            degree:
                "RAPPORT DE STAGE",

            speciality:
                "Formation / Filière",

            title:
                "THÈME DU STAGE",

            supervisor:
                "Maître de stage / Encadreur académique",
        }),

        ...newPage(),

        ...dedicationPage(),

        ...newPage(),

        ...acknowledgementsPage(),

        ...newPage(),

        ...contentsPage([
            "INTRODUCTION",
            "CHAPITRE I — PRÉSENTATION DE LA STRUCTURE D'ACCUEIL",
            "CHAPITRE II — DÉROULEMENT DU STAGE",
            "CHAPITRE III — TRAVAUX RÉALISÉS",
            "CHAPITRE IV — BILAN ET COMPÉTENCES ACQUISES",
            "CONCLUSION",
            "BIBLIOGRAPHIE",
            "ANNEXES",
        ]),

        ...newPage(),

        heading(
            "INTRODUCTION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le contexte du stage, sa durée, la structure d'accueil, les objectifs et l'organisation du rapport."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE I — PRÉSENTATION DE LA STRUCTURE D'ACCUEIL",
            1
        ),

        heading(
            "1.1 Historique",
            2
        ),

        paragraph(
            placeholder(
                "Présentez l'historique de l'entreprise ou de l'institution."
            )
        ),

        heading(
            "1.2 Organisation",
            2
        ),

        paragraph(
            placeholder(
                "Présentez l'organisation générale et l'organigramme."
            )
        ),

        heading(
            "1.3 Service d'accueil",
            2
        ),

        paragraph(
            placeholder(
                "Présentez le service ou département dans lequel le stage a été effectué."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE II — DÉROULEMENT DU STAGE",
            1
        ),

        heading(
            "2.1 Objectifs du stage",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les objectifs assignés."
            )
        ),

        heading(
            "2.2 Missions effectuées",
            2
        ),

        paragraph(
            placeholder(
                "Décrivez les différentes missions réalisées."
            )
        ),

        heading(
            "2.3 Outils et méthodes",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les outils, logiciels, équipements ou méthodes utilisés."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE III — TRAVAUX RÉALISÉS",
            1
        ),

        paragraph(
            placeholder(
                "Présentez en détail les travaux, projets ou activités réalisés durant le stage."
            )
        ),

        heading(
            "3.1 Travail principal",
            2
        ),

        paragraph(
            placeholder(
                "Décrivez le travail principal."
            )
        ),

        heading(
            "3.2 Résultats obtenus",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les résultats obtenus."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE IV — BILAN DU STAGE",
            1
        ),

        heading(
            "4.1 Compétences acquises",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les compétences techniques, scientifiques et professionnelles acquises."
            )
        ),

        heading(
            "4.2 Difficultés rencontrées",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les difficultés rencontrées."
            )
        ),

        heading(
            "4.3 Solutions apportées",
            2
        ),

        paragraph(
            placeholder(
                "Expliquez les solutions apportées."
            )
        ),

        ...newPage(),

        heading(
            "CONCLUSION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le bilan général du stage et son apport pour votre formation."
            )
        ),

        ...newPage(),

        ...bibliographyPage(),

        ...newPage(),

        ...appendicesPage(),
    ],
});


/* ============================================================
   PROJET DE FIN D'ÉTUDES
============================================================ */

const buildFinalYearProject = () => ({
    type: "doc",

    content: [
        ...academicCover({
            degree:
                "PROJET DE FIN D'ÉTUDES",

            speciality:
                "Mémoire de Projet de Fin d'Études",

            title:
                "TITRE DU PROJET",
        }),

        ...newPage(),

        ...acknowledgementsPage(),

        ...newPage(),

        ...resumePage(),

        ...newPage(),

        ...abstractPage(),

        ...newPage(),

        ...contentsPage([
            "INTRODUCTION GÉNÉRALE",
            "CHAPITRE I — CONTEXTE ET PROBLÉMATIQUE",
            "CHAPITRE II — ANALYSE DES BESOINS",
            "CHAPITRE III — CONCEPTION",
            "CHAPITRE IV — IMPLÉMENTATION",
            "CHAPITRE V — TESTS ET VALIDATION",
            "CONCLUSION GÉNÉRALE",
        ]),

        ...newPage(),

        ...generalIntroduction(),

        ...newPage(),

        heading(
            "CHAPITRE I — CONTEXTE ET PROBLÉMATIQUE",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le contexte du projet, les utilisateurs concernés, les contraintes et la problématique."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE II — ANALYSE DES BESOINS",
            1
        ),

        heading(
            "2.1 Besoins fonctionnels",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les fonctionnalités attendues."
            )
        ),

        heading(
            "2.2 Besoins non fonctionnels",
            2
        ),

        paragraph(
            placeholder(
                "Présentez les exigences de sécurité, performance, ergonomie, disponibilité, maintenabilité, etc."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE III — CONCEPTION",
            1
        ),

        heading(
            "3.1 Architecture générale",
            2
        ),

        paragraph(
            placeholder(
                "Présentez l'architecture du système."
            )
        ),

        heading(
            "3.2 Modélisation",
            2
        ),

        paragraph(
            placeholder(
                "Présentez UML, diagrammes, modèles de données ou autres représentations."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE IV — IMPLÉMENTATION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les technologies, composants et principales étapes d'implémentation."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE V — TESTS ET VALIDATION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez la stratégie de test, les scénarios, résultats et critères de validation."
            )
        ),

        ...newPage(),

        ...conclusionPage(),

        ...newPage(),

        ...bibliographyPage(),

        ...newPage(),

        ...appendicesPage(),
    ],
});


/* ============================================================
   RAPPORT TECHNIQUE
============================================================ */

const buildTechnicalReport = () => ({
    type: "doc",

    content: [
        ...academicCover({
            degree:
                "RAPPORT TECHNIQUE",

            speciality:
                "Étude technique / Expertise / Analyse",

            title:
                "TITRE DU RAPPORT TECHNIQUE",
        }),

        ...newPage(),

        ...resumePage(),

        ...newPage(),

        ...contentsPage([
            "INTRODUCTION",
            "CONTEXTE",
            "OBJECTIFS",
            "MÉTHODOLOGIE",
            "ANALYSE TECHNIQUE",
            "RÉSULTATS",
            "RECOMMANDATIONS",
            "CONCLUSION",
            "RÉFÉRENCES",
        ]),

        ...newPage(),

        heading(
            "INTRODUCTION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le contexte et la finalité du rapport."
            )
        ),

        heading(
            "CONTEXTE",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le contexte technique, organisationnel ou industriel."
            )
        ),

        heading(
            "OBJECTIFS",
            1
        ),

        paragraph(
            placeholder(
                "Définissez les objectifs du rapport."
            )
        ),

        heading(
            "MÉTHODOLOGIE",
            1
        ),

        paragraph(
            placeholder(
                "Présentez la démarche technique."
            )
        ),

        heading(
            "ANALYSE TECHNIQUE",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les analyses, calculs, simulations ou évaluations."
            )
        ),

        heading(
            "RÉSULTATS",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les résultats obtenus."
            )
        ),

        heading(
            "RECOMMANDATIONS",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les recommandations issues de l'étude."
            )
        ),

        heading(
            "CONCLUSION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez la conclusion générale."
            )
        ),

        ...bibliographyPage(),
    ],
});


/* ============================================================
   ÉTUDE DE CAS
============================================================ */

const buildCaseStudy = () => ({
    type: "doc",

    content: [
        heading(
            "ÉTUDE DE CAS",
            1,
            "center"
        ),

        heading(
            "TITRE DE L'ÉTUDE",
            2,
            "center"
        ),

        ...newPage(),

        heading(
            "INTRODUCTION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le contexte général de l'étude de cas."
            )
        ),

        heading(
            "PRÉSENTATION DU CAS",
            1
        ),

        paragraph(
            placeholder(
                "Présentez l'organisation, la situation, l'individu ou le phénomène étudié."
            )
        ),

        heading(
            "PROBLÉMATIQUE",
            1
        ),

        paragraph(
            placeholder(
                "Exposez le problème central."
            )
        ),

        heading(
            "MÉTHODOLOGIE D'ANALYSE",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les données et méthodes d'analyse utilisées."
            )
        ),

        heading(
            "ANALYSE DU CAS",
            1
        ),

        paragraph(
            placeholder(
                "Analysez méthodiquement les éléments du cas."
            )
        ),

        heading(
            "DISCUSSION",
            1
        ),

        paragraph(
            placeholder(
                "Interprétez les résultats de l'analyse."
            )
        ),

        heading(
            "RECOMMANDATIONS",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les recommandations."
            )
        ),

        heading(
            "CONCLUSION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les conclusions principales."
            )
        ),

        ...bibliographyPage(),
    ],
});


/* ============================================================
   NOTES DE COURS
============================================================ */

const buildCourseNotes = () => ({
    type: "doc",

    content: [
        heading(
            "TITRE DU COURS",
            1,
            "center"
        ),

        paragraph(
            "Enseignant : "
            + placeholder(
                "Nom"
            ),
            {
                align: "center",
            }
        ),

        paragraph(
            "Année académique : 2026 – 2027",
            {
                align: "center",
            }
        ),

        ...newPage(),

        heading(
            "OBJECTIFS PÉDAGOGIQUES",
            1
        ),

        paragraph(
            placeholder(
                "Présentez les compétences et connaissances que l'étudiant devra acquérir."
            )
        ),

        heading(
            "INTRODUCTION",
            1
        ),

        paragraph(
            placeholder(
                "Présentez le cours et son intérêt."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE I",
            1
        ),

        heading(
            "1.1 Concepts fondamentaux",
            2
        ),

        paragraph(
            placeholder(
                "Contenu du cours."
            )
        ),

        ...newPage(),

        heading(
            "CHAPITRE II",
            1
        ),

        paragraph(
            placeholder(
                "Contenu du cours."
            )
        ),

        ...newPage(),

        heading(
            "EXERCICES",
            1
        ),

        paragraph(
            "Exercice 1 — "
            + placeholder(
                "Énoncé"
            )
        ),

        paragraph(
            "Exercice 2 — "
            + placeholder(
                "Énoncé"
            )
        ),

        ...newPage(),

        heading(
            "SYNTHÈSE",
            1
        ),

        paragraph(
            placeholder(
                "Résumez les notions essentielles."
            )
        ),

        heading(
            "CONCLUSION",
            1
        ),

        paragraph(
            placeholder(
                "Conclusion du cours."
            )
        ),
    ],
});


/* ============================================================
   REGISTRE DES MODÈLES
============================================================ */

export const SCIENTIFIC_TEMPLATE_BUILDERS = {
    [TEMPLATE_IDS.MEMOIRE_LICENCE]:
        buildLicenceMemory,

    [TEMPLATE_IDS.RAPPORT_STAGE]:
        buildInternshipReport,

    [TEMPLATE_IDS.ARTICLE_SCIENTIFIQUE]:
        buildScientificArticle,

    [TEMPLATE_IDS.PROJET_FIN_ETUDES]:
        buildFinalYearProject,

    [TEMPLATE_IDS.THESE_DOCTORAT]:
        buildDoctoralThesis,

    [TEMPLATE_IDS.RAPPORT_TECHNIQUE]:
        buildTechnicalReport,

    [TEMPLATE_IDS.ETUDE_CAS]:
        buildCaseStudy,

    [TEMPLATE_IDS.NOTES_COURS]:
        buildCourseNotes,
};


/* ============================================================
   GÉNÉRATION DU DOCUMENT
============================================================ */

/**
 * Génère le document TipTap correspondant au modèle.
 *
 * @param {string} templateId
 * @returns {object}
 */

export function buildScientificTemplateDocument(
    templateId
) {
    const builder =
        SCIENTIFIC_TEMPLATE_BUILDERS[
            templateId
        ];

    if (!builder) {
        console.warn(
            `[MACEVO] Modèle inconnu : ${templateId}`
        );

        return {
            type: "doc",

            content: [
                paragraph(""),
            ],
        };
    }

    return builder();
}


/* ============================================================
   MÉTADONNÉES
============================================================ */

export const SCIENTIFIC_TEMPLATE_METADATA = {
    "memoire-licence": {
        name:
            "Mémoire de Licence",

        documentType:
            "academic-thesis",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Times New Roman",

        fontSize:
            12,

        lineHeight:
            1.5,

        margins: {
            top: 25,
            right: 25,
            bottom: 25,
            left: 30,
        },
    },

    "these-doctorat": {
        name:
            "Thèse de Doctorat",

        documentType:
            "doctoral-thesis",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Times New Roman",

        fontSize:
            12,

        lineHeight:
            1.5,

        margins: {
            top: 25,
            right: 25,
            bottom: 25,
            left: 30,
        },
    },

    "article-scientifique": {
        name:
            "Article scientifique IMRAD",

        documentType:
            "scientific-article",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Times New Roman",

        fontSize:
            11,

        lineHeight:
            1.15,

        margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
    },

    "rapport-stage": {
        name:
            "Rapport de Stage",

        documentType:
            "internship-report",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Times New Roman",

        fontSize:
            12,

        lineHeight:
            1.5,

        margins: {
            top: 25,
            right: 25,
            bottom: 25,
            left: 30,
        },
    },

    "projet-fin-etudes": {
        name:
            "Projet de Fin d'Études",

        documentType:
            "final-year-project",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Times New Roman",

        fontSize:
            12,

        lineHeight:
            1.5,

        margins: {
            top: 25,
            right: 25,
            bottom: 25,
            left: 30,
        },
    },

    "rapport-technique": {
        name:
            "Rapport Technique",

        documentType:
            "technical-report",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Arial",

        fontSize:
            11,

        lineHeight:
            1.35,

        margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
    },

    "etude-cas": {
        name:
            "Étude de Cas",

        documentType:
            "case-study",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Times New Roman",

        fontSize:
            12,

        lineHeight:
            1.5,

        margins: {
            top: 25,
            right: 25,
            bottom: 25,
            left: 25,
        },
    },

    "notes-cours": {
        name:
            "Notes de Cours",

        documentType:
            "course-notes",

        language:
            "fr",

        pageSize:
            "A4",

        orientation:
            "portrait",

        defaultFont:
            "Calibri",

        fontSize:
            12,

        lineHeight:
            1.3,

        margins: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
    },
};


/* ============================================================
   RÉCUPÉRATION DES MÉTADONNÉES
============================================================ */

export function getScientificTemplateMetadata(
    templateId
) {
    return (
        SCIENTIFIC_TEMPLATE_METADATA[
            templateId
        ] || null
    );
}


/* ============================================================
   EXPORT PAR DÉFAUT
============================================================ */

export default {
    TEMPLATE_IDS,
    SCIENTIFIC_TEMPLATE_BUILDERS,
    SCIENTIFIC_TEMPLATE_METADATA,
    buildScientificTemplateDocument,
    getScientificTemplateMetadata,
};