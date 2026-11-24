import { Node } from "@tiptap/core";

export const MacevoBreak = Node.create({
    name: "macevoBreak",
    group: "block",
    atom: true,
    selectable: true,
    addAttributes() {
        return { kind: { default: "page" } };
    },
    parseHTML() {
        return [{ tag: "div[data-macevo-break]", getAttrs: (element) => ({ kind: element.getAttribute("data-macevo-break") || "page" }) }];
    },
    renderHTML({ HTMLAttributes }) {
        const kind = HTMLAttributes.kind || "page";
        return ["div", { "data-macevo-break": kind, class: `macevo-break macevo-break-${kind}`, contenteditable: "false", "aria-label": `Saut ${kind}` }];
    },
});
