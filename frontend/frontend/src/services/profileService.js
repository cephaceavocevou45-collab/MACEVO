import api from "../api/axios";

const profileService = {
  async getProfile() {
    return api.get("profile/");
  },

  async updateProfile(data) {
    return api.patch("profile/", data);
  },

  async uploadAvatar(file) {
    if (!(file instanceof File)) {
      throw new TypeError(
        "Le fichier avatar est invalide."
      );
    }

    const formData = new FormData();

    formData.append(
      "avatar",
      file
    );

    return api.post(
      "profile/avatar/",
      formData
    );
  },

  async deleteAvatar() {
    return api.delete(
      "profile/avatar/"
    );
  },
};

export default profileService;