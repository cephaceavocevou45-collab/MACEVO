// ============================================================
// MACEVO — PARTIE 8
// ADAPTATEUR DOCUMENT SCIENTIFIQUE ↔ TIPTAP
// ============================================================

/*
  Architecture :

  MACEVO Scientific JSON
          ↕
  macevoTiptap
          ↕
       Tiptap
          ↕
      ProseMirror
*/


// ============================================================
// 1. TYPES DE NŒUDS MACEVO
// ============================================================

export const MACEVO_TIPTAP_NODE_TYPES = {

  DOCUMENT:
    "macevoDocument",

  CHAPTER:
    "macevoChapter",

  SECTION:
    "macevoSection",

  SUBSECTION:
    "macevoSubsection",

  EQUATION:
    "scientificEquation",

  EQUATION_SYSTEM:
    "scientificEquationSystem",

  MATRIX:
    "scientificMatrix",

  FIGURE:
    "scientificFigure",

  TABLE:
    "scientificTable",

  CHART:
    "scientificChart",

  THEOREM:
    "scientificTheorem",

  DEFINITION:
    "scientificDefinition",

  LEMMA:
    "scientificLemma",

  PROPOSITION:
    "scientificProposition",

  COROLLARY:
    "scientificCorollary",

  REMARK:
    "scientificRemark",

  EXAMPLE:
    "scientificExample",

  PROOF:
    "scientificProof",

  ALGORITHM:
    "scientificAlgorithm",

  CODE:
    "scientificCode",

  CITATION:
    "scientificCitation",

  CROSS_REFERENCE:
    "scientificCrossReference",

  NOTE:
    "scientificNote",

  WARNING:
    "scientificWarning",

  QUOTE:
    "scientificQuote"
};


// ============================================================
// 2. UTILITAIRES
// ============================================================

export const createTiptapId = (
  prefix = "node"
) => {

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
};


const safeArray = value =>
  Array.isArray(value)
    ? value
    : [];


// ============================================================
// 3. BLOC MACEVO → NŒUD TIPTAP
// ============================================================

