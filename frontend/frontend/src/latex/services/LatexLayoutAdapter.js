const MARKER_START = "% MACEVO_LAYOUT_START";
const MARKER_END = "% MACEVO_LAYOUT_END";

const PAGE_NAMES = new Set([
    "a0paper", "a1paper", "a2paper", "a3paper", "a4paper", "a5paper", "a6paper",
    "b0paper", "b1paper", "b2paper", "b3paper", "b4paper", "b5paper", "b6paper",
    "letterpaper", "legalpaper", "executivepaper",
]);

function safeText(value = "") {
    return String(value)
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/([{}$&#_%])/g, "\\$1")
        .replace(/~/g, "\\textasciitilde{}")
        .replace(/\^/g, "\\textasciicircum{}");
}

function validColor(value) {
    return /^#?[0-9a-f]{6}$/i.test(String(value || ""));
}

function texColor(value) {
    return String(value).replace(/^#/, "").toUpperCase();
}

function imageExtension(mime = "") {
    const subtype = String(mime).toLowerCase().split("/").pop()?.split(";")[0];
    if (subtype === "jpeg") return "jpg";
    return ["png", "jpg", "pdf"].includes(subtype) ? subtype : null;
}

function dataImageParts(value = "") {
    const match = String(value).match(/^data:image\/(png|jpeg|jpg|pdf);base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) return null;
    return { extension: imageExtension(`image/${match[1]}`), content: match[2] };
}

function headerText(value = "") {
    return safeText(String(value).replace(/\{page\}/gi, "MACEVOPAGETOKEN"))
        .replace(/MACEVOPAGETOKEN/g, "\\thepage");
}

function createLayoutBlock(layout = {}) {
    const page = String(layout.pageSize || "A4").toLowerCase();
    const pageOption = PAGE_NAMES.has(`${page}paper`) ? `${page}paper` : "a4paper";
    const margins = layout.margins || {};
    const margin = (side) => Math.max(0, Math.min(100, Number(margins[side] ?? 25.4)));
    const orientation = layout.orientation === "landscape" ? ",landscape" : "";
    const geometry = `\\geometry{${pageOption}${orientation},top=${margin("top")}mm,right=${margin("right")}mm,bottom=${margin("bottom")}mm,left=${margin("left")}mm}`;

    const lines = [MARKER_START, geometry];
    const background = layout.background;
    if (validColor(background) && texColor(background) !== "FFFFFF") {
        const color = texColor(background);
        lines.push(`\\definecolor{macevopagebackground}{HTML}{${color}}`);
        lines.push("\\AtBeginDocument{\\pagecolor{macevopagebackground}}");
    }

    const border = layout.borders;
    if (border && typeof border === "object" && border.style && border.style !== "none" && validColor(border.color)) {
        const color = texColor(border.color);
        const width = Math.max(0.25, Math.min(12, Number(border.width) || 1));
        const dash = border.style === "dashed" ? "dash pattern=on 5pt off 3pt," : border.style === "dotted" ? "dash pattern=on 1pt off 2pt," : "";
        lines.push(`\\definecolor{macevopageborder}{HTML}{${color}}`);
        lines.push(`\\AddToShipoutPictureFG{\\AtPageLowerLeft{\\begin{tikzpicture}[remember picture,overlay]\\draw[${dash}line width=${width}pt,color=macevopageborder] ([xshift=12pt,yshift=12pt]current page.south west) rectangle ([xshift=-12pt,yshift=-12pt]current page.north east);\\end{tikzpicture}}}`);
    }

    const watermark = layout.watermark;
    if (watermark?.watermarkType === "text" && watermark.textContent) {
        const color = validColor(watermark.textColor) ? texColor(watermark.textColor) : "666666";
        const opacity = Math.max(0.02, Math.min(0.8, Number(watermark.opacity) || 0.15));
        const rotation = Math.max(-90, Math.min(90, Number(watermark.rotation) || 0));
        const scale = Math.max(40, Math.min(200, Number(watermark.scale) || 100));
        const fontSize = Math.max(18, Math.min(120, 48 * scale / 100));
        lines.push(`\\definecolor{macevowatermark}{HTML}{${color}}`);
        lines.push(`\\AddToShipoutPictureFG{\\AtPageCenter{\\begin{tikzpicture}[remember picture,overlay]\\node[rotate=${rotation},text=macevowatermark,opacity=${opacity},font=\\bfseries\\fontsize{${fontSize}pt}{${fontSize}pt}\\selectfont] at (current page.center) {${safeText(watermark.textContent)}};\\end{tikzpicture}}}`);
    } else if (watermark?.watermarkType === "image" && watermark.imageSrc) {
        const image = dataImageParts(watermark.imageSrc);
        if (image) {
            const scale = Math.max(20, Math.min(100, Number(watermark.scale) || 100));
            const opacity = Math.max(0.02, Math.min(0.8, Number(watermark.opacity) || 0.15));
            const rotation = Math.max(-90, Math.min(90, Number(watermark.rotation) || 0));
            const width = (scale * 0.01).toFixed(2);
            lines.push(`\\AddToShipoutPictureFG{\\AtPageCenter{\\begin{tikzpicture}[remember picture,overlay]\\node[rotate=${rotation},opacity=${opacity}] at (current page.center) {\\includegraphics[width=${width}\\paperwidth]{macevo-watermark.${image.extension}}};\\end{tikzpicture}}}`);
        }
    }

    const hf = layout.headerFooter || {};
    const headerLeft = headerText(hf.headerLeft || "");
    const headerRight = headerText(hf.headerRight || "");
    const footerLeft = headerText(hf.footerLeft || "");
    let footerRight = headerText(hf.footerRight || "");
    if (hf.showPageNumber && !/\\thepage/.test(footerRight)) {
        footerRight = [footerRight, "Page \\thepage"].filter(Boolean).join(" \\textbullet{} ");
    }
    if (headerLeft || headerRight || footerLeft || footerRight) {
        lines.push("\\pagestyle{fancy}", "\\fancyhf{}", "\\renewcommand{\\headrulewidth}{0.4pt}", "\\renewcommand{\\footrulewidth}{0pt}");
        if (headerLeft) lines.push(`\\fancyhead[L]{${headerLeft}}`);
        if (headerRight) lines.push(`\\fancyhead[R]{${headerRight}}`);
        if (footerLeft) lines.push(`\\fancyfoot[L]{${footerLeft}}`);
        if (footerRight) lines.push(`\\fancyfoot[R]{${footerRight}}`);
        lines.push("\\fancypagestyle{plain}{\\fancyhf{}\\renewcommand{\\headrulewidth}{0.4pt}\\renewcommand{\\footrulewidth}{0pt}}");
    }

    const columns = Number(layout.columns) === 2 ? 2 : 1;
    lines.push(MARKER_END);
    return { block: lines.join("\n"), columns };
}

export function applyEditorLayoutToLatex(source = "", layout = {}) {
    if (!source || !/\\begin\s*\{document\}/.test(source)) return source;
    const { block, columns } = createLayoutBlock(layout);
    let latex = source.replace(new RegExp(`${MARKER_START}[\\s\\S]*?${MARKER_END}\\s*`, "g"), "");

    const packageLines = ["geometry", "xcolor", "eso-pic", "tikz", "graphicx"];
    if (layout.headerFooter && Object.values(layout.headerFooter).some(Boolean)) packageLines.push("fancyhdr");
    const existingPackages = new Set([...latex.matchAll(/\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/g)].flatMap((match) => match[1].split(",").map((item) => item.trim())));
    const additions = packageLines.filter((item) => !existingPackages.has(item)).map((item) => `\\usepackage{${item}}`).join("\n");
    if (additions) {
        const documentClass = /\\documentclass(?:\[[^\]]*\])?\{[^}]+\}/;
        latex = documentClass.test(latex) ? latex.replace(documentClass, (match) => `${match}\n${additions}`) : `${additions}\n${latex}`;
    }

    // Replace the generated/default geometry setting with the exact editor values.
    latex = latex.replace(/\\geometry\s*\{[^}]*\}\s*/g, "");
    const begin = latex.match(/\\begin\s*\{document\}/);
    if (!begin || begin.index == null) return source;
    const before = latex.slice(0, begin.index);
    const after = latex.slice(begin.index + begin[0].length);
    const body = columns === 2 ? `\\twocolumn${after}` : after;
    return `${before}${block}\n\\begin{document}${body}`;
}

