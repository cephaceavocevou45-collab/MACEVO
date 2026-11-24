import api from "../api/axios";

const authService = {
  /**
   * Connexion
   */
  async login(credentials) {
    const response = await api.post("login/", credentials);
    return response;
  },

  /**
   * Inscription
   */
  async register(userData) {
    const response = await api.post("register/", userData);
    return response;
  },

  /**
   * Déconnexion locale
   * (Ton backend actuel ne possède pas encore d'API logout)
   */
  logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("email");
    localStorage.removeItem("fullname");
  },

  /**
   * Vérifie si un utilisateur est connecté
   */
  isAuthenticated() {
    return !!localStorage.getItem("access");
  },

  /**
   * Retourne le token JWT
   */
  getAccessToken() {
    return localStorage.getItem("access");
  },

  /**
   * Retourne le Refresh Token
   */
  getRefreshToken() {
    return localStorage.getItem("refresh");
  },

  /**
   * Retourne les informations de l'utilisateur connecté
   */
  getCurrentUser() {
    return {
      fullname: localStorage.getItem("fullname"),
      email: localStorage.getItem("email"),
    };
  },
};

export default authService;