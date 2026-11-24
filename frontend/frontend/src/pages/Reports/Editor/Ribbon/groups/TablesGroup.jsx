/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : TablesGroup.jsx
 * Version  : 4.0.0
 * Statut  : Professionnel — gestion des tableaux scientifiques
 * ==========================================================
 */

import { useState } from "react";
import {
  Table,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";

import RibbonGroup from "../components/RibbonGroup";
import RibbonButton from "../components/buttons/RibbonButton";
import TableGallery from "../components/TableGallery";

function TablesGroup({ editor }) {
  const [showGallery, setShowGallery] = useState(false);

  if (!editor) {
    return null;
  }

  /**
   * ========================================================
   * ÉTAT DU CURSEUR
   * ========================================================
   *
   * Tiptap expose les capacités réelles disponibles à
   * l'emplacement courant.
   */

  const canAddRow = editor.can().addRowAfter();
  const canAddColumn = editor.can().addColumnAfter();
  const canDeleteTable = editor.can().deleteTable();

  const isInsideTable =
    canAddRow ||
    canAddColumn ||
    canDeleteTable;


  /**
   * ========================================================
   * AJOUTER UNE LIGNE
   * ========================================================
   */

  const addRow = () => {
    if (!editor.can().addRowAfter()) {
      return;
    }

    try {
      editor
        .chain()
        .focus()
        .addRowAfter()
        .run();
    } catch (error) {
      console.error(
        "MACEVO — impossible d'ajouter une ligne :",
        error
      );
    }
  };


  /**
   * ========================================================
   * AJOUTER UNE COLONNE
   * ========================================================
   */

  const addColumn = () => {
    if (!editor.can().addColumnAfter()) {
      return;
    }

    try {
      editor
        .chain()
        .focus()
        .addColumnAfter()
        .run();
    } catch (error) {
      console.error(
        "MACEVO — impossible d'ajouter une colonne :",
        error
      );
    }
  };


  /**
   * ========================================================
   * SUPPRIMER LE TABLEAU
   * ========================================================
   */

  const deleteTable = () => {
    if (!editor.can().deleteTable()) {
      return;
    }

    try {
      editor
        .chain()
        .focus()
        .deleteTable()
        .run();
    } catch (error) {
      console.error(
        "MACEVO — impossible de supprimer le tableau :",
        error
      );
    }
  };


  /**
   * ========================================================
   * OUVRIR LA GALERIE
   * ========================================================
   */

  const openGallery = () => {
    setShowGallery(true);
  };


  /**
   * ========================================================
   * SÉLECTION D'UN MODÈLE
   * ========================================================
   */

  const handleSelectTable = (selection) => {
    if (!selection) {
      return;
    }

    const {
      rows,
      cols,
      withHeaderRow,
    } = selection;

    const safeRows = Number(rows);
    const safeCols = Number(cols);

    if (
      !Number.isInteger(safeRows) ||
      !Number.isInteger(safeCols) ||
      safeRows < 1 ||
      safeCols < 1
    ) {
      console.warn(
        "MACEVO — dimensions de tableau invalides :",
        selection
      );

      return;
    }

    try {
      const inserted = editor
        .chain()
        .focus()
        .insertTable({
          rows: safeRows,
          cols: safeCols,
          withHeaderRow: Boolean(withHeaderRow),
        })
        .run();

      if (inserted) {
        setShowGallery(false);
      }
    } catch (error) {
      console.error(
        "MACEVO — impossible d'insérer le tableau :",
        error
      );
    }
  };


  /**
   * ========================================================
   * RENDU
   * ========================================================
   */

  return (
    <>
      <RibbonGroup
        title="Tableaux"
        className="w-[220px] min-w-[220px]"
      >

        {/* ==================================================
            GALERIE
        ================================================== */}

        <RibbonButton
          icon={Table}
          label="Tableau"
          tooltip="Insérer un tableau scientifique"
          onClick={openGallery}
        />


        {/* ==================================================
            LIGNE
        ================================================== */}

        <RibbonButton
          icon={Rows3}
          label="Ligne"
          tooltip={
            isInsideTable
              ? "Ajouter une ligne après la ligne actuelle"
              : "Placez le curseur dans un tableau"
          }
          disabled={!canAddRow}
          onClick={addRow}
        />


        {/* ==================================================
            COLONNE
        ================================================== */}

        <RibbonButton
          icon={Columns3}
          label="Colonne"
          tooltip={
            isInsideTable
              ? "Ajouter une colonne après la colonne actuelle"
              : "Placez le curseur dans un tableau"
          }
          disabled={!canAddColumn}
          onClick={addColumn}
        />


        {/* ==================================================
            SUPPRIMER
        ================================================== */}

        <RibbonButton
          icon={Trash2}
          label="Supprimer"
          tooltip={
            isInsideTable
              ? "Supprimer le tableau actuel"
              : "Placez le curseur dans un tableau"
          }
          disabled={!canDeleteTable}
          onClick={deleteTable}
        />

      </RibbonGroup>


      {/* ====================================================
          GALERIE DES TABLEAUX
      ==================================================== */}

      {showGallery && (
        <TableGallery
          editor={editor}
          onSelect={handleSelectTable}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}

export default TablesGroup;