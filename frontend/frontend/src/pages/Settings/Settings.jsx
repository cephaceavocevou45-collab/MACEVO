import { useEffect, useMemo, useState } from "react";

import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

import settingsService from "../../services/settingsService";
import {
  useSettingsContext,
} from "../../context/SettingsContext";


const DEFAULT_SETTINGS = {
  timezone: "Africa/Porto-Novo",
  language: "fr",

  default_font: "inter",
  font_size: "12",
  line_spacing: "1.5",
  default_margins: "normal",

  auto_numbering: true,
  show_ruler: true,
  auto_save: true,
  latex_preview: true,
  scientific_spellcheck: true,

  ai_model: "qwen3",
  creativity: 0.7,
  academic_refs: true,
  show_sources: true,
  system_prompt:
    "Tu es un assistant scientifique rigoureux et structuré, spécialisé dans la rédaction académique de haut niveau.",

  notification_ai_messages: true,
  notification_latex_conversion: true,
  notification_tips: true,
  notification_marketing: false,

  export_format: "pdf",
  include_toc: true,
  compress_images: true,

  theme: "system",
  animations: true,

  public_profile: false,
  confirm_delete: true,
};

const SECTIONS = [
  {
    id: "account",
    label: "Compte",
    description: "Informations de connexion et sécurité",
  },
  {
    id: "editor",
    label: "Éditeur",
    description: "Préférences de rédaction",
  },
  {
    id: "ai",
    label: "Intelligence artificielle",
    description: "Comportement de l'IA",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alertes et communications",
  },
  {
    id: "storage",
    label: "Stockage et export",
    description: "Documents et exports",
  },
  {
    id: "appearance",
    label: "Apparence",
    description: "Thème et animations",
  },
  {
    id: "security",
    label: "Sécurité",
    description: "Protection du compte",
  },
];


function getErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Une erreur est survenue.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstKey = Object.keys(data)[0];

  if (firstKey) {
    const value = data[firstKey];

    if (Array.isArray(value)) {
      return value[0];
    }

    if (typeof value === "string") {
      return value;
    }

    if (value && typeof value === "object") {
      const nestedKey = Object.keys(value)[0];

      if (nestedKey) {
        const nestedValue = value[nestedKey];

        if (Array.isArray(nestedValue)) {
          return nestedValue[0];
        }

        if (typeof nestedValue === "string") {
          return nestedValue;
        }
      }
    }
  }

  return "Impossible d'effectuer cette opération.";
}


function Toggle({
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        checked
          ? "bg-indigo-600"
          : "bg-gray-300 dark:bg-gray-600",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
          checked
            ? "translate-x-5"
            : "translate-x-0.5",
          "mt-0.5",
        ].join(" ")}
      />
    </button>
  );
}


