/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Composant : SelectField
 * Description : Liste déroulante réutilisable
 * Version : 1.0.0
 * ==========================================================
 */

import { ChevronDown } from "lucide-react";

export default function SelectField({
  label,
  description,
  value,
  options = [],
  onChange,
  disabled = false,
}) {
  return (
    <div className="space-y-2">

      {/* ==========================================
          Libellé
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
          Champ Select
      ========================================== */}

      <div className="relative">

        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full
            appearance-none
            rounded-2xl
            border
            border-gray-300
            bg-white
            px-4
            py-3
            pr-12
            text-gray-900
            transition
            duration-200
            outline-none
            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-100
            disabled:bg-gray-100
            disabled:cursor-not-allowed
          "
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Icône */}

        <ChevronDown
          size={20}
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-gray-400
            pointer-events-none
          "
        />

      </div>

    </div>
  );
}