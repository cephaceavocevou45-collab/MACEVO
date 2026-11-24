import { useState } from "react";
import {
  Eye,
  Pencil,
  MoreVertical,
  Calendar,
  Clock,
} from "lucide-react";

import ReportMenu from "./ReportMenu";

// Formateur de date utilitaire
function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export default function ReportCard({
  report,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onExportPDF,
  onExportWord,
  onPin,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative bg-white dark:bg-[#161b22] rounded-2xl shadow-md hover:shadow-xl transition duration-300 border border-slate-200 dark:border-slate-800/80">
      {/* ========================= */}
      {/* En-tête */}
      {/* ========================= */}

      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {report.title}
            </h2>

            <p className="text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 text-sm">
              {report.description || "Aucune description."}
            </p>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          >
            <MoreVertical size={22} />
          </button>
        </div>

        {/* Informations */}
        <div className="flex flex-wrap gap-6 mt-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span>Créé le {formatDate(report.created_at)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <span>Modifié le {formatDate(report.updated_at)}</span>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => onView(report)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition text-sm shadow-sm"
          >
            <Eye size={18} />
            Voir
          </button>

          <button
            onClick={() => onEdit(report)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl font-medium transition text-sm"
          >
            <Pencil size={18} />
            Modifier
          </button>
        </div>
      </div>

      {/* ========================= */}
      {/* Menu */}
      {/* ========================= */}

      {menuOpen && (
        <ReportMenu
          report={report}
          onDuplicate={(r) => {
            setMenuOpen(false);
            onDuplicate?.(r);
          }}
          onExportPDF={(r) => {
            setMenuOpen(false);
            onExportPDF?.(r);
          }}
          onExportWord={(r) => {
            setMenuOpen(false);
            onExportWord?.(r);
          }}
          onPin={(r) => {
            setMenuOpen(false);
            onPin?.(r);
          }}
          onDelete={(id) => {
            setMenuOpen(false);
            onDelete?.(id);
          }}
        />
      )}
    </div>
  );
}