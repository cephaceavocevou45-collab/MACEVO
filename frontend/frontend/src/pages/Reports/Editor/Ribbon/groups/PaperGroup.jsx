/**
 * ===========================================================
 * MACEVO — ÉDITEUR SCIENTIFIQUE
 * -----------------------------------------------------------
 * Fichier : PaperGroup.jsx
 * Version : 4.0.0
 * Statut  : Gestion des formats de page
 * ===========================================================
 */

import { File } from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";

import { useLayoutContext } from "../../LayoutContext";

function PaperGroup() {
    const context = useLayoutContext() || {};

    const {
        layout,
        setPageSize,
    } = context;

    const currentPageSize = layout?.pageSize || "A4";

    const changePageSize = (size) => {
        if (typeof setPageSize !== "function") {
            return;
        }

        if (!["A3", "A4", "A5", "Letter", "Legal"].includes(size)) {
            return;
        }

        setPageSize(size);
    };

    return (
        <RibbonGroup
            title="Taille papier"
            className="w-[280px] min-w-[280px]"
        >
            <div className="grid w-full grid-cols-5 gap-1">
                <RibbonButton
                    icon={File}
                    label="A4"
                    tooltip="Format A4"
                    active={currentPageSize === "A4"}
                    onClick={() => changePageSize("A4")}
                />

                <RibbonButton
                    icon={File}
                    label="A3"
                    tooltip="Format A3"
                    active={currentPageSize === "A3"}
                    onClick={() => changePageSize("A3")}
                />

                <RibbonButton
                    icon={File}
                    label="A5"
                    tooltip="Format A5"
                    active={currentPageSize === "A5"}
                    onClick={() => changePageSize("A5")}
                />

                <RibbonButton
                    icon={File}
                    label="Lettre"
                    tooltip="Format Lettre"
                    active={currentPageSize === "Letter"}
                    onClick={() => changePageSize("Letter")}
                />

                <RibbonButton
                    icon={File}
                    label="Legal"
                    tooltip="Format Legal"
                    active={currentPageSize === "Legal"}
                    onClick={() => changePageSize("Legal")}
                />
            </div>
        </RibbonGroup>
    );
}

export default PaperGroup;
