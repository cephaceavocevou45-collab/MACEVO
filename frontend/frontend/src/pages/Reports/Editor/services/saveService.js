// ======================================================
// MACEVO
// Service de sauvegarde
// Local + Backend
// ======================================================

import api from "../../../../api/axios";

const LOCAL_KEY = "macevo-current-document";

function getCurrentReportId() {
  try {
    const currentReport = JSON.parse(
      sessionStorage.getItem("macevo_current_report") || "null"
    );
    return currentReport?.reportId || null;
  } catch {
    return null;
  }
}

async function saveReportContent(content) {
  const reportId = getCurrentReportId();
  if (!reportId) return;

  await api.patch(`reports/${reportId}/`, { content });
}

//=======================================================
// Sauvegarde locale
//=======================================================

export async function saveDocument(content) {

  const document = {

    id: crypto.randomUUID(),

    title: "Nouveau document",

    content,

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),

    version: 1,

    language: "fr",

    template: "article",

    status: "draft",

    autosaved: false,

  };

  // Sauvegarde navigateur

  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(document)
  );

  try {
    await saveReportContent(content);
  } catch (error) {
    console.error(
      "Backend indisponible : la copie locale est conservée.",
      error
    );
  }

}

//=======================================================
// Sauvegarde automatique
//=======================================================

export async function autoSaveDocument(content) {

  const existing = JSON.parse(
    localStorage.getItem(LOCAL_KEY) || "{}"
  );

  const document = {

    ...existing,

    content,

    updatedAt: new Date().toISOString(),

    autosaved: true,

  };

  localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(document)
  );

  try {
    await saveReportContent(content);
  } catch {
    // On ne bloque jamais l'utilisateur.
    // La copie locale reste disponible.
  }

}

//=======================================================
// Charger la dernière sauvegarde locale
//=======================================================

export function loadLocalDocument() {

  const saved = localStorage.getItem(LOCAL_KEY);

  if (!saved) return null;

  return JSON.parse(saved);

}

//=======================================================
// Supprimer le document courant
//=======================================================

export function clearLocalDocument() {

  localStorage.removeItem(LOCAL_KEY);

}