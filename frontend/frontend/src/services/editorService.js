import api from "../api/axios";

/**
 * ============================================================
 * MACEVO — EDITOR SERVICE
 * ============================================================
 *
 * Couche API dédiée à l'éditeur scientifique MACEVO.
 *
 * Backend :
 *
 * GET    /api/editeur/{reportId}/
 * GET    /api/editeur/{reportId}/structure/
 * GET    /api/editeur/{reportId}/validation/
 * GET    /api/editeur/{reportId}/statistics/
 *
 * GET    /api/editeur/assets/
 * POST   /api/editeur/assets/
 * GET    /api/editeur/assets/{id}/
 * PATCH  /api/editeur/assets/{id}/
 * PUT    /api/editeur/assets/{id}/
 * DELETE /api/editeur/assets/{id}/
 *
 * GET    /api/editeur/{reportId}/export/{format}/
 *
 * ============================================================
 *
 * ARCHITECTURE
 * ------------------------------------------------------------
 *
 * Le modèle Report reste le document canonique.
 *
 * Ce service ne crée aucun modèle Document supplémentaire.
 *
 * Les opérations générales du rapport restent dans :
 *
 *     reportService.js
 *
 * Les opérations spécifiques à l'éditeur restent ici :
 *
 *     bootstrap
 *     assets
 *     structure
 *     validation
 *     statistiques
 *     export
 *
 * ============================================================
 */

/* ============================================================
   UTILITAIRES
============================================================ */

/**
 * Vérifie qu'un identifiant existe.
 *
 * @param {number|string} value
 * @param {string} message
 * @returns {number|string}
 */
function requireId(value, message) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    throw new Error(message);
  }

  return value;
}


/**
 * Normalise un format d'export.
 *
 * Aucune whitelist frontend n'est appliquée ici.
 * La validation finale du format appartient au backend.
 *
 * @param {string} format
 * @returns {string}
 */
function normalizeFormat(format) {
  const normalized = String(format || "")
    .trim()
    .toLowerCase();

  if (!normalized) {
    throw new Error(
      "MACEVO : le format d'export est requis."
    );
  }

  return normalized;
}


/**
 * Retourne les données d'une réponse Axios.
 *
 * @param {Object} response
 * @returns {*}
 */
function responseData(response) {
  return response?.data;
}


/**
 * Détermine si une valeur est un FormData.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isFormData(value) {
  return (
    typeof FormData !== "undefined" &&
    value instanceof FormData
  );
}


/* ============================================================
   SERVICE
============================================================ */

