// ======================================================
// MACEVO
// Service d'ouverture des documents
// DOCX • TEX • TXT • Projet MACEVO
// ======================================================

import { loadLocalDocument } from "./saveService";

// ======================================================
// Ouvrir un document
// ======================================================

export async function openDocument() {

  return new Promise((resolve) => {

    const input = document.createElement("input");

    input.type = "file";

    input.accept = ".txt,.tex,.docx,.macevo";

    input.onchange = async (event) => {

      const file = event.target.files[0];

      if (!file) {

        resolve(null);

        return;

      }

      const extension = file.name
        .split(".")
        .pop()
        .toLowerCase();

      // ==========================================
      // TXT
      // ==========================================

      if (extension === "txt") {

        const text = await file.text();

        resolve(text);

        return;

      }

      // ==========================================
      // TEX
      // ==========================================

      if (extension === "tex") {

        const text = await file.text();

        resolve(text);

        return;

      }

      // ==========================================
      // DOCX
      // (sera converti avec Mammoth dans la Phase B)
      // ==========================================

      if (extension === "docx") {

        alert(
          "La conversion DOCX → MACEVO sera activée durant la Phase B."
        );

        resolve(null);

        return;

      }

      // ==========================================
      // Projet MACEVO
      // ==========================================

      if (extension === "macevo") {

        const text = await file.text();

        try {

          const document = JSON.parse(text);

          resolve(document.content);

        } catch {

          alert("Projet MACEVO invalide.");

          resolve(null);

        }

        return;

      }

      resolve(null);

    };

    input.click();

  });

}

// ======================================================
// Charger la dernière sauvegarde locale
// ======================================================

export function openLastLocalDocument() {

  const document = loadLocalDocument();

  if (!document) return null;

  return document.content;

}