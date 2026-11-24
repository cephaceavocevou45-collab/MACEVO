import api from "../api/axios";

const settingsService = {
  async getSettings() {
    const response = await api.get("settings/");
    return response.data;
  },

  async updateSettings(data) {
    const response = await api.patch("settings/", data);
    return response.data;
  },

  async updateAccount(data) {
    const response = await api.patch("settings/", {
      full_name: data.full_name,
      email: data.email,
    });

    return response.data;
  },

  async changePassword(data) {
    const response = await api.post(
      "settings/password/",
      data
    );

    return response.data;
  },
};

export default settingsService;