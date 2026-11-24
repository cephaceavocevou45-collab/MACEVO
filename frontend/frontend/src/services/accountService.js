import api from "../api/axios";

const accountService = {
  /**
   * Changer le mot de passe.
   *
   * POST /api/account/password/
   */
  async changePassword(data) {
    return api.post("account/password/", data);
  },

  /**
   * Supprimer définitivement le compte.
   *
   * DELETE /api/account/
   */
  async deleteAccount(data = {}) {
    return api.delete("account/", {
      data,
    });
  },
};

export default accountService;