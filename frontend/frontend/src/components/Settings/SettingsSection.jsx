/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Composant : SettingsSection
 * Description : Section réutilisable à l'intérieur d'une carte
 * Version : 1.0.0
 * ==========================================================
 */

export default function SettingsSection({
  title,
  description,
  children,
}) {
  return (
    <div className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">

      {/* ============================
          Titre
      ============================= */}

      <div className="mb-4">

        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>
        )}

      </div>

      {/* ============================
          Contenu
      ============================= */}

      <div className="space-y-4">

        {children}

      </div>

    </div>
  );
}