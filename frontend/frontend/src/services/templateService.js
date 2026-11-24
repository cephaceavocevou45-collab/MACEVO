import api from "../api/axios";

const templateService = {

  /**
   * Récupérer tous les modèles LaTeX
   *
   * GET /api/templates/
   */
  getTemplates: async () => {
    const response = await api.get("templates/");
    return response;
  },


  /**
   * Récupérer un modèle précis
   *
   * GET /api/templates/{id}/
   */
  getTemplateById: async (id) => {
    const response = await api.get(
      `templates/${id}/`
    );

    return response;
  },


  /**
   * Créer un nouveau modèle LaTeX
   *
   * Exemple :
   * {
   *   title: "Mémoire Licence",
   *   description: "...",
   *   category: "Licence",
   *   file: "rapport.tex"
   * }
   */
  createTemplate: async (data) => {
    const response = await api.post(
      "templates/",
      data
    );

    return response;
  },


  /**
   * Modifier un modèle existant
   */
  updateTemplate: async (id, data) => {
    const response = await api.put(
      `templates/${id}/`,
      data
    );

    return response;
  },


  /**
   * Mise à jour partielle d'un modèle
   */
  patchTemplate: async (id, data) => {
    const response = await api.patch(
      `templates/${id}/`,
      data
    );

    return response;
  },


  /**
   * Supprimer un modèle
   */
  deleteTemplate: async (id) => {
    const response = await api.delete(
      `templates/${id}/`
    );

    return response;
  },


  /**
   * Rechercher un modèle
   *
   * Exemple :
   * ?search=licence
   */
  searchTemplates: async (query) => {
    const response = await api.get(
      `templates/?search=${query}`
    );

    return response;
  },


  /**
   * Télécharger le fichier LaTeX d'un modèle
   */
  downloadTemplate: async (id) => {
    const response = await api.get(
      `templates/${id}/download/`,
      {
        responseType: "blob",
      }
    );

    return response;
  },


};

export default templateService;