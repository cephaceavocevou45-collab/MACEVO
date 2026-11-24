/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Composant : SaveSettingsButton
 * Description : Bouton d'enregistrement réutilisable
 * Version : 1.0.0
 * ==========================================================
 */

import { Save, Loader2 } from "lucide-react";

export default function SaveSettingsButton({
  loading = false,
  text = "Enregistrer les modifications",
  onClick,
  type = "submit",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="
        inline-flex
        items-center
        justify-center
        gap-3
        px-6
        py-3
        rounded-2xl
        bg-blue-600
        hover:bg-blue-700
        disabled:bg-blue-400
        disabled:cursor-not-allowed
        text-white
        font-semibold
        transition-all
        duration-300
        shadow-md
        hover:shadow-lg
      "
    >
      {loading ? (
        <>
          <Loader2
            size={18}
            className="animate-spin"
          />

          Enregistrement...
        </>
      ) : (
        <>
          <Save size={18} />

          {text}
        </>
      )}
    </button>
  );
}