const editorService = {

  /* ==========================================================
     BOOTSTRAP
  ========================================================== */

  /**
   * Charge toutes les données nécessaires à l'initialisation
   * de l'éditeur scientifique.
   *
   * GET /api/editeur/{reportId}/
   *
   * Réponse backend :
   *
   * {
   *   report,
   *   assets,
   *   autosave,
   *   capabilities,
   *   exports
   * }
   *
   * @param {number|string} reportId
   * @returns {Promise<Object>}
   */
  getBootstrap: async (reportId) => {
    requireId(
      reportId,
      "MACEVO : l'identifiant du rapport est requis pour le bootstrap."
    );

    const response = await api.get(
      `editeur/${reportId}/`
    );

    return responseData(response);
  },


  /* ==========================================================
     ASSETS
  ========================================================== */

  /**
   * Récupère les assets appartenant aux rapports
   * de l'utilisateur connecté.
   *
   * GET /api/editeur/assets/
   *
   * Le backend actuel ne reçoit pas de filtre reportId.
   * Lorsque reportId est fourni, le filtrage est donc réalisé
   * côté service.
   *
   * @param {number|string|null} reportId
   * @returns {Promise<Array>}
   */
  getAssets: async (reportId = null) => {
    const response = await api.get(
      "editeur/assets/"
    );

    const data = responseData(response);

    const assets = Array.isArray(data)
      ? data
      : [];

    if (
      reportId === undefined ||
      reportId === null ||
      reportId === ""
    ) {
      return assets;
    }

    return assets.filter(
      (asset) =>
        String(asset?.report) ===
        String(reportId)
    );
  },


  /**
   * Récupère un asset précis.
   *
   * GET /api/editeur/assets/{id}/
   *
   * @param {number|string} assetId
   * @returns {Promise<Object>}
   */
  getAssetById: async (assetId) => {
    requireId(
      assetId,
      "MACEVO : l'identifiant de l'asset est requis."
    );

    const response = await api.get(
      `editeur/assets/${assetId}/`
    );

    return responseData(response);
  },


  /**
   * Crée un asset.
   *
   * POST /api/editeur/assets/
   *
   * Compatible avec JSON et FormData.
   *
   * IMPORTANT :
   * Lorsque data est un FormData, aucun Content-Type manuel
   * n'est imposé afin que le navigateur/Axios puisse générer
   * correctement le boundary multipart.
   *
   * @param {Object|FormData} data
   * @returns {Promise<Object>}
   */
  createAsset: async (data) => {
    if (!data) {
      throw new Error(
        "MACEVO : les données de l'asset sont requises."
      );
    }

    const response = await api.post(
      "editeur/assets/",
      data,
      isFormData(data)
        ? undefined
        : undefined
    );

    return responseData(response);
  },


  /**
   * Envoie directement un fichier comme asset.
   *
   * POST /api/editeur/assets/
   *
   * @param {number|string} reportId
   * @param {File} file
   * @param {Object} metadata
   * @returns {Promise<Object>}
   */
  uploadAsset: async (
    reportId,
    file,
    metadata = {}
  ) => {
    requireId(
      reportId,
      "MACEVO : l'identifiant du rapport est requis pour envoyer un asset."
    );

    if (!file) {
      throw new Error(
        "MACEVO : le fichier de l'asset est requis."
      );
    }

    const formData = new FormData();

    formData.append(
      "report",
      reportId
    );

    formData.append(
      "file",
      file
    );

    formData.append(
      "asset_type",
      metadata.asset_type ||
        "image"
    );

    if (
      metadata.title !== undefined &&
      metadata.title !== null
    ) {
      formData.append(
        "title",
        metadata.title
      );
    }

    if (
      metadata.description !== undefined &&
      metadata.description !== null
    ) {
      formData.append(
        "description",
        metadata.description
      );
    }

    if (
      metadata.alt_text !== undefined &&
      metadata.alt_text !== null
    ) {
      formData.append(
        "alt_text",
        metadata.alt_text
      );
    }

    if (
      metadata.caption !== undefined &&
      metadata.caption !== null
    ) {
      formData.append(
        "caption",
        metadata.caption
      );
    }

    if (
      metadata.position !== undefined &&
      metadata.position !== null
    ) {
      formData.append(
        "position",
        String(metadata.position)
      );
    }

    return editorService.createAsset(
      formData
    );
  },


  /**
   * Modifie partiellement un asset.
   *
   * PATCH /api/editeur/assets/{id}/
   *
   * @param {number|string} assetId
   * @param {Object|FormData} data
   * @returns {Promise<Object>}
   */
  patchAsset: async (
    assetId,
    data = {}
  ) => {
    requireId(
      assetId,
      "MACEVO : l'identifiant de l'asset est requis."
    );

    const response = await api.patch(
      `editeur/assets/${assetId}/`,
      data,
      isFormData(data)
        ? undefined
        : undefined
    );

    return responseData(response);
  },


  /**
   * Remplace complètement un asset.
   *
   * PUT /api/editeur/assets/{id}/
   *
   * @param {number|string} assetId
   * @param {Object|FormData} data
   * @returns {Promise<Object>}
   */
  updateAsset: async (
    assetId,
    data = {}
  ) => {
    requireId(
      assetId,
      "MACEVO : l'identifiant de l'asset est requis."
    );

    const response = await api.put(
      `editeur/assets/${assetId}/`,
      data,
      isFormData(data)
        ? undefined
        : undefined
    );

    return responseData(response);
  },


  /**
   * Supprime un asset.
   *
   * DELETE /api/editeur/assets/{id}/
   *
   * @param {number|string} assetId
   * @returns {Promise<*>}
   */
  deleteAsset: async (assetId) => {
    requireId(
      assetId,
      "MACEVO : l'identifiant de l'asset est requis."
    );

    const response = await api.delete(
      `editeur/assets/${assetId}/`
    );

    return responseData(response);
  },


  /* ==========================================================
     STRUCTURE DOCUMENTAIRE
  ========================================================== */

  /**
   * Récupère la représentation scientifique structurée
   * du document.
   *
   * GET /api/editeur/{reportId}/structure/
   *
   * @param {number|string} reportId
   * @returns {Promise<Object>}
   */
  getStructure: async (reportId) => {
    requireId(
      reportId,
      "MACEVO : l'identifiant du rapport est requis pour la structure."
    );

    const response = await api.get(
      `editeur/${reportId}/structure/`
    );

    return responseData(response);
  },


  /* ==========================================================
     VALIDATION
  ========================================================== */

  /**
   * Lance la validation du document.
   *
   * GET /api/editeur/{reportId}/validation/
   *
   * @param {number|string} reportId
   * @returns {Promise<Object>}
   */
  validateDocument: async (reportId) => {
    requireId(
      reportId,
      "MACEVO : l'identifiant du rapport est requis pour la validation."
    );

    const response = await api.get(
      `editeur/${reportId}/validation/`
    );

    return responseData(response);
  },


  /* ==========================================================
     STATISTIQUES
  ========================================================== */

  /**
   * Récupère les statistiques du document.
   *
   * GET /api/editeur/{reportId}/statistics/
   *
   * @param {number|string} reportId
   * @returns {Promise<Object>}
   */
  getStatistics: async (reportId) => {
    requireId(
      reportId,
      "MACEVO : l'identifiant du rapport est requis pour les statistiques."
    );

    const response = await api.get(
      `editeur/${reportId}/statistics/`
    );

    return responseData(response);
  },


  /* ==========================================================
     EXPORT
  ========================================================== */

  /**
   * Exporte le document dans le format demandé.
   *
   * GET /api/editeur/{reportId}/export/{format}/
   *
   * Le backend retourne directement un fichier.
   *
   * @param {number|string} reportId
   * @param {string} format
   * @returns {Promise<Blob>}
   */
  exportDocument: async (
    reportId,
    format
  ) => {
    requireId(
      reportId,
      "MACEVO : l'identifiant du rapport est requis pour l'export."
    );

    const normalizedFormat =
      normalizeFormat(format);

    const response = await api.get(
      `editeur/${reportId}/export/${normalizedFormat}/`,
      {
        responseType: "blob",
      }
    );

    return response.data;
  },


  /**
   * Export PDF.
   *
   * @param {number|string} reportId
   * @returns {Promise<Blob>}
   */
  exportPDF: async (reportId) => {
    return editorService.exportDocument(
      reportId,
      "pdf"
    );
  },


  /**
   * Export DOCX.
   *
   * @param {number|string} reportId
   * @returns {Promise<Blob>}
   */
  exportDOCX: async (reportId) => {
    return editorService.exportDocument(
      reportId,
      "docx"
    );
  },


  /**
   * Export HTML.
   *
   * @param {number|string} reportId
   * @returns {Promise<Blob>}
   */
  exportHTML: async (reportId) => {
    return editorService.exportDocument(
      reportId,
      "html"
    );
  },


  /**
   * Export LaTeX.
   *
   * @param {number|string} reportId
   * @returns {Promise<Blob>}
   */
  exportLaTeX: async (reportId) => {
    return editorService.exportDocument(
      reportId,
      "latex"
    );
  },


  /**
   * Export fichier .tex.
   *
   * @param {number|string} reportId
   * @returns {Promise<Blob>}
   */
  exportTex: async (reportId) => {
    return editorService.exportDocument(
      reportId,
      "tex"
    );
  },


  /**
   * Export projet scientifique ZIP.
   *
   * @param {number|string} reportId
   * @returns {Promise<Blob>}
   */
  exportZIP: async (reportId) => {
    return editorService.exportDocument(
      reportId,
      "zip"
    );
  },


  /* ==========================================================
     TÉLÉCHARGEMENT
  ========================================================== */

  /**
   * Télécharge un Blob.
   *
   * Cette méthode ne fait aucun appel API.
   *
   * @param {Blob} blob
   * @param {string} filename
   */
  downloadBlob: (
    blob,
    filename
  ) => {
    if (!blob) {
      throw new Error(
        "MACEVO : aucun fichier à télécharger."
      );
    }

    const url =
      window.URL.createObjectURL(
        blob
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      filename ||
      "document-macevo";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      url
    );
  },


  /**
   * Exporte puis télécharge automatiquement.
   *
   * @param {number|string} reportId
   * @param {string} format
   * @param {string} filename
   * @returns {Promise<Blob>}
   */
  exportAndDownload: async (
    reportId,
    format,
    filename
  ) => {
    const normalizedFormat =
      normalizeFormat(format);

    const blob =
      await editorService.exportDocument(
        reportId,
        normalizedFormat
      );

    editorService.downloadBlob(
      blob,
      filename ||
        `macevo-document.${normalizedFormat}`
    );

    return blob;
  },
};


/* ============================================================
   EXPORT
============================================================ */

export default editorService;