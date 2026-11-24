// ======================================================
// MACEVO
// Gestion des actions du document
// ======================================================

import {
  saveDocument,
  autoSaveDocument,
} from "../services/saveService";

import {
  openDocument,
} from "../services/openService";

// ======================================================
// Nouveau document
// ======================================================

export function createNewDocument(editor) {

  if (!editor) return;

  const confirmed = window.confirm(
    "Voulez-vous créer un nouveau document ?\n\nLes modifications non enregistrées seront perdues."
  );

  if (!confirmed) return;

  editor.commands.clearContent(true);

  editor.commands.focus();

}

// ======================================================
// Ouvrir
// ======================================================

export async function openExistingDocument(editor) {

  if (!editor) return;

  const content = await openDocument();

  if (!content) return;

  editor.commands.setContent(content);

}

// ======================================================
// Enregistrer
// ======================================================

export async function saveCurrentDocument(editor) {

  if (!editor) return;

  const html = editor.getHTML();

  await saveDocument(html);

}

// ======================================================
// Sauvegarde automatique
// ======================================================

export async function autoSave(editor) {

  if (!editor) return;

  const html = editor.getHTML();

  await autoSaveDocument(html);

}