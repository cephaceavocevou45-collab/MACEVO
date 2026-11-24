/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Composant : ToggleSwitch
 * Description : Interrupteur réutilisable
 * Version : 1.0.0
 * ==========================================================
 */

export default function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div className="flex items-center justify-between">

      {/* ==========================================
          Texte
      ========================================== */}

      <div className="flex-1 pr-6">

        <h4 className="font-semibold text-gray-900">
          {label}
        </h4>

        {description && (
          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>
        )}

      </div>

      {/* ==========================================
          Switch
      ========================================== */}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative
          inline-flex
          h-7
          w-14
          items-center
          rounded-full
          transition-all
          duration-300
          focus:outline-none
          focus:ring-4
          focus:ring-blue-200

          ${
            checked
              ? "bg-blue-600"
              : "bg-gray-300"
          }

          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }
        `}
      >

        <span
          className={`
            inline-block
            h-5
            w-5
            transform
            rounded-full
            bg-white
            shadow-md
            transition-all
            duration-300

            ${
              checked
                ? "translate-x-8"
                : "translate-x-1"
            }
          `}
        />

      </button>

    </div>
  );
}