/*
|--------------------------------------------------------------------------
| MACEVO — Document Structure Engine
|--------------------------------------------------------------------------
|
| Ce fichier définit la structure interne d'un document MACEVO.
|
| Objectif :
| - représenter les chapitres
| - représenter les sections
| - représenter les sous-sections
| - gérer les éléments scientifiques
| - préparer les exports PDF / Word / LaTeX
|
|--------------------------------------------------------------------------
*/

export const DOCUMENT_NODE_TYPES = {
  DOCUMENT: "document",

  COVER: "cover",

  FRONT_MATTER: "front_matter",

  DEDICATION: "dedication",

  ACKNOWLEDGEMENTS: "acknowledgements",

  ABSTRACT: "abstract",

  KEYWORDS: "keywords",

  TABLE_OF_CONTENTS: "table_of_contents",

  LIST_OF_FIGURES: "list_of_figures",

  LIST_OF_TABLES: "list_of_tables",

  LIST_OF_EQUATIONS: "list_of_equations",

  LIST_OF_ABBREVIATIONS: "list_of_abbreviations",

  CHAPTER: "chapter",

  SECTION: "section",

  SUBSECTION: "subsection",

  SUBSUBSECTION: "subsubsection",

  PARAGRAPH: "paragraph",

  EQUATION: "equation",

  FIGURE: "figure",

  TABLE: "table",

  DEFINITION: "definition",

  THEOREM: "theorem",

  LEMMA: "lemma",

  PROPOSITION: "proposition",

  COROLLARY: "corollary",

  PROOF: "proof",

  EXAMPLE: "example",

  REMARK: "remark",

  ALGORITHM: "algorithm",

  CODE: "code",

  QUOTE: "quote",

  CITATION: "citation",

  REFERENCES: "references",

  ANNEX: "annex",

  CONCLUSION: "conclusion",
};


/*
|--------------------------------------------------------------------------
| Générateur d'identifiant
|--------------------------------------------------------------------------
*/

export const createNodeId = (prefix = "node") => {
  const random =
    Math.random()
      .toString(36)
      .substring(2, 9);

  return `${prefix}-${Date.now()}-${random}`;
};


/*
|--------------------------------------------------------------------------
| Création d'un paragraphe
|--------------------------------------------------------------------------
*/

export const createParagraph = (
  content = ""
) => ({
  id: createNodeId("paragraph"),

  type:
    DOCUMENT_NODE_TYPES.PARAGRAPH,

  content,

  metadata: {},
});


/*
|--------------------------------------------------------------------------
| Création d'une section
|--------------------------------------------------------------------------
*/

export const createSection = ({
  title = "",
  level = 1,
  number = null,
  children = [],
} = {}) => ({
  id: createNodeId("section"),

  type:
    level === 1
      ? DOCUMENT_NODE_TYPES.SECTION
      : level === 2
      ? DOCUMENT_NODE_TYPES.SUBSECTION
      : DOCUMENT_NODE_TYPES.SUBSUBSECTION,

  title,

  level,

  number,

  children,

  metadata: {},
});


/*
|--------------------------------------------------------------------------
| Création d'un chapitre
|--------------------------------------------------------------------------
*/

export const createChapter = ({
  title = "",
  number = null,
  children = [],
} = {}) => ({
  id: createNodeId("chapter"),

  type:
    DOCUMENT_NODE_TYPES.CHAPTER,

  title,

  number,

  children,

  metadata: {},
});


/*
|--------------------------------------------------------------------------
| Création d'une équation
|--------------------------------------------------------------------------
*/

export const createEquation = ({
  latex = "",
  number = null,
  caption = "",
} = {}) => ({
  id: createNodeId("equation"),

  type:
    DOCUMENT_NODE_TYPES.EQUATION,

  latex,

  number,

  caption,

  metadata: {
    alignment: "center",
    numbered: true,
  },
});


/*
|--------------------------------------------------------------------------
| Création d'une figure
|--------------------------------------------------------------------------
*/

