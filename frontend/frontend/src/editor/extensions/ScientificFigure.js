import { Node, mergeAttributes } from "@tiptap/core";

const ScientificFigure = Node.create({

  name: "scientificFigure",

  group: "block",

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      src: {
        default: "",
      },

      alt: {
        default: "",
      },

      caption: {
        default: "",
      },

      number: {
        default: null,
      },

      label: {
        default: null,
      },

      width: {
        default: "100%",
      },

      alignment: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="scientific-figure"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    const {

      src,

      alt,

      caption,

      number,

      width,

      alignment,

    } = HTMLAttributes;

    return [

      "figure",

      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-figure",

          class:
            "macevo-scientific-figure",

          style:
            `text-align:${alignment};`,
        }
      ),

      [
        "img",
        {
          src,
          alt,
          style:
            `width:${width};`,
        },
      ],

      [
        "figcaption",

        {},

        number
          ? `Figure ${number} — ${caption}`
          : caption,
      ],
    ];
  },
});

export default ScientificFigure;