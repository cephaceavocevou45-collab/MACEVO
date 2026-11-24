import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";
import "katex/dist/katex.min.css";

export const MathNode = Node.create({
  name: "mathNode",

  group: "inline",

  inline: true,

  selectable: true,

  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",

        parseHTML: (element) => {
          return element.getAttribute("data-latex") || "";
        },

        renderHTML: (attributes) => {
          return {
            "data-latex": attributes.latex,
          };
        },
      },
    };
  },

  /**
   * ---------------------------------------------------------
   * Commandes personnalisées
   * ---------------------------------------------------------
   *
   * Le LaTeX est stocké dans le document mais n'est jamais
   * inséré comme texte visible.
   *
   * Exemple :
   *
   * editor.commands.insertMath("\\sum_{i=1}^{n} x_i")
   *
   * crée :
   *
   * <mathNode latex="\\sum_{i=1}^{n} x_i" />
   *
   * puis le NodeView le transforme visuellement avec KaTeX.
   */
  addCommands() {
    return {
      insertMath:
        (latex) =>
        ({ commands }) => {
          if (!latex || typeof latex !== "string") {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              latex,
            },
          });
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-latex]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: "math-node",
      }),
    ];
  },

  /**
   * ---------------------------------------------------------
   * Rendu visuel avec KaTeX
   * ---------------------------------------------------------
   */
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("span");

      dom.classList.add(
        "math-node",
        "inline-block",
        "px-1",
        "cursor-pointer"
      );

      const latex = node.attrs.latex || "";

      try {
        katex.render(latex, dom, {
          throwOnError: false,
          displayMode: false,
        });
      } catch (error) {
        dom.innerText = latex;
        dom.classList.add("text-red-500");
      }

      return {
        dom,
      };
    };
  },
});