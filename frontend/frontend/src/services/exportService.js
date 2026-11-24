import api from "../api/axios";

const exportService = {

  /**
   * Générer un aperçu PDF d'un rapport
   *
   * Données attendues :
   * {
   *   report_id: 1
   * }
   */
  previewPDF: async (data) => {
    const response = await api.post("export/preview/", data);
    return response;
  },


  /**
   * Exporter un rapport en PDF
   *
   * Retour attendu :
   * - fichier PDF
   * - ou URL de téléchargement
   */
  exportToPDF: async (data) => {
    const response = await api.post(
      "export/pdf/",
      data,
      {
        responseType: "blob",
      }
    );

    return response;
  },


  /**
   * Télécharger directement un PDF existant
   */
  downloadPDF: async (id) => {
    const response = await api.get(
      `export/pdf/${id}/`,
      {
        responseType: "blob",
      }
    );

    return response;
  },


  /**
   * Récupérer l'historique des exports PDF
   */
  getExportHistory: async () => {
    const response = await api.get("export/history/");
    return response;
  },


  /**
   * Supprimer un export PDF
   */
  deleteExport: async (id) => {
    const response = await api.delete(
      `export/${id}/`
    );

    return response;
  },


};

export default exportService;