function SettingRow({
  title,
  description,
  children,
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-gray-200 py-5 last:border-b-0 dark:border-gray-700">
      <div className="min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}


function Section({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}


function applyThemeToDocument(theme) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  let resolvedTheme = theme;

  if (theme === "system") {
    resolvedTheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
      ? "dark"
      : "light";
  }

  root.classList.toggle(
    "dark",
    resolvedTheme === "dark"
  );

  root.setAttribute(
    "data-theme",
    resolvedTheme
  );

  localStorage.setItem(
    "macevo-theme",
    theme
  );
}


export default function Settings() {
  const {
    settings,
    loading,
    updateSettings,
    applyTheme,
  } = useSettingsContext();

  const [activeSection, setActiveSection] =
    useState("account");

  const [form, setForm] =
    useState(DEFAULT_SETTINGS);

  const [account, setAccount] = useState({
    full_name: "",
    email: "",
    username: "",
  });

  const [password, setPassword] = useState({
    old_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [savingAccount, setSavingAccount] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);


  /*
   * ==========================================================
   * INITIALISATION
   * ==========================================================
   */

  useEffect(() => {
    if (!settings) {
      return;
    }

    setForm((current) => ({
      ...current,
      ...settings,
    }));

    setAccount({
      full_name: settings.full_name || "",
      email: settings.email || "",
      username: settings.username || "",
    });

    if (settings.theme) {
      applyThemeToDocument(settings.theme);
    }
  }, [settings]);


  /*
   * ==========================================================
   * THÈME SYSTÈME
   * ==========================================================
   */

  useEffect(() => {
    if (form.theme !== "system") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleChange = () => {
      applyThemeToDocument("system");
    };

    mediaQuery.addEventListener(
      "change",
      handleChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange
      );
    };
  }, [form.theme]);


  /*
   * ==========================================================
   * MODIFICATION LOCALE
   * ==========================================================
   */

  const changeSetting = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };


  /*
   * ==========================================================
   * SAUVEGARDE PARAMÈTRE
   * ==========================================================
   */

  const saveSetting = async (
  name,
  value
) => {
  const previousValue =
    settings?.[name];

  try {
    setMessage("");
    setError("");

    changeSetting(name, value);

    if (name === "theme") {
      applyTheme(value);
    }

    await updateSettings({
      [name]: value,
    });

    setMessage(
      "Paramètre enregistré."
    );
  } catch (err) {
    setForm((current) => ({
      ...current,
      [name]:
        previousValue ??
        DEFAULT_SETTINGS[name],
    }));

    if (
      name === "theme" &&
      previousValue
    ) {
      applyTheme(previousValue);
    }

    setError(
      getErrorMessage(err)
    );
  }
};
  /*
   * ==========================================================
   * COMPTE
   * ==========================================================
   */

  const saveAccount = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const fullName =
      account.full_name.trim();

    const email =
      account.email.trim();

    if (!fullName) {
      setError(
        "Le nom complet est obligatoire."
      );
      return;
    }

    if (!email) {
      setError(
        "L'adresse email est obligatoire."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "L'adresse email est invalide."
      );
      return;
    }

    try {
      setSavingAccount(true);

      const updated =
        await settingsService.updateAccount({
          full_name: fullName,
          email,
        });

      setAccount((current) => ({
        ...current,

        full_name:
          updated?.full_name ||
          fullName,

        email:
          updated?.email ||
          email,

        username:
          updated?.username ||
          current.username,
      }));

      setMessage(
        "Les informations du compte ont été enregistrées."
      );
    } catch (err) {
      console.error(
        "Erreur mise à jour compte :",
        err
      );

      setError(
        getErrorMessage(err)
      );
    } finally {
      setSavingAccount(false);
    }
  };


  /*
   * ==========================================================
   * MOT DE PASSE
   * ==========================================================
   */

  const changePassword = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");
    setMessage("");
    setError("");

    if (!password.old_password) {
      setPasswordError(
        "Saisis ton mot de passe actuel."
      );
      return;
    }

    if (!password.new_password) {
      setPasswordError(
        "Saisis un nouveau mot de passe."
      );
      return;
    }

    if (
      password.new_password.length < 8
    ) {
      setPasswordError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (
      password.new_password !==
      password.new_password_confirmation
    ) {
      setPasswordError(
        "Les deux nouveaux mots de passe ne correspondent pas."
      );
      return;
    }

    try {
      setChangingPassword(true);

      await settingsService.changePassword(
        password
      );

      setPassword({
        old_password: "",
        new_password: "",
        new_password_confirmation: "",
      });

      setPasswordMessage(
        "Mot de passe modifié avec succès."
      );
    } catch (err) {
      console.error(
        "Erreur changement mot de passe :",
        err
      );

      setPasswordError(
        getErrorMessage(err)
      );
    } finally {
      setChangingPassword(false);
    }
  };


  /*
   * ==========================================================
   * TITRE COMPTE
   * ==========================================================
   */

  const accountTitle = useMemo(() => {
    if (account.full_name) {
      return account.full_name;
    }

    if (account.username) {
      return account.username;
    }

    return "Mon compte";
  }, [
    account.full_name,
    account.username,
  ]);


  /*
   * ==========================================================
   * CHARGEMENT
   * ==========================================================
   */

  if (loading && !settings) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
          <Navbar />

          <main className="flex flex-1 items-center justify-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Chargement des paramètres...
            </div>
          </main>
        </div>
      </div>
    );
  }


  /*
   * ==========================================================
   * RENDU
   * ==========================================================
   */

  return (
    <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
    
            <div className="flex min-w-0 flex-1 flex-col">
              <Navbar />

        {/* ====================================================
            CONTENU PARAMÈTRES
        ===================================================== */}

        <main className="flex-1">

          <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">

            {/* =================================================
                SIDEBAR DES PARAMÈTRES
            ================================================== */}

            <aside className="hidden w-64 shrink-0 lg:block">

              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">

                <div className="px-3 pb-4 pt-2">

                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Paramètres
                  </h1>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Personnalise ton expérience MACEVO.
                  </p>

                </div>


                <nav className="space-y-1">

                  {SECTIONS.map(
                    (section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() =>
                          setActiveSection(
                            section.id
                          )
                        }
                        className={[
                          "w-full rounded-xl px-3 py-3 text-left transition",
                          activeSection ===
                          section.id
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                        ].join(" ")}
                      >

                        <div className="text-sm font-medium">
                          {section.label}
                        </div>

                        <div className="mt-0.5 text-xs opacity-70">
                          {section.description}
                        </div>

                      </button>
                    )
                  )}

                </nav>

              </div>

            </aside>


            {/* =================================================
                CONTENU
            ================================================== */}

            <section className="min-w-0 flex-1">

              {/* =================================================
                  NAVIGATION MOBILE
              ================================================== */}

              <div className="mb-6 overflow-x-auto lg:hidden">

                <div className="flex gap-2">

                  {SECTIONS.map(
                    (section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() =>
                          setActiveSection(
                            section.id
                          )
                        }
                        className={[
                          "whitespace-nowrap rounded-xl px-4 py-2 text-sm",
                          activeSection ===
                          section.id
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                        ].join(" ")}
                      >
                        {section.label}
                      </button>
                    )
                  )}

                </div>

              </div>


              {/* =================================================
                  MESSAGES
              ================================================== */}

              {message && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                  {message}
                </div>
              )}


              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {error}
                </div>
              )}


              {/* =================================================
                  COMPTE
              ================================================== */}

              {activeSection === "account" && (
                <div className="space-y-6">

                  <Section
                    title={accountTitle}
                    description="Gère les informations principales de ton compte."
                  >

                    <form
                      onSubmit={saveAccount}
                      className="space-y-5"
                    >

                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nom complet
                        </label>

                        <input
                          type="text"
                          value={
                            account.full_name
                          }
                          onChange={(event) =>
                            setAccount(
                              (current) => ({
                                ...current,
                                full_name:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          placeholder="Ton nom complet"
                        />

                      </div>


                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Adresse email
                        </label>

                        <input
                          type="email"
                          value={
                            account.email
                          }
                          onChange={(event) =>
                            setAccount(
                              (current) => ({
                                ...current,
                                email:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          placeholder="email@example.com"
                        />

                      </div>


                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nom d'utilisateur
                        </label>

                        <input
                          type="text"
                          value={
                            account.username
                          }
                          disabled
                          className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                          Le nom d'utilisateur est géré par ton compte.
                        </p>

                      </div>


                      <button
                        type="submit"
                        disabled={
                          savingAccount
                        }
                        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingAccount
                          ? "Enregistrement..."
                          : "Enregistrer les informations"}
                      </button>

                    </form>

                  </Section>


                  <Section
                    title="Langue et localisation"
                    description="Définit la langue et le fuseau horaire utilisés par MACEVO."
                  >

                    <SettingRow
                      title="Langue"
                      description="Langue de l'interface."
                    >

                      <select
                        value={
                          form.language ||
                          "fr"
                        }
                        onChange={(event) =>
                          saveSetting(
                            "language",
                            event.target
                              .value
                          )
                        }
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >

                        <option value="fr">
                          Français
                        </option>

                        <option value="en">
                          English
                        </option>

                        <option value="zh">
                          中文
                        </option>

                        <option value="ar">
                          العربية
                        </option>

                      </select>

                    </SettingRow>


                    <SettingRow
                      title="Fuseau horaire"
                      description="Utilisé pour les dates et notifications."
                    >

                      <input
                        type="text"
                        value={
                          form.timezone ||
                          ""
                        }
                        onChange={(event) =>
                          changeSetting(
                            "timezone",
                            event.target
                              .value
                          )
                        }
                        onBlur={() =>
                          saveSetting(
                            "timezone",
                            form.timezone
                          )
                        }
                        className="w-52 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        placeholder="Africa/Porto-Novo"
                      />

                    </SettingRow>

                  </Section>

                </div>
              )}


              {/* =================================================
                  EDITEUR
              ================================================== */}

              {activeSection === "editor" && (
  <Section
    title="Éditeur"
    description="Configure ton environnement de rédaction."
  >
    <SettingRow
      title="Police par défaut"
      description="Police utilisée dans les nouveaux documents."
    >
      <select
        value={form.default_font || "inter"}
        onChange={(event) =>
          saveSetting(
            "default_font",
            event.target.value
          )
        }
        className="min-w-[190px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="inter">
          Inter
        </option>

        <option value="roboto">
          Roboto
        </option>

        <option value="times_new_roman">
          Times New Roman
        </option>
      </select>
    </SettingRow>

    <SettingRow
      title="Taille de police"
      description="Taille par défaut du texte."
    >
      <select
        value={String(form.font_size ?? "12")}
        onChange={(event) =>
          saveSetting(
            "font_size",
            event.target.value
          )
        }
        className="min-w-[110px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="10">10 pt</option>
        <option value="11">11 pt</option>
        <option value="12">12 pt</option>
        <option value="14">14 pt</option>
        <option value="16">16 pt</option>
      </select>
    </SettingRow>

    <SettingRow
      title="Interligne"
      description="Espacement vertical entre les lignes."
    >
      <select
        value={String(form.line_spacing ?? "1.5")}
        onChange={(event) =>
          saveSetting(
            "line_spacing",
            event.target.value
          )
        }
        className="min-w-[110px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="1.0">1.0</option>
        <option value="1.15">1.15</option>
        <option value="1.5">1.5</option>
        <option value="2.0">2.0</option>
      </select>
    </SettingRow>

    <SettingRow
      title="Marges par défaut"
      description="Définit les marges utilisées dans les nouveaux documents."
    >
      <select
        value={form.default_margins || "normal"}
        onChange={(event) =>
          saveSetting(
            "default_margins",
            event.target.value
          )
        }
        className="min-w-[150px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="narrow">
          Étroites
        </option>

        <option value="normal">
          Normales
        </option>

        <option value="wide">
          Larges
        </option>
      </select>
    </SettingRow>

    <SettingRow
      title="Numérotation automatique"
      description="Numérote automatiquement les éléments concernés."
    >
      <Toggle
        checked={Boolean(form.auto_numbering)}
        onChange={(value) =>
          saveSetting(
            "auto_numbering",
            value
          )
        }
      />
    </SettingRow>

    <SettingRow
      title="Afficher la règle"
      description="Affiche la règle de mise en page."
    >
      <Toggle
        checked={Boolean(form.show_ruler)}
        onChange={(value) =>
          saveSetting(
            "show_ruler",
            value
          )
        }
      />
    </SettingRow>

    <SettingRow
      title="Sauvegarde automatique"
      description="Sauvegarde automatiquement les modifications."
    >
      <Toggle
        checked={Boolean(form.auto_save)}
        onChange={(value) =>
          saveSetting(
            "auto_save",
            value
          )
        }
      />
    </SettingRow>

    <SettingRow
      title="Prévisualisation LaTeX"
      description="Active la prévisualisation des formules LaTeX."
    >
      <Toggle
        checked={Boolean(form.latex_preview)}
        onChange={(value) =>
          saveSetting(
            "latex_preview",
            value
          )
        }
      />
    </SettingRow>

    <SettingRow
      title="Correction scientifique"
      description="Active la correction adaptée aux textes scientifiques."
    >
      <Toggle
        checked={Boolean(form.scientific_spellcheck)}
        onChange={(value) =>
          saveSetting(
            "scientific_spellcheck",
            value
          )
        }
      />
    </SettingRow>
  </Section>
)}

              {/* =================================================
                  IA
              ================================================== */}

              {activeSection === "ai" && (
                <Section
                  title="Intelligence artificielle"
                  description="Configure le comportement de l'assistant MACEVO."
                >

                  <SettingRow
                    title="Modèle IA"
                    description="Modèle utilisé par défaut."
                  >

                    <select
                      value={form.ai_model || "qwen3"}
                      onChange={(event) =>
                        saveSetting(
                          "ai_model",
                          event.target.value
                        )
                      }
                      className="min-w-[190px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="qwen3">
                        Qwen3
                      </option>

                      <option value="gpt-4o">
                        GPT-4o
                      </option>

                      <option value="claude-3-5-sonnet">
                        Claude 3.5 Sonnet
                      </option>
                    </select>

                  </SettingRow>


                  <SettingRow
                    title="Créativité"
                    description="Contrôle le niveau de créativité des réponses."
                  >

                    <div className="flex items-center gap-3">

                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={
                          form.creativity
                        }
                        onChange={(event) =>
                          changeSetting(
                            "creativity",
                            Number(
                              event.target.value
                            )
                          )
                        }
                        onMouseUp={() =>
                          saveSetting(
                            "creativity",
                            form.creativity
                          )
                        }
                        onTouchEnd={() =>
                          saveSetting(
                            "creativity",
                            form.creativity
                          )
                        }
                      />

                      <span className="w-10 text-right text-sm text-gray-600 dark:text-gray-300">
                        {Number(
                          form.creativity
                        ).toFixed(2)}
                      </span>

                    </div>

                  </SettingRow>


                  <SettingRow
                    title="Références académiques"
                    description="Autorise l'utilisation de références académiques."
                  >

                    <Toggle
                      checked={Boolean(
                        form.academic_refs
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "academic_refs",
                          value
                        )
                      }
                    />

                  </SettingRow>


                  <SettingRow
                    title="Afficher les sources"
                    description="Affiche les sources utilisées par l'IA."
                  >

                    <Toggle
                      checked={Boolean(
                        form.show_sources
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "show_sources",
                          value
                        )
                      }
                    />

                  </SettingRow>


                  <div className="mt-6">

                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prompt système
                    </label>

                    <textarea
                      rows={8}
                      value={
                        form.system_prompt ||
                        ""
                      }
                      onChange={(event) =>
                        changeSetting(
                          "system_prompt",
                          event.target.value
                        )
                      }
                      onBlur={() =>
                        saveSetting(
                          "system_prompt",
                          form.system_prompt
                        )
                      }
                      maxLength={10000}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Instructions générales données à l'assistant..."
                    />

                    <p className="mt-1 text-xs text-gray-500">
                      Maximum 10 000 caractères.
                    </p>

                  </div>

                </Section>
              )}


              {/* =================================================
                  NOTIFICATIONS
              ================================================== */}

              {activeSection === "notifications" && (
                <Section
                  title="Notifications"
                  description="Choisis les communications que tu souhaites recevoir."
                >

                  <SettingRow
                    title="Messages IA"
                    description="Notifications lorsque l'IA termine une réponse."
                  >

                    <Toggle
                      checked={Boolean(
                        form.notification_ai_messages
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "notification_ai_messages",
                          value
                        )
                      }
                    />

                  </SettingRow>


                  <SettingRow
                    title="Conversion LaTeX"
                    description="Notifications relatives aux conversions LaTeX."
                  >

                    <Toggle
                      checked={Boolean(
                        form.notification_latex_conversion
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "notification_latex_conversion",
                          value
                        )
                      }
                    />

                  </SettingRow>


                  <SettingRow
                    title="Conseils"
                    description="Recevoir des conseils d'utilisation de MACEVO."
                  >

                    <Toggle
                      checked={Boolean(
                        form.notification_tips
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "notification_tips",
                          value
                        )
                      }
                    />

                  </SettingRow>


                  <SettingRow
                    title="Communications marketing"
                    description="Recevoir les communications commerciales."
                  >

                    <Toggle
                      checked={Boolean(
                        form.notification_marketing
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "notification_marketing",
                          value
                        )
                      }
                    />

                  </SettingRow>

                </Section>
              )}


              {/* =================================================
                  STOCKAGE
              ================================================== */}

              {activeSection === "storage" && (
                <Section
                  title="Stockage et export"
                  description="Configure les formats de sortie de tes documents."
                >

                  <SettingRow
                    title="Format d'export"
                    description="Format utilisé par défaut."
                  >

                    <select
                      value={
                        form.export_format
                      }
                      onChange={(event) =>
                        saveSetting(
                          "export_format",
                          event.target.value
                        )
                      }
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >

                      <option value="pdf">
                        PDF
                      </option>

                      <option value="docx">
                        DOCX
                      </option>

                      <option value="latex">
                        LaTeX
                      </option>


                    </select>

                  </SettingRow>


                  <SettingRow
                    title="Inclure la table des matières"
                    description="Ajoute automatiquement la table des matières lors de l'export."
                  >

                    <Toggle
                      checked={Boolean(
                        form.include_toc
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "include_toc",
                          value
                        )
                      }
                    />

                  </SettingRow>


                  <SettingRow
                    title="Compresser les images"
                    description="Réduit la taille des documents exportés."
                  >

                    <Toggle
                      checked={Boolean(
                        form.compress_images
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "compress_images",
                          value
                        )
                      }
                    />

                  </SettingRow>

                </Section>
              )}


              {/* =================================================
                  APPARENCE
              ================================================== */}

              {activeSection === "appearance" && (
                <Section
                  title="Apparence"
                  description="Le changement de thème est appliqué immédiatement et sauvegardé sur ton compte."
                >

                  <SettingRow
                    title="Thème"
                    description="Choisis le thème de MACEVO."
                  >

                    <select
                      value={
                        form.theme ||
                        "system"
                      }
                      onChange={(event) => {
                        const value =
                          event.target
                            .value;

                        saveSetting(
                          "theme",
                          value
                        );
                      }}
                      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >

                      <option value="system">
                        Système
                      </option>

                      <option value="light">
                        Clair
                      </option>

                      <option value="dark">
                        Sombre
                      </option>

                    </select>

                  </SettingRow>


                  <SettingRow
                    title="Animations"
                    description="Active les animations de l'interface."
                  >

                    <Toggle
                      checked={Boolean(
                        form.animations
                      )}
                      onChange={(value) =>
                        saveSetting(
                          "animations",
                          value
                        )
                      }
                    />

                  </SettingRow>

                </Section>
              )}


              {/* =================================================
                  SECURITE
              ================================================== */}

              {activeSection === "security" && (
                <div className="space-y-6">

                  <Section
                    title="Changer le mot de passe"
                    description="Modifie réellement le mot de passe de ton compte."
                  >

                    {passwordMessage && (
                      <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                        {passwordMessage}
                      </div>
                    )}


                    {passwordError && (
                      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {passwordError}
                      </div>
                    )}


                    <form
                      onSubmit={
                        changePassword
                      }
                      className="space-y-5"
                    >

                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Mot de passe actuel
                        </label>

                        <input
                          type="password"
                          autoComplete="current-password"
                          value={
                            password.old_password
                          }
                          onChange={(event) =>
                            setPassword(
                              (current) => ({
                                ...current,
                                old_password:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />

                      </div>


                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nouveau mot de passe
                        </label>

                        <input
                          type="password"
                          autoComplete="new-password"
                          value={
                            password.new_password
                          }
                          onChange={(event) =>
                            setPassword(
                              (current) => ({
                                ...current,
                                new_password:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />

                      </div>


                      <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirmer le nouveau mot de passe
                        </label>

                        <input
                          type="password"
                          autoComplete="new-password"
                          value={
                            password.new_password_confirmation
                          }
                          onChange={(event) =>
                            setPassword(
                              (current) => ({
                                ...current,
                                new_password_confirmation:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />

                      </div>


                      <button
                        type="submit"
                        disabled={
                          changingPassword
                        }
                        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {changingPassword
                          ? "Modification..."
                          : "Changer le mot de passe"}
                      </button>

                    </form>

                  </Section>


                  <Section
                    title="Profil public"
                    description="Contrôle la visibilité de ton profil."
                  >

                    <SettingRow
                      title="Profil public"
                      description="Autorise les autres utilisateurs à voir ton profil public."
                    >

                      <Toggle
                        checked={Boolean(
                          form.public_profile
                        )}
                        onChange={(value) =>
                          saveSetting(
                            "public_profile",
                            value
                          )
                        }
                      />

                    </SettingRow>

                  </Section>


                  <Section
                    title="Suppression"
                    description="Paramètres relatifs aux opérations sensibles."
                  >

                    <SettingRow
                      title="Demander confirmation"
                      description="Demander une confirmation avant une suppression définitive."
                    >

                      <Toggle
                        checked={Boolean(
                          form.confirm_delete
                        )}
                        onChange={(value) =>
                          saveSetting(
                            "confirm_delete",
                            value
                          )
                        }
                      />

                    </SettingRow>

                  </Section>

                </div>
              )}

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}