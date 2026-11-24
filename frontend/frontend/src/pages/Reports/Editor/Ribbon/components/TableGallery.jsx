/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : TableGallery.jsx
 * Version : 2.0.0
 * Statut  : Stable
 * ----------------------------------------------------------
 * Sélecteur interactif de tableaux
 * ==========================================================
 */

import {
  X,
  Table2,
  Check,
} from "lucide-react";

import { useState } from "react";

/* ==========================================================
   CONFIGURATION
========================================================== */

const MAX_ROWS = 10;
const MAX_COLS = 10;

/* ==========================================================
   COMPOSANT
========================================================== */

function TableGallery({
  onSelect,
  onClose,
}) {
  const [hoveredCell, setHoveredCell] =
    useState({
      rows: 1,
      cols: 1,
    });

  const [selectedCell, setSelectedCell] =
    useState({
      rows: 1,
      cols: 1,
    });

  const [withHeaderRow, setWithHeaderRow] =
    useState(true);

  /* ========================================================
     SURVOL D'UNE CELLULE
  ======================================================== */

  const handleCellEnter = (
    row,
    col
  ) => {
    setHoveredCell({
      rows: row,
      cols: col,
    });
  };

  /* ========================================================
     SÉLECTION
  ======================================================== */

  const handleCellClick = (
    row,
    col
  ) => {
    setSelectedCell({
      rows: row,
      cols: col,
    });
  };

  /* ========================================================
     INSERTION
  ======================================================== */

  const insertTable = () => {
    onSelect({
      rows: selectedCell.rows,
      cols: selectedCell.cols,
      withHeaderRow,
    });
  };

  /* ========================================================
     RENDU
  ======================================================== */

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-6">

      <div className="flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              bg-blue-50
              text-blue-600
            ">
              <Table2 size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Insérer un tableau
              </h2>

              <p className="text-xs text-slate-500">
                Sélectionnez le nombre de lignes et de colonnes.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-md
              p-2
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-900
            "
            title="Fermer"
          >
            <X size={20} />
          </button>

        </div>

        {/* ==================================================
            CONTENU
        ================================================== */}

        <div className="overflow-y-auto p-6">

          {/* ==================================================
              INDICATEUR DIMENSIONS
          ================================================== */}

          <div className="mb-5 text-center">

            <div className="text-2xl font-semibold text-slate-800">
              {hoveredCell.rows} ×{" "}
              {hoveredCell.cols}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              {hoveredCell.rows} ligne
              {hoveredCell.rows > 1
                ? "s"
                : ""}{" "}
              ×{" "}
              {hoveredCell.cols} colonne
              {hoveredCell.cols > 1
                ? "s"
                : ""}
            </div>

          </div>

          {/* ==================================================
              GRILLE
          ================================================== */}

          <div className="flex justify-center">

            <div
              className="
                rounded-lg
                border
                border-slate-300
                bg-slate-50
                p-3
                shadow-sm
              "
              onMouseLeave={() =>
                setHoveredCell(
                  selectedCell
                )
              }
            >

              <div
                className="grid gap-[2px]"
                style={{
                  gridTemplateColumns:
                    `repeat(${MAX_COLS}, 34px)`,
                }}
              >

                {Array.from({
                  length:
                    MAX_ROWS *
                    MAX_COLS,
                }).map(
                  (_, index) => {
                    const row =
                      Math.floor(
                        index /
                          MAX_COLS
                      ) + 1;

                    const col =
                      (index %
                        MAX_COLS) +
                      1;

                    const isHighlighted =
                      row <=
                        hoveredCell.rows &&
                      col <=
                        hoveredCell.cols;

                    const isSelected =
                      row <=
                        selectedCell.rows &&
                      col <=
                        selectedCell.cols;

                    return (
                      <button
                        key={`${row}-${col}`}
                        type="button"
                        aria-label={`${row} lignes × ${col} colonnes`}
                        onMouseEnter={() =>
                          handleCellEnter(
                            row,
                            col
                          )
                        }
                        onFocus={() =>
                          handleCellEnter(
                            row,
                            col
                          )
                        }
                        onClick={() =>
                          handleCellClick(
                            row,
                            col
                          )
                        }
                        className={`
                          h-[34px]
                          w-[34px]
                          rounded-[3px]
                          border
                          transition
                          duration-75
                          ${
                            isHighlighted
                              ? "border-blue-500 bg-blue-200"
                              : "border-slate-300 bg-white hover:border-blue-400"
                          }
                          ${
                            isSelected &&
                            isHighlighted
                              ? "ring-1 ring-blue-500"
                              : ""
                          }
                        `}
                      />
                    );
                  }
                )}

              </div>

            </div>

          </div>

          {/* ==================================================
              AIDE
          ================================================== */}

          <div className="mt-4 text-center text-xs text-slate-500">
            Déplacez la souris sur la grille pour choisir la dimension.
          </div>

          {/* ==================================================
              DIMENSION SÉLECTIONNÉE
          ================================================== */}

          <div className="
            mx-auto
            mt-5
            max-w-md
            rounded-lg
            border
            border-slate-200
            bg-slate-50
            p-4
          ">

            <div className="flex items-center justify-between">

              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Dimension sélectionnée
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {selectedCell.rows} ×{" "}
                  {selectedCell.cols}
                </div>
              </div>

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-green-50
                text-green-600
              ">
                <Check size={18} />
              </div>

            </div>

          </div>

          {/* ==================================================
              OPTIONS
          ================================================== */}

          <div className="mx-auto mt-4 max-w-md">

            <label className="
              flex
              cursor-pointer
              items-center
              gap-3
              rounded-lg
              border
              border-slate-200
              bg-white
              p-3
              hover:bg-slate-50
            ">

              <input
                type="checkbox"
                checked={
                  withHeaderRow
                }
                onChange={(event) =>
                  setWithHeaderRow(
                    event.target.checked
                  )
                }
                className="
                  h-4
                  w-4
                  rounded
                  border-slate-300
                  text-blue-600
                "
              />

              <div>
                <div className="text-sm font-medium text-slate-700">
                  Ajouter une ligne d'en-tête
                </div>

                <div className="text-[11px] text-slate-500">
                  Recommandé pour les tableaux scientifiques.
                </div>
              </div>

            </label>

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="
          flex
          items-center
          justify-between
          border-t
          border-slate-200
          bg-slate-50
          px-5
          py-3
        ">

          <div className="text-xs text-slate-500">
            Tableau :{" "}
            <strong className="text-slate-700">
              {selectedCell.rows} ×{" "}
              {selectedCell.cols}
            </strong>
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-md
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-slate-700
                hover:bg-slate-100
              "
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={insertTable}
              className="
                flex
                items-center
                gap-2
                rounded-md
                bg-blue-600
                px-4
                py-2
                text-sm
                font-medium
                text-white
                hover:bg-blue-700
              "
            >
              <Check size={17} />
              Insérer
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default TableGallery;
