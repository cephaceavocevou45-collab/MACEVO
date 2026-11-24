import { Node, mergeAttributes } from "@tiptap/core";

const ScientificTable = Node.create({

  name: "scientificTable",

  group: "block",

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {

      id: {
        default: null,
      },

      headers: {
        default: [],
      },

      rows: {
        default: [],
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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="scientific-table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {

    const {

      headers = [],

      rows = [],

      caption = "",

      number,

    } = HTMLAttributes;

    const tableRows = [];

    if (headers.length) {

      tableRows.push([

        "tr",

        {},

        ...headers.map(
          header => [
            "th",
            {},
            String(header),
          ]
        ),

      ]);
    }

    rows.forEach(row => {

      tableRows.push([

        "tr",

        {},

        ...row.map(
          cell => [
            "td",
            {},
            String(cell),
          ]
        ),

      ]);

    });

    return [

      "div",

      mergeAttributes(
        HTMLAttributes,
        {
          "data-type":
            "scientific-table",

          class:
            "macevo-scientific-table",
        }
      ),

      [
        "table",
        {},

        [
          "tbody",
          {},

          ...tableRows,
        ],
      ],

      [
        "div",
        {
          class:
            "macevo-table-caption",
        },

        number
          ? `Tableau ${number} — ${caption}`
          : caption,
      ],
    ];
  },
});

export default ScientificTable;