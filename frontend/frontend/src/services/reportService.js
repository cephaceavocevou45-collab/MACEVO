import api from "../api/axios";

/**
 * ============================================================
 * MACEVO — REPORT SERVICE
 * ============================================================
 *
 * Service centralisé pour toutes les opérations API
 * concernant les rapports MACEVO.
 *
 * Backend :
 *
 * GET     /api/reports/
 * POST    /api/reports/
 * GET     /api/reports/{id}/
 * PUT     /api/reports/{id}/
 * PATCH   /api/reports/{id}/
 * DELETE  /api/reports/{id}/
 *
 * Le modèle Report est le document persistant canonique
 * utilisé par :
 *
 * - Nouveau rapport
 * - Modèles
 * - Document vierge
 * - Éditeur scientifique
 * - Sauvegarde automatique
 * - Export
 *
 * Les fonctionnalités spécifiques de l'éditeur
 * sont gérées par le service editeur dédié.
 *
 * ============================================================
 */

const reportService = {
  /* ============================================================
     LISTE
  ============================================================ */

  /**
   * Récupère les rapports de l'utilisateur connecté.
   *
   * GET /api/reports/
   *
   * @returns {Promise<Object|Array>}
   */
  getReports: async () => {
    const response = await api.get("reports/");

    return response.data;
  },

  /* ============================================================
     RAPPORT PAR ID
  ============================================================ */

  /**
   * Récupère un rapport précis.
   *
   * GET /api/reports/{id}/
   *
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  getReportById: async (id) => {
    if (id === undefined || id === null || id === "") {
      throw new Error(
        "MACEVO : l'identifiant du rapport est requis."
      );
    }

    const response = await api.get(
      `reports/${id}/`
    );

    return response.data;
  },

  /* ============================================================
     CRÉATION
  ============================================================ */

  /**
   * Crée un nouveau rapport.
   *
   * POST /api/reports/
   *
   * Exemple :
   *
   * {
   *   title: "Rapport de stage",
   *   template: 1,
   *   content: "<p>...</p>"
   * }
   *
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  createReport: async (data = {}) => {
    const response = await api.post(
      "reports/",
      data
    );

    return response.data;
  },

  /* ============================================================
     REMPLACEMENT COMPLET
  ============================================================ */

  /**
   * Remplace complètement les données d'un rapport.
   *
   * PUT /api/reports/{id}/
   *
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  updateReport: async (
    id,
    data = {}
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new Error(
        "MACEVO : l'identifiant du rapport est requis."
      );
    }

    const response = await api.put(
      `reports/${id}/`,
      data
    );

    return response.data;
  },

  /* ============================================================
     MODIFICATION PARTIELLE
  ============================================================ */

  /**
   * Modifie uniquement les champs nécessaires.
   *
   * Utilisé notamment pour :
   *
   * - sauvegarde du contenu
   * - changement de titre
   * - métadonnées
   * - statut
   * - informations académiques
   *
   * PATCH /api/reports/{id}/
   *
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  patchReport: async (
    id,
    data = {}
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new Error(
        "MACEVO : l'identifiant du rapport est requis."
      );
    }

    const response = await api.patch(
      `reports/${id}/`,
      data
    );

    return response.data;
  },

  /* ============================================================
     SAUVEGARDE DU CONTENU
  ============================================================ */

  /**
   * Sauvegarde uniquement le contenu de l'éditeur.
   *
   * Cette méthode permet à EditorContext de ne pas avoir
   * à construire directement les URLs API.
   *
   * PATCH /api/reports/{id}/
   *
   * @param {number|string} id
   * @param {string} content
   * @returns {Promise<Object>}
   */
  saveContent: async (
    id,
    content
  ) => {
    if (id === undefined || id === null || id === "") {
      throw new Error(
        "MACEVO : impossible de sauvegarder sans identifiant de rapport."
      );
    }

    const response = await api.patch(
      `reports/${id}/`,
      {
        content,
      }
    );

    return response.data;
  },

  /* ============================================================
     SUPPRESSION
  ============================================================ */

  /**
   * Supprime un rapport.
   *
   * DELETE /api/reports/{id}/
   *
   * @param {number|string} id
   * @returns {Object|undefined}
   */
  deleteReport: async (id) => {
    if (id === undefined || id === null || id === "") {
      throw new Error(
        "MACEVO : l'identifiant du rapport est requis."
      );
    }

    const response = await api.delete(
      `reports/${id}/`
    );

    return response.data;
  },
};

export default reportService;