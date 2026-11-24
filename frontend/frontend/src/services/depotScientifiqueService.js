import api from "../api/axios";

/**
 * Service frontend du dépôt scientifique MACEVO.
 *
 * API backend :
 * /api/depot/
 *
 * Le dépôt scientifique est lié au modèle Report.
 * L'identifiant public du dépôt est le public_id MACEVO.
 */

const depotScientifiqueService = {
  /**
   * ---------------------------------------------------------
   * LISTE PUBLIQUE
   * ---------------------------------------------------------
   *
   * GET /api/depot/
   *
   * Le backend retourne uniquement les dépôts :
   * - publics
   * - publiés
   * - avec consentement
   */
  async list(params = {}) {
    const response = await api.get("/depot/", {
      params,
    });

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * MES DÉPÔTS
   * ---------------------------------------------------------
   *
   * GET /api/depot/mes-depots/
   *
   * Retourne les dépôts appartenant à l'utilisateur connecté.
   *
   * Paramètre optionnel :
   * ?status=draft
   * ?status=pending
   * ?status=published
   * ?status=withdrawn
   */
  async myDeposits(status = "") {
    const params = {};

    if (status) {
      params.status = status;
    }

    const response = await api.get("/depot/mes-depots/", {
      params,
    });

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * RECHERCHE PUBLIQUE
   * ---------------------------------------------------------
   *
   * GET /api/depot/rechercher/?q=...
   */
  async search(query = "", extraParams = {}) {
    const response = await api.get("/depot/rechercher/", {
      params: {
        q: query,
        ...extraParams,
      },
    });

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * DÉTAIL PAR ID MACEVO
   * ---------------------------------------------------------
   *
   * GET /api/depot/<public_id>/
   */
  async getByPublicId(publicId) {
    if (!publicId) {
      throw new Error(
        "L'identifiant public du document est requis."
      );
    }

    const response = await api.get(
      `/depot/${encodeURIComponent(publicId)}/`
    );

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * CRÉATION D'UN DÉPÔT
   * ---------------------------------------------------------
   *
   * POST /api/depot/
   *
   * IMPORTANT :
   * Le serializer Django attend "report",
   * et non "report_id".
   *
   * Payload :
   *
   * {
   *   report: 66,
   *   document_type: "RAP"
   * }
   */
  async create(data) {
    if (!data || !data.report) {
      throw new Error(
        "Le rapport à déposer est requis."
      );
    }

    if (!data.document_type) {
      throw new Error(
        "Le type du document scientifique est requis."
      );
    }

    const response = await api.post(
      "/depot/",
      {
        report: Number(data.report),
        document_type: data.document_type,
      }
    );

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * CONSENTEMENT
   * ---------------------------------------------------------
   *
   * POST /api/depot/<public_id>/consentement/
   *
   * Payload :
   *
   * {
   *   accepted: true,
   *   consent_version: "1.0"
   * }
   */
  async giveConsent(publicId, data = {}) {
    if (!publicId) {
      throw new Error(
        "L'identifiant public du dépôt est requis."
      );
    }

    const payload = {
      accepted: true,
      consent_version: "1.0",
      ...data,
    };

    const response = await api.post(
      `/depot/${encodeURIComponent(publicId)}/consentement/`,
      payload
    );

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * PUBLICATION
   * ---------------------------------------------------------
   *
   * POST /api/depot/<public_id>/publier/
   *
   * Le backend exige :
   *
   * {
   *   confirm: true
   * }
   */
  async publish(publicId) {
    if (!publicId) {
      throw new Error(
        "L'identifiant public du dépôt est requis."
      );
    }

    const response = await api.post(
      `/depot/${encodeURIComponent(publicId)}/publier/`,
      {
        confirm: true,
      }
    );

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * RETRAIT
   * ---------------------------------------------------------
   *
   * POST /api/depot/<public_id>/retirer/
   */
  async withdraw(publicId) {
    if (!publicId) {
      throw new Error(
        "L'identifiant public du dépôt est requis."
      );
    }

    const response = await api.post(
      `/depot/${encodeURIComponent(publicId)}/retirer/`,
      {
        confirm: true,
      }
    );

    return response.data;
  },

  /**
   * ---------------------------------------------------------
   * EXISTENCE D'UN ID MACEVO
   * ---------------------------------------------------------
   */
  async exists(publicId) {
    if (!publicId) {
      return false;
    }

    try {
      await this.getByPublicId(publicId);
      return true;
    } catch (error) {
      if (error?.response?.status === 404) {
        return false;
      }

      throw error;
    }
  },
};

export default depotScientifiqueService;