export function prepareLatexCompilation(source = "", layout = {}) {
    let latex = String(source || "");
    const assets = [];
    const known = new Map();
    const addAsset = (data, name, deduplicate = true) => {
        const parsed = dataImageParts(data);
        if (!parsed) return null;
        if (deduplicate && known.has(data)) return known.get(data);
        const fileName = `${name}.${parsed.extension}`;
        if (deduplicate) known.set(data, fileName);
        assets.push({ name: fileName, content: parsed.content });
        return fileName;
    };

    // Les images intégrées dans le HTML arrivent encodées dans \includegraphics.
    latex = latex.replace(/(\\includegraphics(?:\[[^\]]*\])?\{)(data:image\/(?:png|jpeg|jpg|pdf);base64,[A-Za-z0-9+/=]+)(\})/gi,
        (match, prefix, data, suffix) => {
            const fileName = addAsset(data, `macevo-image-${assets.length + 1}`);
            return fileName ? `${prefix}${fileName}${suffix}` : match;
        });

    const watermark = layout?.watermark;
    if (watermark?.watermarkType === "image" && watermark.imageSrc) {
        addAsset(watermark.imageSrc, "macevo-watermark", false);
    }
    return { latex: applyEditorLayoutToLatex(latex, layout), assets };
}

export default applyEditorLayoutToLatex;
