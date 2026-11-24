/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Composant : RangeSlider
 * Description : Curseur réutilisable
 * Version : 1.0.0
 * ==========================================================
 */

export default function RangeSlider({
  label,
  description,
  value,
  min = 0,
  max = 100,
  step = 1,
  leftLabel,
  rightLabel,
  onChange,
  disabled = false,
}) {
  return (
    <div className="space-y-4">

      {/* ==========================================
          Titre
      ========================================== */}

      <div>

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
          Curseur
      ========================================== */}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className="
          w-full
          h-2
          rounded-full
          cursor-pointer
          accent-blue-600
          disabled:opacity-50
        "
      />

      {/* ==========================================
          Informations
      ========================================== */}

      <div className="flex justify-between items-center">

        <span className="text-sm text-gray-500">
          {leftLabel}
        </span>

        <span className="font-bold text-blue-600">
          {value}
        </span>

        <span className="text-sm text-gray-500">
          {rightLabel}
        </span>

      </div>

    </div>
  );
}