import { Node, mergeAttributes } from "@tiptap/core";

const ScientificNote = Node.create({

  name: "scientificNote",

  group: "block",

  atom: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      title: {
        default: "Note",
      },

      text: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'aside[data-type="scientific-note"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    return [

      "aside",

      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-note",

          class:
            "macevo-note",
        }
      ),

      [

        "strong",
        {},
        HTMLAttributes.title,

      ],

      [

        "div",
        {},
        HTMLAttributes.text,

      ],

    ];
  },
});

export default ScientificNote;