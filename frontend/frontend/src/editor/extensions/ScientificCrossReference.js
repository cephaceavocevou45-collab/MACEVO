import { Node, mergeAttributes } from "@tiptap/core";

const ScientificCrossReference = Node.create({

  name: "scientificCrossReference",

  group: "inline",

  inline: true,

  atom: true,

  selectable: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      target: {
        default: "",
      },

      label: {
        default: "",
      },

      display: {
        default: "auto",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="scientific-cross-reference"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    const {

      target,

      label,

    } = HTMLAttributes;

    return [

      "span",

      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-cross-reference",

          class:
            "macevo-cross-reference",
        }
      ),

      label ||
        `Référence : ${target}`,

    ];
  },
});

export default ScientificCrossReference;