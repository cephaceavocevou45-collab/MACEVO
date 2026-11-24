import { Node, mergeAttributes } from "@tiptap/core";

const ScientificTheorem = Node.create({

  name: "scientificTheorem",

  group: "block",

  atom: true,

  selectable: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      title: {
        default: "",
      },

      statement: {
        default: "",
      },

      number: {
        default: null,
      },

      label: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="scientific-theorem"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    const {

      title,

      statement,

      number,

    } = HTMLAttributes;

    return [

      "div",

      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-theorem",

          class:
            "macevo-theorem",
        }
      ),

      [

        "div",

        {
          class:
            "macevo-theorem-title",
        },

        number
          ? `Théorème ${number}`
          : "Théorème",

        title
          ? ` — ${title}`
          : "",

      ],

      [

        "div",

        {
          class:
            "macevo-theorem-statement",
        },

        statement,

      ],
    ];
  },
});

export default ScientificTheorem;