export const createFigure = ({
  src = "",
  alt = "",
  caption = "",
  number = null,
} = {}) => ({
  id: createNodeId("figure"),

  type:
    DOCUMENT_NODE_TYPES.FIGURE,

  src,

  alt,

  caption,

  number,

  metadata: {
    alignment: "center",
    width: "80%",
  },
});


/*
|--------------------------------------------------------------------------
| Création d'un tableau
|--------------------------------------------------------------------------
*/

export const createTable = ({
  headers = [],
  rows = [],
  caption = "",
  number = null,
} = {}) => ({
  id: createNodeId("table"),

  type:
    DOCUMENT_NODE_TYPES.TABLE,

  headers,

  rows,

  caption,

  number,

  metadata: {
    alignment: "center",
  },
});


/*
|--------------------------------------------------------------------------
| Création d'un élément scientifique
|--------------------------------------------------------------------------
*/

export const createScientificBlock = ({
  type,
  title = "",
  content = "",
  number = null,
} = {}) => ({
  id: createNodeId("scientific"),

  type,

  title,

  content,

  number,

  metadata: {},
});


/*
|--------------------------------------------------------------------------
| Création d'un document complet
|--------------------------------------------------------------------------
*/

export const createDocument = ({
  title = "",
  type = "Mémoire",
  level = "Master",
  discipline = "",
  language = "Français",
  academicYear = "",
  institution = "",
  department = "",
  supervisor = "",
  author = "",
  chapters = [],
  frontMatter = {},
} = {}) => ({
  id: createNodeId("document"),

  type:
    DOCUMENT_NODE_TYPES.DOCUMENT,

  version: 1,

  metadata: {
    title,

    documentType: type,

    academicLevel: level,

    discipline,

    language,

    academicYear,

    institution,

    department,

    supervisor,

    author,
  },

  frontMatter: {
    cover: true,

    dedication:
      frontMatter.dedication ?? true,

    acknowledgements:
      frontMatter.acknowledgements ?? true,

    abstract:
      frontMatter.abstract ?? true,

    keywords:
      frontMatter.keywords ?? true,

    tableOfContents:
      frontMatter.tableOfContents ?? true,

    listOfFigures:
      frontMatter.listOfFigures ?? true,

    listOfTables:
      frontMatter.listOfTables ?? true,

    listOfEquations:
      frontMatter.listOfEquations ?? true,

    listOfAbbreviations:
      frontMatter.listOfAbbreviations ?? true,
  },

  chapters,

  references: [],

  annexes: [],

  settings: {
    pageSize: "A4",

    orientation: "portrait",

    margins: {
      top: "2.5cm",
      right: "2.5cm",
      bottom: "2.5cm",
      left: "3cm",
    },

    lineSpacing: 1.5,

    fontFamily: "Times New Roman",

    fontSize: 12,

    headingStyle: "academic",
  },
});


/*
|--------------------------------------------------------------------------
| Création automatique d'un chapitre à partir d'une structure
|--------------------------------------------------------------------------
*/

export const buildChapterFromTemplate = (
  section,
  chapterNumber
) => {
  const chapter =
    createChapter({
      title: section,
      number: chapterNumber,
    });

  return chapter;
};


/*
|--------------------------------------------------------------------------
| Construction de plusieurs chapitres
|--------------------------------------------------------------------------
*/

export const buildChaptersFromSections = (
  sections = []
) => {
  return sections
    .filter(Boolean)
    .map((section, index) =>
      buildChapterFromTemplate(
        section,
        index + 1
      )
    );
};


/*
|--------------------------------------------------------------------------
| Ajout d'un enfant
|--------------------------------------------------------------------------
*/

export const appendChildNode = (
  parent,
  child
) => {
  if (!parent?.children) {
    return parent;
  }

  return {
    ...parent,

    children: [
      ...parent.children,
      child,
    ],
  };
};


/*
|--------------------------------------------------------------------------
| Recherche récursive d'un nœud
|--------------------------------------------------------------------------
*/

export const findNodeById = (
  node,
  id
) => {
  if (!node) {
    return null;
  }

  if (node.id === id) {
    return node;
  }

  if (
    Array.isArray(node.children)
  ) {
    for (
      const child of node.children
    ) {
      const result =
        findNodeById(child, id);

      if (result) {
        return result;
      }
    }
  }

  return null;
};


