/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexTab.jsx
 * Description : Onglet LaTeX
 * Version : 1.0.0
 * Statut : Développement
 * ==========================================================
 */

import { Code2, BookOpenCheck } from "lucide-react";

function LatexTab() {

    return (

        <div className="flex h-full min-h-0 w-full items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 sm:px-6">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                <Code2 size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 sm:text-sm">Atelier LaTeX scientifique</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">Source synchronisée, aperçu PDF et journal de compilation</p>
            </div>
            <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 sm:inline-flex">
                <BookOpenCheck size={13} aria-hidden="true" />
                Source du document
            </span>
        </div>

    );

}

export default LatexTab;
