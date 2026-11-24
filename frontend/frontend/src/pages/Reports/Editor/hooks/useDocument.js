// ======================================================
// MACEVO
// Hook principal de gestion du document
// ======================================================

import { useState, useCallback } from "react";

import {
  createNewDocument,
  openExistingDocument,
  saveCurrentDocument,
  autoSave,
} from "../actions/documentActions";

export default function useDocument(editor) {

  // =====================================
  // États
  // =====================================

  const [isModified, setIsModified] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [documentTitle, setDocumentTitle] = useState("Nouveau document");

  // =====================================
  // Nouveau document
  // =====================================

  const newDocument = useCallback(() => {

    createNewDocument(editor);

    setDocumentTitle("Nouveau document");

    setIsModified(false);

  }, [editor]);

  // =====================================
  // Ouvrir
  // =====================================

  const openDocument = useCallback(async () => {

    await openExistingDocument(editor);

    setIsModified(false);

  }, [editor]);

  // =====================================
  // Sauvegarder
  // =====================================

  const saveDocument = useCallback(async () => {

    setIsSaving(true);

    await saveCurrentDocument(editor);

    setIsSaving(false);

    setIsModified(false);

  }, [editor]);

  // =====================================
  // Sauvegarde automatique
  // =====================================

  const autoSaveDocument = useCallback(async () => {

    await autoSave(editor);

  }, [editor]);

  // =====================================
  // Modification
  // =====================================

  const markAsModified = useCallback(() => {

    setIsModified(true);

  }, []);

  return {

    documentTitle,

    setDocumentTitle,

    isModified,

    isSaving,

    newDocument,

    openDocument,

    saveDocument,

    autoSaveDocument,

    markAsModified,

  };

}