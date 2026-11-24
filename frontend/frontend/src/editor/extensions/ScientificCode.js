import { Node, mergeAttributes } from "@tiptap/core";

const ScientificCode = Node.create({

  name: "scientificCode",

  group: "block",

  atom: true,

  selectable: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      language: {
        default: "text",
      },

      filename: {
        default: "",
      },

      code: {
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
        tag: 'pre[data-type="scientific-code"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    const {

      language,

      filename,

      code,

      number,

    } = HTMLAttributes;

    return [

      "pre",

      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-code",

          class:
            "macevo-code",
        }
      ),

      [

        "code",

        {},

        code,

      ],

      [

        "div",

        {
          class:
            "macevo-code-info",
        },

        [

          "span",
          {},
          language,

        ],

        filename
          ? [
              "span",
              {},
              filename,
            ]
          : "",

        number
          ? [
              "span",
              {},
              `Code ${number}`,
            ]
          : "",

      ],

    ];
  },
});

export default ScientificCode;