/**
 * ===========================================================
 * MACEVO
 * -----------------------------------------------------------
 * Fichier : RibbonGroup.jsx
 * Description : Conteneur standard des groupes du ruban
 * ===========================================================
 */

import React, { memo } from "react";
import { ChevronDown } from "lucide-react";

function RibbonGroup({
    title,
    children,
    className = "",
    width = "w-auto",
    hasDialogLauncher = false,
    onDialogLauncherClick,
}) {
    return (
        <div
            className={`
                flex
                h-[100px]
                ${width}
                shrink-0
                flex-col
                justify-between
                px-1.5
                py-0.5
                relative
                ${className}
            `}
        >
            {/* ZONE DES COMMANDES */}
            <div className="flex h-[76px] w-full items-start content-start flex-wrap gap-1 overflow-hidden">
                {children}
            </div>

            {/* TITRE DU GROUPE + LANCEUR */}
            <div className="flex h-[20px] w-full items-center justify-center relative border-t border-transparent">
                <span
                    className="
                        max-w-full
                        truncate
                        px-1
                        text-center
                        text-[10px]
                        font-medium
                        leading-none
                        text-slate-500
                        select-none
                    "
                    title={title}
                >
                    {title}
                </span>

                {hasDialogLauncher && (
                    <button
                        type="button"
                        onClick={onDialogLauncherClick}
                        className="absolute bottom-0 right-0 flex h-3 w-3 items-center justify-center text-slate-400 hover:text-slate-700 focus:outline-none"
                    >
                        <ChevronDown size={10} strokeWidth={3} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default memo(RibbonGroup);