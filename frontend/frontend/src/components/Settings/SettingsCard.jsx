/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Composant : SettingsCard
 * Description : Carte réutilisable pour les paramètres
 * Version : 1.0.0
 * ==========================================================
 */

export default function SettingsCard({
  title,
  description,
  icon,
  children,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 transition-all duration-300 hover:shadow-xl">

      {/* ============================
          En-tête
      ============================= */}

      <div className="flex items-start gap-4">

        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}

        <div className="flex-1">

          <h2 className="text-2xl font-bold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="text-gray-500 mt-2">
              {description}
            </p>
          )}

        </div>

      </div>

      {/* ============================
          Contenu
      ============================= */}

      <div className="mt-8 space-y-6">

        {children}

      </div>

    </div>
  );
}