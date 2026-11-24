import api from "../../../api/axios";

const profileService = {
  /**
   * ==========================================
   * Récupérer le profil de l'utilisateur connecté
   * GET /api/profiles/me/
   * ==========================================
   */
  getProfile: async () => {
    const response = await api.get("profiles/me/");
    return response;
  },

  /**
   * ==========================================
   * Modifier complètement le profil
   * PUT /api/profiles/me/
   * ==========================================
   */
  updateProfile: async (data) => {
    const response = await api.put(
      "profiles/me/",
      data
    );

    return response;
  },

  /**
   * ==========================================
   * Modifier partiellement le profil
   * PATCH /api/profiles/me/
   * ==========================================
   */
  patchProfile: async (data) => {
    const response = await api.patch(
      "profiles/me/",
      data
    );

    return response;
  },

  /**
   * ==========================================
   * Upload de l'avatar
   * POST /api/profiles/avatar/
   * ==========================================
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();

    formData.append("avatar", file);

    const response = await api.post(
      "profiles/avatar/",
      formData
    );

    return response;
  },

  /**
   * ==========================================
   * Changer le mot de passe
   * ==========================================
   */
  changePassword: async (data) => {
    const response = await api.post(
      "profiles/change-password/",
      data
    );

    return response;
  },

  /**
   * ==========================================
   * Supprimer le compte
   * ==========================================
   */
  deleteAccount: async () => {
    const response = await api.delete(
      "profiles/delete/"
    );

    return response;
  },
};

export default profileService;