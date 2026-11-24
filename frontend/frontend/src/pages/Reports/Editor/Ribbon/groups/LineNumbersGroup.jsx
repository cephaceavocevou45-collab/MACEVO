import { useEffect } from "react";
import { Eye, EyeOff, Hash } from "lucide-react";
import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";
import { useEditorContext } from "../../EditorContext";
import { useLayoutContext } from "../../LayoutContext";

function LineNumbersGroup() {
    const { editor } = useEditorContext();
    const { layout, setLineNumbers } = useLayoutContext();
    const mode = layout.lineNumbers || "disable";

    useEffect(() => {
        const root = editor?.view?.dom;
        const wrapper = root?.parentElement;
        if (!root || !wrapper) return undefined;

        let gutter = wrapper.querySelector(":scope > .macevo-line-numbers-gutter");
        if (mode === "disable") {
            gutter?.remove();
            return undefined;
        }
        if (!gutter) {
            gutter = document.createElement("div");
            gutter.className = "macevo-line-numbers-gutter";
            Object.assign(gutter.style, {
                position: "absolute", left: "4px", top: "0", width: "32px",
                pointerEvents: "none", userSelect: "none", zIndex: "5",
                font: "10px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#94a3b8",
            });
            wrapper.style.position = "relative";
            wrapper.appendChild(gutter);
        }

        const render = () => {
            gutter.replaceChildren();
            const wrapperTop = wrapper.getBoundingClientRect().top;
            const rootTop = root.getBoundingClientRect().top;
            const pageStep = Number.parseFloat(getComputedStyle(root).getPropertyValue("--macevo-page-step")) || 1151;
            const blocks = root.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,blockquote,pre");
            let number = 1;
            let lastPage = 0;
            blocks.forEach((block) => {
                const range = document.createRange();
                range.selectNodeContents(block);
                const rects = Array.from(range.getClientRects()).filter((rect) => rect.height > 0);
                const lines = rects.length ? rects : [block.getBoundingClientRect()];
                lines.forEach((rect) => {
                    if (!rect.height) return;
                    const page = Math.floor(Math.max(0, rect.top - rootTop) / pageStep);
                    if (mode === "enable" && page !== lastPage) number = 1;
                    lastPage = page;
                    const line = document.createElement("span");
                    line.textContent = String(number++);
                    Object.assign(line.style, {
                        position: "absolute", right: "3px",
                        top: `${Math.max(0, rect.top - wrapperTop)}px`,
                        height: `${Math.max(14, rect.height)}px`,
                        lineHeight: `${Math.max(14, rect.height)}px`,
                        whiteSpace: "nowrap",
                    });
                    gutter.appendChild(line);
                });
            });
        };

        let frame = 0;
        const refresh = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(render);
        };
        refresh();
        editor.on("update", refresh);
        window.addEventListener("resize", refresh);
        const observer = new MutationObserver(refresh);
        observer.observe(root, { subtree: true, childList: true, characterData: true });
        return () => {
            cancelAnimationFrame(frame);
            editor.off("update", refresh);
            window.removeEventListener("resize", refresh);
            observer.disconnect();
        };
    }, [editor, mode]);

    return (
        <RibbonGroup title="Numéros de ligne" className="w-[210px] min-w-[210px]">
            <div className="grid w-full grid-cols-3 gap-1">
                <RibbonButton icon={Hash} label="Activer" tooltip="Numérotation recommencée à chaque page" active={mode === "enable"} onClick={() => setLineNumbers("enable")} />
                <RibbonButton icon={Eye} label="Contin." tooltip="Numérotation continue dans le document" active={mode === "continuous"} onClick={() => setLineNumbers("continuous")} />
                <RibbonButton icon={EyeOff} label="Masquer" tooltip="Masquer les numéros de ligne" active={mode === "disable"} onClick={() => setLineNumbers("disable")} />
            </div>
        </RibbonGroup>
    );
}

export default LineNumbersGroup;
