import { Node, mergeAttributes } from "@tiptap/core";

const ScientificEquation = Node.create({

  name: "scientificEquation",

  group: "block",

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      latex: {
        default: "",
      },

      number: {
        default: null,
      },

      label: {
        default: null,
      },

      caption: {
        default: "",
      },

      explanation: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="scientific-equation"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    return [
      "div",
      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-equation",
          class:
            "macevo-scientific-equation",
        }
      ),
      [
        "div",
        {
          class:
            "macevo-equation-content",
        },
        HTMLAttributes.latex || "",
      ],
      [
        "div",
        {
          class:
            "macevo-equation-number",
        },
        HTMLAttributes.number
          ? `(${HTMLAttributes.number})`
          : "",
      ],
    ];
  },
});

export default ScientificEquation;