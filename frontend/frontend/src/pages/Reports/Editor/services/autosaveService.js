// ======================================================
// MACEVO
// Service de sauvegarde automatique
// ======================================================

import { autoSaveDocument } from "./saveService";

// ======================================================
// Variables internes
// ======================================================

let timer = null;

const AUTO_SAVE_DELAY = 3000; // 3 secondes

// ======================================================
// Démarrer la sauvegarde automatique
// ======================================================

export function startAutoSave(editor) {

  if (!editor) return;

  editor.on("update", () => {

    if (timer) {

      clearTimeout(timer);

    }

    timer = setTimeout(async () => {

      const html = editor.getHTML();

      await autoSaveDocument(html);

      console.log("✔ Sauvegarde automatique effectuée");

    }, AUTO_SAVE_DELAY);

  });

}

// ======================================================
// Arrêter la sauvegarde automatique
// ======================================================

export function stopAutoSave() {

  if (timer) {

    clearTimeout(timer);

    timer = null;

  }

}

// ======================================================
// Sauvegarde immédiate
// ======================================================

export async function forceAutoSave(editor) {

  if (!editor) return;

  const html = editor.getHTML();

  await autoSaveDocument(html);

}

// ======================================================
// Vérifier si le document a été modifié
// ======================================================

export function documentHasChanged(editor) {

  if (!editor) return false;

  return editor.isEmpty === false;

}