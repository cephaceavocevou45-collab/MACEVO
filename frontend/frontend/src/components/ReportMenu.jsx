import { useEffect, useRef } from "react";
import {
  Copy,
  FileDown,
  FileText,
  Star,
  Share2,
  Archive,
  Globe,
  Trash2,
} from "lucide-react";

export default function ReportMenu({
  report,
  onDuplicate,
  onExportPDF,
  onExportWord,
  onPin,
  onShare,
  onArchive,
  onPublish,
  onDelete,
  onClose,
}) {
  const menuRef = useRef(null);

  // Ferme le menu si on clique à l'extérieur ou appuie sur Échap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleAction = (callback) => {
    if (callback && report) {
      callback(report);
      onClose?.();
    }
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute right-4 top-14 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 py-2"
    >
      <button
        role="menuitem"
        onClick={() => handleAction(onDuplicate)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <Copy size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Dupliquer</span>
      </button>

      <button
        role="menuitem"
        onClick={() => handleAction(onExportPDF)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <FileDown size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Exporter en PDF</span>
      </button>

      <button
        role="menuitem"
        onClick={() => handleAction(onExportWord)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <FileText size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Exporter en Word</span>
      </button>

      <button
        role="menuitem"
        onClick={() => handleAction(onPin)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <Star
          size={18}
          className={report?.is_pinned ? "text-amber-500 fill-amber-500" : "text-gray-500"}
        />
        <span className="text-sm font-medium">
          {report?.is_pinned ? "Retirer des favoris" : "Épingler"}
        </span>
      </button>

      <hr className="my-2 border-gray-100" />

      <button
        role="menuitem"
        onClick={() => handleAction(onShare)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <Share2 size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Partager</span>
      </button>

      <button
        role="menuitem"
        onClick={() => handleAction(onArchive)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <Archive size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Archiver</span>
      </button>

      <button
        role="menuitem"
        onClick={() => handleAction(onPublish)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
      >
        <Globe size={18} className="text-gray-500" />
        <span className="text-sm font-medium">Publier</span>
      </button>

      <hr className="my-2 border-gray-100" />

      <button
        role="menuitem"
        onClick={() => handleAction(onDelete)}
        className="flex items-center gap-3 w-full px-5 py-2.5 text-red-600 hover:bg-red-50 transition cursor-pointer"
      >
        <Trash2 size={18} />
        <span className="text-sm font-medium">Supprimer</span>
      </button>
    </div>
  );
}