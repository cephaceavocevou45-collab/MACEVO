import { Node, mergeAttributes } from "@tiptap/core";

const ScientificAlgorithm = Node.create({

  name: "scientificAlgorithm",

  group: "block",

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      title: {
        default: "",
      },

      steps: {
        default: [],
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
        tag: 'div[data-type="scientific-algorithm"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    const {

      title,

      steps = [],

      number,

    } = HTMLAttributes;

    const renderedSteps =
      steps.map(
        (step, index) => [

          "li",
          {},

          typeof step === "string"
            ? step
            : step.text || "",

        ]
      );

    return [

      "div",

      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-algorithm",

          class:
            "macevo-algorithm",
        }
      ),

      [

        "div",

        {
          class:
            "macevo-algorithm-title",
        },

        number
          ? `Algorithme ${number}`
          : "Algorithme",

        title
          ? ` — ${title}`
          : "",

      ],

      [

        "ol",
        {},

        ...renderedSteps,

      ],
    ];
  },
});

export default ScientificAlgorithm;