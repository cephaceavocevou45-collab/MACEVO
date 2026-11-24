import { useCallback, useState } from "react";

import profileService from "../../services/profileService";

import {
  useProfile as useProfileContext,
} from "../../context/ProfileContext";

const INITIAL_FORM_DATA = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  phone: "",
  university: "",
  country: "",
  city: "",
  bio: "",
  avatar: null,
};

function mapProfileToFormData(profile) {
  return {
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    username: profile?.username || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    university: profile?.university || "",
    country: profile?.country || "",
    city: profile?.city || "",
    bio: profile?.bio || "",
    avatar: profile?.avatar || null,
  };
}

function getApiErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Une erreur inattendue est survenue.";
  }

  const messages = [];

  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      value.forEach((message) => {
        if (typeof message === "string") {
          messages.push(message);
        }
      });

      return;
    }

    if (typeof value === "string") {
      messages.push(value);
      return;
    }

    if (
      typeof value === "object" &&
      value !== null
    ) {
      Object.values(value)
        .flat(Infinity)
        .forEach((message) => {
          if (typeof message === "string") {
            messages.push(message);
          }
        });
    }
  });

  return (
    messages[0] ||
    "Impossible d'enregistrer les modifications."
  );
}

export default function useProfile() {
  const {
    profile,
    setProfile,
    loadProfile: loadProfileFromContext,
  } = useProfileContext();

  const [formData, setFormData] = useState(
    INITIAL_FORM_DATA
  );

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  /**
   * Synchronise le formulaire avec le profil reçu
   * du backend.
   */
  const applyProfile = useCallback(
    (profileData) => {
      if (!profileData) {
        return;
      }

      setFormData(
        mapProfileToFormData(profileData)
      );

      setProfile(profileData);
    },
    [setProfile]
  );

  /**
   * Modification d'un champ.
   */
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  }

  /**
   * Sélection d'un avatar.
   */
  function handleAvatar(file) {
    if (!(file instanceof File)) {
      setErrors((previous) => ({
        ...previous,
        avatar: "Fichier image invalide.",
      }));

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (file.size > maxSize) {
      setErrors((previous) => ({
        ...previous,
        avatar: "L'image ne doit pas dépasser 5 Mo.",
      }));

      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors((previous) => ({
        ...previous,
        avatar:
          "Format accepté : JPG, PNG ou WebP.",
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      avatar: file,
    }));

    setErrors((previous) => ({
      ...previous,
      avatar: "",
    }));
  }

  /**
   * Validation du formulaire.
   */
  function validateForm() {
    const newErrors = {};

    const requiredFields = [
      "firstName",
      "lastName",
      "username",
      "email",
      "phone",
      "university",
      "country",
      "city",
      "bio",
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];

      if (
        !value ||
        value.toString().trim() === ""
      ) {
        newErrors[field] =
          "Ce champ est obligatoire.";
      }
    });

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      newErrors.email =
        "Veuillez entrer une adresse e-mail valide.";
    }

    if (
      formData.bio &&
      formData.bio.trim().length > 2000
    ) {
      newErrors.bio =
        "La biographie ne peut pas dépasser 2000 caractères.";
    }

    if (formData.phone) {
      const phoneRegex = /^[0-9+().\-\s]+$/;

      if (
        !phoneRegex.test(
          formData.phone.trim()
        )
      ) {
        newErrors.phone =
          "Le numéro de téléphone contient des caractères invalides.";
      }
    }

    if (formData.avatar instanceof File) {
      const maxSize = 5 * 1024 * 1024;

      if (formData.avatar.size > maxSize) {
        newErrors.avatar =
          "L'image ne doit pas dépasser 5 Mo.";
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (
        !allowedTypes.includes(
          formData.avatar.type
        )
      ) {
        newErrors.avatar =
          "Format accepté : JPG, PNG ou WebP.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  /**
   * Chargement du profil.
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});

      const profileData =
        await loadProfileFromContext();

      if (!profileData) {
        return null;
      }

      setFormData(
        mapProfileToFormData(profileData)
      );

      return profileData;
    } catch (error) {
      console.error(
        "Erreur lors du chargement du profil :",
        error
      );

      setErrors({
        general: getApiErrorMessage(error),
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [loadProfileFromContext]);

  /**
   * Sauvegarde des informations personnelles.
   */
  async function saveProfile() {
    if (!validateForm()) {
      return false;
    }

    try {
      setLoading(true);
      setErrors({});

      const profileData = {
        firstName:
          formData.firstName.trim(),

        lastName:
          formData.lastName.trim(),

        username:
          formData.username.trim(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

        university:
          formData.university.trim(),

        country:
          formData.country.trim(),

        city:
          formData.city.trim(),

        bio:
          formData.bio.trim(),
      };

      /**
       * PATCH /api/profile/
       */
      const profileResponse =
        await profileService.updateProfile(
          profileData
        );

      let updatedProfile =
        profileResponse.data;

      /**
       * Upload de l'avatar séparément.
       */
      if (formData.avatar instanceof File) {
        const avatarResponse =
          await profileService.uploadAvatar(
            formData.avatar
          );

        updatedProfile =
          avatarResponse.data;
      }

      /**
       * Synchronisation globale.
       *
       * C'est ici que Settings et les autres pages
       * récupèrent immédiatement le nouveau profil.
       */
      setProfile(updatedProfile);

      setFormData(
        mapProfileToFormData(updatedProfile)
      );

      setErrors({});

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde du profil :",
        error
      );

      const apiMessage =
        getApiErrorMessage(error);

      const data = error?.response?.data;

      const apiErrors = {};

      if (data && typeof data === "object") {
        Object.entries(data).forEach(
          ([field, value]) => {
            if (Array.isArray(value)) {
              apiErrors[field] =
                value[0] || "Valeur invalide.";
            } else if (
              typeof value === "string"
            ) {
              apiErrors[field] = value;
            } else if (
              typeof value === "object" &&
              value !== null
            ) {
              const nested =
                Object.values(value)
                  .flat(Infinity)
                  .find(
                    (item) =>
                      typeof item === "string"
                  );

              apiErrors[field] =
                nested || "Valeur invalide.";
            }
          }
        );
      }

      if (
        Object.keys(apiErrors).length === 0
      ) {
        apiErrors.general = apiMessage;
      }

      setErrors(apiErrors);

      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Suppression de l'avatar.
   */
  async function deleteAvatar() {
    try {
      setLoading(true);
      setErrors({});

      const response =
        await profileService.deleteAvatar();

      const updatedProfile =
        response.data;

      setProfile(updatedProfile);

      setFormData(
        mapProfileToFormData(updatedProfile)
      );

      return true;
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de l'avatar :",
        error
      );

      setErrors({
        general: getApiErrorMessage(error),
      });

      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    profile,

    formData,
    setFormData,

    errors,
    setErrors,

    loading,

    handleChange,
    handleAvatar,

    loadProfile,
    saveProfile,
    deleteAvatar,

    applyProfile,
  };
}