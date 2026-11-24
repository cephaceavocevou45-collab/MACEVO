import api from "../api/axios";

const dashboardService = {

  /**
   * Récupérer les informations du tableau de bord
   * 
   * Exemple de réponse attendue :
   * {
   *   total_reports: 5,
   *   recent_reports: [],
   *   templates_used: 3
   * }
   */
  getDashboardData: async () => {
    const response = await api.get("dashboard/");
    return response;
  },


  /**
   * Récupérer les statistiques de l'utilisateur
   */
  getStatistics: async () => {
    const response = await api.get("dashboard/statistics/");
    return response;
  },


  /**
   * Récupérer les activités récentes
   */
  getRecentActivities: async () => {
    const response = await api.get("dashboard/activities/");
    return response;
  },

};

export default dashboardService;