export const scientificBlockToTiptapNode = (
  block
) => {

  if (!block) {
    return null;
  }

  switch (block.type) {

    // --------------------------------------------------------
    // PARAGRAPHE
    // --------------------------------------------------------

    case "paragraph":

      return {

        type: "paragraph",

        attrs: {

          macevoId:
            block.id || null,

          scientificType:
            "paragraph"
        },

        content: block.text
          ? [
              {
                type: "text",
                text: block.text
              }
            ]
          : []
      };


    // --------------------------------------------------------
    // TITRE
    // --------------------------------------------------------

    case "heading":

      return {

        type: "heading",

        attrs: {

          level:
            block.level || 2,

          macevoId:
            block.id || null,

          number:
            block.number || null
        },

        content: block.text
          ? [
              {
                type: "text",
                text: block.text
              }
            ]
          : []
      };


    // --------------------------------------------------------
    // ÉQUATION
    // --------------------------------------------------------

    case "equation":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.EQUATION,

        attrs: {

          id:
            block.id || createTiptapId("equation"),

          latex:
            block.latex || "",

          number:
            block.number || null,

          label:
            block.label || null,

          caption:
            block.caption || "",

          explanation:
            block.explanation || ""
        }
      };


    // --------------------------------------------------------
    // SYSTÈME D'ÉQUATIONS
    // --------------------------------------------------------

    case "equationSystem":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.EQUATION_SYSTEM,

        attrs: {

          id:
            block.id || createTiptapId("system"),

          equations:
            safeArray(block.equations),

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // MATRICE
    // --------------------------------------------------------

    case "matrix":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.MATRIX,

        attrs: {

          id:
            block.id || createTiptapId("matrix"),

          matrix:
            block.matrix || [],

          environment:
            block.environment || "bmatrix",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // FIGURE
    // --------------------------------------------------------

    case "figure":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.FIGURE,

        attrs: {

          id:
            block.id || createTiptapId("figure"),

          src:
            block.src || "",

          alt:
            block.alt || "",

          caption:
            block.caption || "",

          number:
            block.number || null,

          label:
            block.label || null,

          width:
            block.width || "100%",

          alignment:
            block.alignment || "center"
        }
      };


    // --------------------------------------------------------
    // TABLEAU
    // --------------------------------------------------------

    case "table":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.TABLE,

        attrs: {

          id:
            block.id || createTiptapId("table"),

          headers:
            safeArray(block.headers),

          rows:
            safeArray(block.rows),

          caption:
            block.caption || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // GRAPHIQUE
    // --------------------------------------------------------

    case "chart":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.CHART,

        attrs: {

          id:
            block.id || createTiptapId("chart"),

          chartType:
            block.chartType || "bar",

          data:
            block.data || [],

          title:
            block.title || "",

          caption:
            block.caption || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // THÉORÈME
    // --------------------------------------------------------

    case "theorem":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.THEOREM,

        attrs: {

          id:
            block.id || createTiptapId("theorem"),

          title:
            block.title || "",

          statement:
            block.statement || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // DÉFINITION
    // --------------------------------------------------------

    case "definition":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.DEFINITION,

        attrs: {

          id:
            block.id || createTiptapId("definition"),

          term:
            block.term || "",

          definition:
            block.definition || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // LEMME
    // --------------------------------------------------------

    case "lemma":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.LEMMA,

        attrs: {

          id:
            block.id || createTiptapId("lemma"),

          title:
            block.title || "",

          statement:
            block.statement || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // PROPOSITION
    // --------------------------------------------------------

    case "proposition":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.PROPOSITION,

        attrs: {

          id:
            block.id || createTiptapId("proposition"),

          title:
            block.title || "",

          statement:
            block.statement || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // COROLLAIRE
    // --------------------------------------------------------

    case "corollary":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.COROLLARY,

        attrs: {

          id:
            block.id || createTiptapId("corollary"),

          title:
            block.title || "",

          statement:
            block.statement || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // REMARQUE
    // --------------------------------------------------------

    case "remark":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.REMARK,

        attrs: {

          id:
            block.id || createTiptapId("remark"),

          title:
            block.title || "",

          text:
            block.text || ""
        }
      };


    // --------------------------------------------------------
    // EXEMPLE
    // --------------------------------------------------------

    case "example":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.EXAMPLE,

        attrs: {

          id:
            block.id || createTiptapId("example"),

          title:
            block.title || "",

          text:
            block.text || ""
        }
      };


    // --------------------------------------------------------
    // PREUVE
    // --------------------------------------------------------

    case "proof":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.PROOF,

        attrs: {

          id:
            block.id || createTiptapId("proof"),

          text:
            block.text || "",

          qed:
            block.qed !== false
        }
      };


    // --------------------------------------------------------
    // ALGORITHME
    // --------------------------------------------------------

    case "algorithm":

      return {

        type:
          MACEVO_TIPAP_NODE_TYPES?.ALGORITHM ||
          "scientificAlgorithm",

        attrs: {

          id:
            block.id || createTiptapId("algorithm"),

          title:
            block.title || "",

          steps:
            safeArray(block.steps),

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // CODE
    // --------------------------------------------------------

    case "code":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.CODE,

        attrs: {

          id:
            block.id || createTiptapId("code"),

          language:
            block.language || "text",

          filename:
            block.filename || "",

          code:
            block.code || "",

          number:
            block.number || null,

          label:
            block.label || null
        }
      };


    // --------------------------------------------------------
    // CITATION
    // --------------------------------------------------------

    case "citation":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.CITATION,

        attrs: {

          id:
            block.id || createTiptapId("citation"),

          key:
            block.key || "",

          text:
            block.text || "",

          page:
            block.page || null,

          style:
            block.style || "author-year"
        }
      };


    // --------------------------------------------------------
    // RÉFÉRENCE CROISÉE
    // --------------------------------------------------------

    case "crossReference":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.CROSS_REFERENCE,

        attrs: {

          id:
            block.id || createTiptapId("reference"),

          target:
            block.target || "",

          label:
            block.label || "",

          display:
            block.display || "auto"
        }
      };


    // --------------------------------------------------------
    // NOTE
    // --------------------------------------------------------

    case "note":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.NOTE,

        attrs: {

          id:
            block.id || createTiptapId("note"),

          title:
            block.title || "Note",

          text:
            block.text || ""
        }
      };


    // --------------------------------------------------------
    // AVERTISSEMENT
    // --------------------------------------------------------

    case "warning":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.WARNING,

        attrs: {

          id:
            block.id || createTiptapId("warning"),

          title:
            block.title || "Attention",

          text:
            block.text || ""
        }
      };


    // --------------------------------------------------------
    // CITATION TEXTUELLE
    // --------------------------------------------------------

    case "quote":

      return {

        type:
          MACEVO_TIPTAP_NODE_TYPES.QUOTE,

        attrs: {

          id:
            block.id || createTiptapId("quote"),

          text:
            block.text || "",

          author:
            block.author || "",

          source:
            block.source || ""
        }
      };


    default:

      return {

        type: "paragraph",

        content: block.text
          ? [
              {
                type: "text",
                text: block.text
              }
            ]
          : []
      };
  }
};


// ============================================================
// 4. SECTION MACEVO → TIPTAP
// ============================================================

export const macevoSectionToTiptap = (
  section
) => {

  if (!section) {
    return null;
  }

  const content = [];


  // Titre de section

  if (section.title) {

    content.push({

      type: "heading",

      attrs: {

        level:
          section.level || 2,

        macevoId:
          section.id || null,

        number:
          section.number || null
      },

      content: [

        {
          type: "text",
          text: section.title
        }

      ]
    });
  }


  // Blocs

  safeArray(section.blocks)
    .forEach(
      block => {

        const node =
          scientificBlockToTiptapNode(
            block
          );

        if (node) {
          content.push(node);
        }
      }
    );


  // Sous-sections

  safeArray(section.subsections)
    .forEach(
      subsection => {

        const node =
          macevoSectionToTiptap(
            subsection
          );

        if (node?.content) {

          content.push(
            ...node.content
          );
        }
      }
    );


  return {

    type: "section",

    attrs: {

      macevoId:
        section.id || null,

      number:
        section.number || null,

      level:
        section.level || 2
    },

    content
  };
};


// ============================================================
// 5. CHAPITRE MACEVO → TIPTAP
// ============================================================

export const macevoChapterToTiptap = (
  chapter
) => {

  if (!chapter) {
    return null;
  }

  const content = [];


  // Titre du chapitre

  content.push({

    type: "heading",

    attrs: {

      level: 1,

      macevoId:
        chapter.id || null,

      number:
        chapter.number || null
    },

    content: [

      {
        type: "text",

        text:
          chapter.title || ""
      }

    ]
  });


  // Introduction du chapitre

  if (chapter.introduction) {

    const intro =
      scientificBlockToTiptapNode(
        chapter.introduction
      );

    if (intro) {
      content.push(intro);
    }
  }


  // Sections

  safeArray(chapter.sections)
    .forEach(
      section => {

        const node =
          macevoSectionToTiptap(
            section
          );

        if (node?.content) {

          content.push(
            ...node.content
          );
        }
      }
    );


  // Conclusion du chapitre

  if (chapter.conclusion) {

    const conclusion =
      scientificBlockToTiptapNode(
        chapter.conclusion
      );

    if (conclusion) {
      content.push(conclusion);
    }
  }


  return {

    type:
      MACEVO_TIPTAP_NODE_TYPES.CHAPTER,

    attrs: {

      macevoId:
        chapter.id || null,

      number:
        chapter.number || null
    },

    content
  };
};


// ============================================================
// 6. DOCUMENT MACEVO → TIPTAP
// ============================================================

export const macevoDocumentToTiptap = (
  document
) => {

  if (!document) {

    return {

      type: "doc",

      content: []
    };
  }


  const content = [];


  safeArray(document.chapters)
    .forEach(
      chapter => {

        const node =
          macevoChapterToTiptap(
            chapter
          );

        if (node) {
          content.push(node);
        }
      }
    );


  return {

    type: "doc",

    content
  };
};


// ============================================================
// 7. EXTRAIRE LE TEXTE D'UN NŒUD TIPTAP
// ============================================================

const extractNodeText = (
  node
) => {

  if (!node) {
    return "";
  }


  if (node.type === "text") {
    return node.text || "";
  }


  if (
    node.attrs?.text
  ) {

    return node.attrs.text;
  }


  if (
    node.attrs?.latex
  ) {

    return node.attrs.latex;
  }


  if (
    node.attrs?.code
  ) {

    return node.attrs.code;
  }


  return safeArray(node.content)
    .map(extractNodeText)
    .filter(Boolean)
    .join("\n");
};


// ============================================================
// 8. NŒUD TIPTAP → BLOC MACEVO
// ============================================================

export const tiptapNodeToScientificBlock = (
  node
) => {

  if (!node) {
    return null;
  }


  switch (node.type) {

    case "paragraph":

      return {

        type: "paragraph",

        id:
          node.attrs?.macevoId ||
          createTiptapId("paragraph"),

        text:
          extractNodeText(node)
      };


    case "heading":

      return {

        type: "heading",

        id:
          node.attrs?.macevoId ||
          createTiptapId("heading"),

        text:
          extractNodeText(node),

        level:
          node.attrs?.level || 2,

        number:
          node.attrs?.number || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.EQUATION:

      return {

        type: "equation",

        id:
          node.attrs?.id ||
          createTiptapId("equation"),

        latex:
          node.attrs?.latex || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null,

        caption:
          node.attrs?.caption || "",

        explanation:
          node.attrs?.explanation || ""
      };


    case MACEVO_TIPTAP_NODE_TYPES.EQUATION_SYSTEM:

      return {

        type: "equationSystem",

        id:
          node.attrs?.id ||
          createTiptapId("system"),

        equations:
          safeArray(
            node.attrs?.equations
          ),

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.MATRIX:

      return {

        type: "matrix",

        id:
          node.attrs?.id ||
          createTiptapId("matrix"),

        matrix:
          node.attrs?.matrix || [],

        environment:
          node.attrs?.environment ||
          "bmatrix",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.FIGURE:

      return {

        type: "figure",

        id:
          node.attrs?.id ||
          createTiptapId("figure"),

        src:
          node.attrs?.src || "",

        alt:
          node.attrs?.alt || "",

        caption:
          node.attrs?.caption || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null,

        width:
          node.attrs?.width || "100%",

        alignment:
          node.attrs?.alignment || "center"
      };


    case MACEVO_TIPTAP_NODE_TYPES.TABLE:

      return {

        type: "table",

        id:
          node.attrs?.id ||
          createTiptapId("table"),

        headers:
          safeArray(
            node.attrs?.headers
          ),

        rows:
          safeArray(
            node.attrs?.rows
          ),

        caption:
          node.attrs?.caption || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.CHART:

      return {

        type: "chart",

        id:
          node.attrs?.id ||
          createTiptapId("chart"),

        chartType:
          node.attrs?.chartType || "bar",

        data:
          node.attrs?.data || [],

        title:
          node.attrs?.title || "",

        caption:
          node.attrs?.caption || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.THEOREM:

      return {

        type: "theorem",

        id:
          node.attrs?.id ||
          createTiptapId("theorem"),

        title:
          node.attrs?.title || "",

        statement:
          node.attrs?.statement || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.DEFINITION:

      return {

        type: "definition",

        id:
          node.attrs?.id ||
          createTiptapId("definition"),

        term:
          node.attrs?.term || "",

        definition:
          node.attrs?.definition || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.LEMMA:

      return {

        type: "lemma",

        id:
          node.attrs?.id ||
          createTiptapId("lemma"),

        title:
          node.attrs?.title || "",

        statement:
          node.attrs?.statement || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.PROPOSITION:

      return {

        type: "proposition",

        id:
          node.attrs?.id ||
          createTiptapId("proposition"),

        title:
          node.attrs?.title || "",

        statement:
          node.attrs?.statement || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.COROLLARY:

      return {

        type: "corollary",

        id:
          node.attrs?.id ||
          createTiptapId("corollary"),

        title:
          node.attrs?.title || "",

        statement:
          node.attrs?.statement || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.REMARK:

      return {

        type: "remark",

        id:
          node.attrs?.id ||
          createTiptapId("remark"),

        title:
          node.attrs?.title || "",

        text:
          node.attrs?.text || ""
      };


    case MACEVO_TIPTAP_NODE_TYPES.EXAMPLE:

      return {

        type: "example",

        id:
          node.attrs?.id ||
          createTiptapId("example"),

        title:
          node.attrs?.title || "",

        text:
          node.attrs?.text || ""
      };


    case MACEVO_TIPTAP_NODE_TYPES.PROOF:

      return {

        type: "proof",

        id:
          node.attrs?.id ||
          createTiptapId("proof"),

        text:
          node.attrs?.text || "",

        qed:
          node.attrs?.qed !== false
      };


    case MACEVO_TIPTAP_NODE_TYPES.CODE:

      return {

        type: "code",

        id:
          node.attrs?.id ||
          createTiptapId("code"),

        language:
          node.attrs?.language || "text",

        filename:
          node.attrs?.filename || "",

        code:
          node.attrs?.code || "",

        number:
          node.attrs?.number || null,

        label:
          node.attrs?.label || null
      };


    case MACEVO_TIPTAP_NODE_TYPES.CITATION:

      return {

        type: "citation",

        id:
          node.attrs?.id ||
          createTiptapId("citation"),

        key:
          node.attrs?.key || "",

        text:
          node.attrs?.text || "",

        page:
          node.attrs?.page || null,

        style:
          node.attrs?.style ||
          "author-year"
      };


    case MACEVO_TIPTAP_NODE_TYPES.CROSS_REFERENCE:

      return {

        type: "crossReference",

        id:
          node.attrs?.id ||
          createTiptapId("reference"),

        target:
          node.attrs?.target || "",

        label:
          node.attrs?.label || "",

        display:
          node.attrs?.display || "auto"
      };


    case MACEVO_TIPTAP_NODE_TYPES.NOTE:

      return {

        type: "note",

        id:
          node.attrs?.id ||
          createTiptapId("note"),

        title:
          node.attrs?.title || "Note",

        text:
          node.attrs?.text || ""
      };


    case MACEVO_TIPTAP_NODE_TYPES.WARNING:

      return {

        type: "warning",

        id:
          node.attrs?.id ||
          createTiptapId("warning"),

        title:
          node.attrs?.title || "Attention",

        text:
          node.attrs?.text || ""
      };


    case MACEVO_TIPTAP_NODE_TYPES.QUOTE:

      return {

        type: "quote",

        id:
          node.attrs?.id ||
          createTiptapId("quote"),

        text:
          node.attrs?.text || "",

        author:
          node.attrs?.author || "",

        source:
          node.attrs?.source || ""
      };


    default:

      return {

        type: "paragraph",

        id:
          createTiptapId("paragraph"),

        text:
          extractNodeText(node)
      };
  }
};


// ============================================================
// 9. DOCUMENT TIPTAP → MACEVO
// ============================================================

export const tiptapToMacevoDocument = (
  tiptapJSON,
  originalDocument = null
) => {

  const document = {

    ...(originalDocument || {}),

    chapters: []
  };


  if (!tiptapJSON) {
    return document;
  }


  let currentChapter = null;
  let currentSection = null;


  const ensureChapter = (
    title = ""
  ) => {

    if (!currentChapter) {

      currentChapter = {

        id:
          createTiptapId("chapter"),

        number:
          document.chapters.length + 1,

        title,

        sections: []
      };

      document.chapters.push(
        currentChapter
      );
    }

    return currentChapter;
  };


  const ensureSection = (
    title = "",
    level = 2
  ) => {

    const chapter =
      ensureChapter();

    if (!currentSection) {

      currentSection = {

        id:
          createTiptapId("section"),

        number: null,

        title,

        level,

        blocks: [],

        subsections: []
      };

      chapter.sections.push(
        currentSection
      );
    }

    return currentSection;
  };


  safeArray(
    tiptapJSON.content
  ).forEach(
    node => {

      // ------------------------------------------------------
      // CHAPITRE
      // ------------------------------------------------------

      if (
        node.type ===
        MACEVO_TIPTAP_NODE_TYPES.CHAPTER
      ) {

        currentChapter = {

          id:
            node.attrs?.macevoId ||
            createTiptapId("chapter"),

          number:
            node.attrs?.number ||
            document.chapters.length + 1,

          title:
            extractNodeText(
              node.content?.[0]
            ),

          sections: []
        };

        document.chapters.push(
          currentChapter
        );

        currentSection = null;

        return;
      }


      // ------------------------------------------------------
      // TITRE NIVEAU 1
      // ------------------------------------------------------

      if (
        node.type === "heading" &&
        node.attrs?.level === 1
      ) {

        currentChapter = {

          id:
            node.attrs?.macevoId ||
            createTiptapId("chapter"),

          number:
            node.attrs?.number ||
            document.chapters.length + 1,

          title:
            extractNodeText(node),

          sections: []
        };

        document.chapters.push(
          currentChapter
        );

        currentSection = null;

        return;
      }


      // ------------------------------------------------------
      // TITRE DE SECTION
      // ------------------------------------------------------

      if (
        node.type === "heading" &&
        node.attrs?.level >= 2
      ) {

        const chapter =
          ensureChapter();

        currentSection = {

          id:
            node.attrs?.macevoId ||
            createTiptapId("section"),

          number:
            node.attrs?.number ||
            null,

          title:
            extractNodeText(node),

          level:
            node.attrs?.level || 2,

          blocks: [],

          subsections: []
        };

        chapter.sections.push(
          currentSection
        );

        return;
      }


      // ------------------------------------------------------
      // BLOC SCIENTIFIQUE
      // ------------------------------------------------------

      const block =
        tiptapNodeToScientificBlock(
          node
        );

      if (!block) {
        return;
      }

      ensureSection()
        .blocks
        .push(block);
    }
  );


  return document;
};


// ============================================================
// 10. SYNCHRONISATION
// ============================================================

export const synchronizeMacevoWithTiptap = ({
  document,
  tiptapJSON
}) => {

  const updatedDocument =
    tiptapToMacevoDocument(
      tiptapJSON,
      document
    );

  return {

    document:
      updatedDocument,

    tiptap:
      macevoDocumentToTiptap(
        updatedDocument
      )
  };
};


// ============================================================
// 11. EXPORT
// ============================================================

export default {

  MACEVO_TIPTAP_NODE_TYPES,

  scientificBlockToTiptapNode,

  macevoSectionToTiptap,

  macevoChapterToTiptap,

  macevoDocumentToTiptap,

  tiptapNodeToScientificBlock,

  tiptapToMacevoDocument,

  synchronizeMacevoWithTiptap
};