/*
|--------------------------------------------------------------------------
| Collecte des équations
|--------------------------------------------------------------------------
*/

export const collectEquations = (
  document
) => {
  const equations = [];

  const visit = (node) => {
    if (!node) {
      return;
    }

    if (
      node.type ===
      DOCUMENT_NODE_TYPES.EQUATION
    ) {
      equations.push(node);
    }

    if (
      Array.isArray(node.children)
    ) {
      node.children.forEach(
        visit
      );
    }
  };

  visit(document);

  return equations;
};


/*
|--------------------------------------------------------------------------
| Collecte des figures
|--------------------------------------------------------------------------
*/

export const collectFigures = (
  document
) => {
  const figures = [];

  const visit = (node) => {
    if (!node) {
      return;
    }

    if (
      node.type ===
      DOCUMENT_NODE_TYPES.FIGURE
    ) {
      figures.push(node);
    }

    if (
      Array.isArray(node.children)
    ) {
      node.children.forEach(
        visit
      );
    }
  };

  visit(document);

  return figures;
};


/*
|--------------------------------------------------------------------------
| Collecte des tableaux
|--------------------------------------------------------------------------
*/

export const collectTables = (
  document
) => {
  const tables = [];

  const visit = (node) => {
    if (!node) {
      return;
    }

    if (
      node.type ===
      DOCUMENT_NODE_TYPES.TABLE
    ) {
      tables.push(node);
    }

    if (
      Array.isArray(node.children)
    ) {
      node.children.forEach(
        visit
      );
    }
  };

  visit(document);

  return tables;
};


/*
|--------------------------------------------------------------------------
| Numérotation automatique
|--------------------------------------------------------------------------
*/

export const numberScientificElements = (
  document
) => {
  if (!document) {
    return document;
  }

  const counters = {
    chapter: 0,
    figure: 0,
    table: 0,
    equation: 0,
  };

  const walk = (
    node,
    chapterNumber = 0
  ) => {
    if (!node) {
      return node;
    }

    const nextNode = {
      ...node,
    };

    if (
      node.type ===
      DOCUMENT_NODE_TYPES.CHAPTER
    ) {
      counters.chapter += 1;

      nextNode.number =
        counters.chapter;

      chapterNumber =
        counters.chapter;
    }

    if (
      node.type ===
      DOCUMENT_NODE_TYPES.FIGURE
    ) {
      counters.figure += 1;

      nextNode.number =
        `${chapterNumber}.${counters.figure}`;
    }

    if (
      node.type ===
      DOCUMENT_NODE_TYPES.TABLE
    ) {
      counters.table += 1;

      nextNode.number =
        `${chapterNumber}.${counters.table}`;
    }

    if (
      node.type ===
      DOCUMENT_NODE_TYPES.EQUATION
    ) {
      counters.equation += 1;

      nextNode.number =
        `${chapterNumber}.${counters.equation}`;
    }

    if (
      Array.isArray(node.children)
    ) {
      nextNode.children =
        node.children.map(
          (child) =>
            walk(
              child,
              chapterNumber
            )
        );
    }

    return nextNode;
  };

  return walk(document);
};


/*
|--------------------------------------------------------------------------
| Document prêt pour l'éditeur
|--------------------------------------------------------------------------
*/

export const prepareDocument = (
  document
) => {
  const numbered =
    numberScientificElements(
      document
    );

  return {
    ...numbered,

    generatedAt:
      new Date().toISOString(),

    engineVersion:
      "1.0.0",
  };
};


export default {
  DOCUMENT_NODE_TYPES,

  createNodeId,

  createParagraph,

  createSection,

  createChapter,

  createEquation,

  createFigure,

  createTable,

  createScientificBlock,

  createDocument,

  buildChapterFromTemplate,

  buildChaptersFromSections,

  appendChildNode,

  findNodeById,

  collectEquations,

  collectFigures,

  collectTables,

  numberScientificElements,

  prepareDocument,
};