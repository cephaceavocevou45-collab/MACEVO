/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : RibbonColorPicker.jsx
 * Version : 2.0.0
 * Statut  : Stable
 * ==========================================================
 */

import React, {
  memo,
  useRef,
} from "react";

/* ==========================================================
   COMPOSANT
========================================================== */

function RibbonColorPicker({
  value = "#000000",
  disabled = false,
  onChange,
  onBeforeOpen,
}) {
  const inputRef = useRef(null);

  /* --------------------------------------------------------
     OUVERTURE DU COLOR PICKER
  -------------------------------------------------------- */

  const openPicker = () => {
    if (disabled) return;

    // Permet au parent de mémoriser la sélection Tiptap
    // avant que le focus quitte l'éditeur.
    onBeforeOpen?.();

    inputRef.current?.click();
  };

  /* --------------------------------------------------------
     CHANGEMENT DE COULEUR
  -------------------------------------------------------- */

  const handleChange = (event) => {
    const color = event.target.value;

    if (!color) return;

    onChange?.(color);
  };

  /* --------------------------------------------------------
     RENDER
  -------------------------------------------------------- */

  return (
    <>
      <button
        type="button"
        onMouseDown={(event) => {
          /*
           * Empêche le bouton de prendre le focus avant
           * que la sélection Tiptap soit mémorisée.
           */
          event.preventDefault();

          if (disabled) return;

          onBeforeOpen?.();
        }}
        onClick={openPicker}
        disabled={disabled}
        className="
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-lg
          border
          border-gray-300
          bg-white
          hover:bg-gray-50
          transition-all
          duration-150
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
        title="Choisir une couleur"
        aria-label="Choisir une couleur"
      >
        <div
          className="
            w-5
            h-5
            rounded
            border
            border-gray-400
          "
          style={{
            backgroundColor: value,
          }}
        />
      </button>

      <input
        ref={inputRef}
        type="color"
        value={value}
        disabled={disabled}
        className="hidden"
        onChange={handleChange}
        aria-label="Sélecteur de couleur"
      />
    </>
  );
}

/* ==========================================================
   EXPORT
========================================================== */

export default memo(RibbonColorPicker);