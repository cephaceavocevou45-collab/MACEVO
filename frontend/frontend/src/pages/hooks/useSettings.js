import { useCallback, useState } from "react";
import settingsService from "../services/settingsService";

const INITIAL_SETTINGS = {
  // ---------------------------------------------------------------------------
  // LOCALISATION
  // ---------------------------------------------------------------------------
  country: "Bénin",
  timezone: "Africa/Porto-Novo",
  language: "fr",
  date_format: "DD/MM/YYYY",

  // ---------------------------------------------------------------------------
  // ÉDITEUR
  // ---------------------------------------------------------------------------
  default_font: "Arial",
  font_size: 12,
  line_spacing: 1.5,
  default_margins: "2.5cm",
  auto_numbering: true,
  show_ruler: true,
  auto_save: true,
  latex_preview: true,
  scientific_spellcheck: true,

  // ---------------------------------------------------------------------------
  // IA
  // ---------------------------------------------------------------------------
  ai_model: "gpt-4o",
  creativity: 0.7,
  academic_refs: true,
  show_sources: true,
  system_prompt: "",

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------
  notification_ai_messages: true,
  notification_latex_conversion: true,
  notification_tips: true,
  notification_marketing: false,

  // ---------------------------------------------------------------------------
  // EXPORT / STOCKAGE
  // ---------------------------------------------------------------------------
  export_format: "docx",
  include_toc: true,
  compress_images: true,

  // ---------------------------------------------------------------------------
  // APPARENCE
  // ---------------------------------------------------------------------------
  theme: "light",
  animations: true,

  // ---------------------------------------------------------------------------
  // PROFIL PUBLIC
  // ---------------------------------------------------------------------------
  public_profile: false,

  // ---------------------------------------------------------------------------
  // SÉCURITÉ
  // ---------------------------------------------------------------------------
  confirm_delete: true,
};

function normalizeSettings(data) {
  return {
    ...INITIAL_SETTINGS,
    ...(data || {}),
  };
}

function extractApiError(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Une erreur inattendue est survenue.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.error) {
    return data.error;
  }

  const messages = [];

  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      messages.push(`${field} : ${value[0]}`);
    } else if (typeof value === "string") {
      messages.push(`${field} : ${value}`);
    } else if (value && typeof value === "object") {
      const nested = Object.values(value)
        .flat(Infinity)
        .find((item) => typeof item === "string");

      if (nested) {
        messages.push(`${field} : ${nested}`);
      }
    }
  });

  return (
    messages[0] ||
    "Impossible d'enregistrer les paramètres."
  );
}

export default function useSettings() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");

  // ---------------------------------------------------------------------------
  // CHARGEMENT
  // ---------------------------------------------------------------------------

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setFieldErrors({});
      setSuccess("");

      const response = await settingsService.getSettings();

      const normalized = normalizeSettings(response.data);

      setSettings(normalized);

      return normalized;
    } catch (err) {
      console.error(
        "Erreur lors du chargement des paramètres :",
        err
      );

      setError(extractApiError(err));

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // MODIFICATION LOCALE
  // ---------------------------------------------------------------------------

  const updateSetting = useCallback((field, value) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const next = {
        ...previous,
      };

      delete next[field];

      return next;
    });

    setError("");
    setSuccess("");
  }, []);

  // ---------------------------------------------------------------------------
  // MODIFICATION MULTIPLE
  // ---------------------------------------------------------------------------

  const updateSettingsLocal = useCallback((updates) => {
    setSettings((previous) => ({
      ...previous,
      ...updates,
    }));

    setError("");
    setSuccess("");
  }, []);

  // ---------------------------------------------------------------------------
  // SAUVEGARDE
  // ---------------------------------------------------------------------------

  const saveSettings = useCallback(
    async (updates = null) => {
      try {
        setSaving(true);
        setError("");
        setFieldErrors({});
        setSuccess("");

        const payload = updates
          ? {
              ...updates,
            }
          : {
              ...settings,
            };

        const response =
          await settingsService.updateSettings(payload);

        const normalized = normalizeSettings(response.data);

        setSettings(normalized);

        setSuccess(
          "Vos paramètres ont été enregistrés avec succès."
        );

        return {
          success: true,
          data: normalized,
        };
      } catch (err) {
        console.error(
          "Erreur lors de la sauvegarde des paramètres :",
          err
        );

        const data = err?.response?.data;
        const errors = {};

        if (
          data &&
          typeof data === "object" &&
          !Array.isArray(data)
        ) {
          Object.entries(data).forEach(
            ([field, value]) => {
              if (Array.isArray(value)) {
                errors[field] =
                  value[0] || "Valeur invalide.";
              } else if (
                typeof value === "string"
              ) {
                errors[field] = value;
              }
            }
          );
        }

        setFieldErrors(errors);
        setError(extractApiError(err));

        return {
          success: false,
          data: null,
        };
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  // ---------------------------------------------------------------------------
  // SAUVEGARDE D'UN SEUL CHAMP
  // ---------------------------------------------------------------------------

  const saveSetting = useCallback(
    async (field, value) => {
      return saveSettings({
        [field]: value,
      });
    },
    [saveSettings]
  );

  // ---------------------------------------------------------------------------
  // RESET MESSAGE
  // ---------------------------------------------------------------------------

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  return {
    settings,
    setSettings,

    loading,
    saving,

    error,
    success,
    fieldErrors,

    loadSettings,

    updateSetting,
    updateSettingsLocal,

    saveSettings,
    saveSetting,

    clearMessages,
  };
}