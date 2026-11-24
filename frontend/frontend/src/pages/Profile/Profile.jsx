import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Globe,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
  UserCircle,
  CalendarDays,
  Settings,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";
import profileService from "../../services/profileService";
import { useProfile as useProfileContext } from "../../context/ProfileContext";

const EMPTY_PROFILE = {
  id: null,
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  university: "",
  country: "",
  city: "",
  date_of_birth: "",
  bio: "",
  avatar: "",
};

const EMPTY_SETTINGS = {
  language: "fr",
  timezone: "Africa/Porto-Novo",
  theme: "light",
  animations: true,
};

const COUNTRIES = [
  "Bénin",
  "Burkina Faso",
  "Côte d'Ivoire",
  "Cameroun",
  "France",
  "Guinée",
  "Mali",
  "Niger",
  "République démocratique du Congo",
  "Sénégal",
  "Togo",
  "Autre",
];

const TABS = [
  { id: "overview", label: "Vue d'ensemble", icon: UserCircle },
  { id: "personal", label: "Informations personnelles", icon: User },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "subscription", label: "Abonnement", icon: GraduationCap },
  { id: "preferences", label: "Préférences", icon: Settings },
];

function getErrorMessage(error, fallback = "Une erreur est survenue.") {
  const data = error?.response?.data;

  if (typeof data === "string") return data;

  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    const firstError = Object.values(data).flat().find(Boolean);
    if (firstError) return String(firstError);
  }

  return error?.message || fallback;
}

function formatDate(date) {
  if (!date) return "Non renseignée";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function InputField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder = "",
  icon: Icon,
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition ${
            Icon ? "pl-10" : ""
          } ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-slate-200 focus:border-slate-400"
          } ${
            disabled
              ? "cursor-not-allowed bg-slate-50 text-slate-500"
              : ""
          }`}
        />
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-700">
          {value || "Non renseigné"}
        </p>
      </div>
    </div>
  );
}

function SectionCard({ title, description, children, actions }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          )}
        </div>

        {actions}
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { setProfile: setContextProfile } = useProfileContext();

  const [activeTab, setActiveTab] = useState("overview");

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [formData, setFormData] = useState(EMPTY_PROFILE);

  const [settings, setSettings] = useState(EMPTY_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const avatarInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [profileResponse, settingsResponse] = await Promise.all([
          profileService.getProfile(),
          api.get("settings/"),
        ]);

        const profileData = profileResponse?.data || {};
        const settingsData = settingsResponse?.data || {};

        if (!mounted) return;

        const normalizedProfile = {
          ...EMPTY_PROFILE,
          ...profileData,
        };

        setProfile(normalizedProfile);
        setFormData(normalizedProfile);

        setSettings({
          ...EMPTY_SETTINGS,
          ...settingsData,
        });

        setContextProfile(normalizedProfile);
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          getErrorMessage(
            error,
            "Impossible de charger les informations du profil."
          )
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [setContextProfile]);

  useEffect(() => {
    if (!formData.avatar) {
      setAvatarPreview("");
      return undefined;
    }

    if (formData.avatar instanceof File) {
      const objectUrl = URL.createObjectURL(formData.avatar);
      setAvatarPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }

    setAvatarPreview(formData.avatar);
    return undefined;
  }, [formData.avatar]);

  const completion = useMemo(() => {
    const fields = [
      formData.first_name,
      formData.last_name,
      formData.username,
      formData.email,
      formData.phone,
      formData.university,
      formData.country,
      formData.city,
      formData.bio,
    ];

    const completed = fields.filter(
      (value) => String(value || "").trim()
    ).length;

    return Math.round((completed / fields.length) * 100);
  }, [formData]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setMessage("");
    setErrorMessage("");
  }

  function validateProfile() {
    const nextErrors = {};

    if (!formData.first_name.trim()) {
      nextErrors.first_name = "Le prénom est obligatoire.";
    }

    if (!formData.last_name.trim()) {
      nextErrors.last_name = "Le nom est obligatoire.";
    }

    if (!formData.username.trim()) {
      nextErrors.username = "Le nom d'utilisateur est obligatoire.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "L'adresse e-mail est obligatoire.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      nextErrors.email = "Adresse e-mail invalide.";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Le numéro de téléphone est obligatoire.";
    }

    if (!formData.university.trim()) {
      nextErrors.university = "L'établissement est obligatoire.";
    }

    if (!formData.country.trim()) {
      nextErrors.country = "Le pays est obligatoire.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "La ville est obligatoire.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSaveProfile(event) {
    event?.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!validateProfile()) {
      setErrorMessage(
        "Vérifie les informations obligatoires avant d'enregistrer."
      );
      setActiveTab("personal");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        university: formData.university.trim(),
        country: formData.country.trim(),
        city: formData.city.trim(),
        date_of_birth: formData.date_of_birth || null,
        bio: formData.bio.trim(),
      };

      const response = await profileService.updateProfile(payload);
      const updatedProfile = {
        ...profile,
        ...(response?.data || payload),
      };

      setProfile(updatedProfile);
      setFormData((previous) => ({
        ...previous,
        ...updatedProfile,
        avatar: previous.avatar,
      }));

      setContextProfile(updatedProfile);

      setMessage("Votre profil a été enregistré avec succès.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible d'enregistrer les modifications."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Veuillez sélectionner une image valide.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("L'image ne doit pas dépasser 5 Mo.");
      return;
    }

    setMessage("");
    setErrorMessage("");
    setAvatarUploading(true);

    try {
      const response = await profileService.uploadAvatar(file);

      const updatedProfile = {
        ...profile,
        ...(response?.data || {}),
      };

      setProfile(updatedProfile);
      setFormData((previous) => ({
        ...previous,
        ...updatedProfile,
        avatar: updatedProfile.avatar || file,
      }));

      setContextProfile(updatedProfile);

      setMessage("Photo de profil mise à jour.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible de mettre à jour la photo de profil."
        )
      );
    } finally {
      setAvatarUploading(false);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteAvatar() {
    setMessage("");
    setErrorMessage("");
    setAvatarUploading(true);

    try {
      const response = await profileService.deleteAvatar();

      const updatedProfile = {
        ...profile,
        ...(response?.data || {}),
        avatar: "",
      };

      setProfile(updatedProfile);
      setFormData((previous) => ({
        ...previous,
        avatar: "",
      }));

      setContextProfile(updatedProfile);

      setMessage("Photo de profil supprimée.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible de supprimer la photo de profil."
        )
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  function handleSettingsChange(event) {
    const { name, value, type, checked } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
    setErrorMessage("");
  }

  async function handleSavePreferences() {
    setMessage("");
    setErrorMessage("");
    setSavingPreferences(true);

    try {
      const payload = {
        language: settings.language,
        timezone: settings.timezone,
        theme: settings.theme,
        animations: settings.animations,
      };

      const response = await api.patch("settings/", payload);

      setSettings((previous) => ({
        ...previous,
        ...(response?.data || payload),
      }));

      setMessage("Préférences mises à jour avec succès.");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Impossible d'enregistrer les préférences."
        )
      );
    } finally {
      setSavingPreferences(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />

          <main className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={20} />
              Chargement du profil...
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 px-4 py-6 md:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-500">
                    Compte
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Mon profil
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Gérez vos informations personnelles et vos préférences.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => (window.location.href = "/parametres")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Settings size={17} />
                  Paramètres complets
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Alerts */}
            {message && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 size={18} />
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              {/* Sidebar profile */}
              <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-5 flex flex-col items-center border-b border-slate-100 pb-5">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-400 ring-4 ring-slate-50">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Photo de profil"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={40} />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-50"
                      title="Modifier la photo"
                    >
                      {avatarUploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Camera size={16} />
                      )}
                    </button>

                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <h2 className="mt-3 text-base font-semibold text-slate-900">
                    {formData.first_name || formData.last_name
                      ? `${formData.first_name} ${formData.last_name}`.trim()
                      : "Votre profil"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    @{formData.username || "utilisateur"}
                  </p>

                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={avatarUploading}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Supprimer la photo
                    </button>
                  )}
                </div>

                <nav className="space-y-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                          active
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon size={17} />
                        <span className="flex-1">{tab.label}</span>
                        {active && <ChevronRight size={15} />}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      Profil complété
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {completion}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
              </aside>

              {/* Main */}
              <div className="min-w-0">
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <SectionCard
                      title="Résumé du profil"
                      description="Les informations principales associées à votre compte."
                    >
                      <div className="grid gap-6 md:grid-cols-2">
                        <InfoItem
                          icon={User}
                          label="Nom complet"
                          value={`${formData.first_name} ${formData.last_name}`.trim()}
                        />

                        <InfoItem
                          icon={Mail}
                          label="E-mail"
                          value={formData.email}
                        />

                        <InfoItem
                          icon={Phone}
                          label="Téléphone"
                          value={formData.phone}
                        />

                        <InfoItem
                          icon={GraduationCap}
                          label="Établissement"
                          value={formData.university}
                        />

                        <InfoItem
                          icon={MapPin}
                          label="Localisation"
                          value={
                            [formData.city, formData.country]
                              .filter(Boolean)
                              .join(", ")
                          }
                        />

                        <InfoItem
                          icon={CalendarDays}
                          label="Date de naissance"
                          value={formatDate(formData.date_of_birth)}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      title="Biographie"
                      description="Une courte présentation visible selon vos paramètres de profil."
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {formData.bio || "Aucune biographie renseignée."}
                      </p>
                    </SectionCard>

                    <SectionCard
                      title="Compléter mon profil"
                      description="Ajoutez les informations manquantes pour disposer d'un profil complet."
                      actions={
                        <button
                          type="button"
                          onClick={() => setActiveTab("personal")}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                        >
                          Modifier
                          <Pencil size={15} />
                        </button>
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16">
                          <svg
                            viewBox="0 0 36 36"
                            className="h-16 w-16 -rotate-90"
                          >
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              className="text-slate-100"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeDasharray={`${completion}, 100`}
                              className="text-slate-900"
                            />
                          </svg>

                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">
                            {completion}%
                          </span>
                        </div>

                        <div>
                          <p className="font-medium text-slate-800">
                            Votre profil est complété à {completion}%
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Ajoutez les informations restantes pour améliorer
                            votre expérience.
                          </p>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* PERSONAL */}
                {activeTab === "personal" && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <SectionCard
                      title="Informations personnelles"
                      description="Ces informations constituent votre identité de profil."
                    >
                      <div className="grid gap-5 md:grid-cols-2">
                        <InputField
                          label="Prénom"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          error={errors.first_name}
                          icon={User}
                          placeholder="Votre prénom"
                        />

                        <InputField
                          label="Nom"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          error={errors.last_name}
                          icon={User}
                          placeholder="Votre nom"
                        />

                        <InputField
                          label="Nom d'utilisateur"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          error={errors.username}
                          placeholder="nom_utilisateur"
                        />

                        <InputField
                          label="Adresse e-mail"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          error={errors.email}
                          icon={Mail}
                          placeholder="vous@example.com"
                        />

                        <InputField
                          label="Téléphone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          error={errors.phone}
                          icon={Phone}
                          placeholder="+229..."
                        />

                        <InputField
                          label="Date de naissance"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth || ""}
                          onChange={handleChange}
                          error={errors.date_of_birth}
                          icon={CalendarDays}
                        />

                        <InputField
                          label="Université / établissement"
                          name="university"
                          value={formData.university}
                          onChange={handleChange}
                          error={errors.university}
                          icon={GraduationCap}
                          placeholder="Nom de votre établissement"
                        />

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Pays
                          </label>

                          <div className="relative">
                            <Globe
                              size={18}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                              name="country"
                              value={formData.country}
                              onChange={handleChange}
                              className={`w-full appearance-none rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition ${
                                errors.country
                                  ? "border-red-400"
                                  : "border-slate-200 focus:border-slate-400"
                              }`}
                            >
                              <option value="">Sélectionner un pays</option>

                              {COUNTRIES.map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                            </select>
                          </div>

                          {errors.country && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.country}
                            </p>
                          )}
                        </div>

                        <InputField
                          label="Ville"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          error={errors.city}
                          icon={MapPin}
                          placeholder="Votre ville"
                        />
                      </div>
                    </SectionCard>

                    <SectionCard
                      title="Biographie"
                      description="Présentez-vous en quelques lignes."
                    >
                      <textarea
                        name="bio"
                        value={formData.bio || ""}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Parlez brièvement de vous, de vos études ou de vos centres d'intérêt..."
                        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-slate-400"
                      />
                    </SectionCard>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={17} className="animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save size={17} />
                            Enregistrer les modifications
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* SECURITY */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <SectionCard
                      title="Sécurité du compte"
                      description="Les informations sensibles de votre compte sont protégées."
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                          <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                            <Shield size={20} />
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-slate-800">
                              Authentification
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Votre compte utilise l'authentification
                              sécurisée de MACEVO.
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={14} />
                            Active
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="font-medium text-slate-800">
                            Adresse e-mail du compte
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {formData.email || "Non renseignée"}
                          </p>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* SUBSCRIPTION */}
                {activeTab === "subscription" && (
                  <div className="space-y-6">
                    <SectionCard
                      title="Abonnement"
                      description="Consultez votre formule actuelle."
                    >
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Formule actuelle
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-slate-900">
                              MACEVO
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                              Gérez votre utilisation de la plateforme depuis
                              votre espace MACEVO.
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            Compte actif
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* PREFERENCES */}
                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <SectionCard
                      title="Préférences générales"
                      description="Ces réglages contrôlent votre expérience dans MACEVO."
                    >
                      <div className="grid gap-5 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Langue
                          </label>

                          <select
                            name="language"
                            value={settings.language || "fr"}
                            onChange={handleSettingsChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                          >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Fuseau horaire
                          </label>

                          <select
                            name="timezone"
                            value={
                              settings.timezone || "Africa/Porto-Novo"
                            }
                            onChange={handleSettingsChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                          >
                            <option value="Africa/Porto-Novo">
                              Afrique / Porto-Novo
                            </option>
                            <option value="Africa/Lagos">
                              Afrique / Lagos
                            </option>
                            <option value="Africa/Abidjan">
                              Afrique / Abidjan
                            </option>
                            <option value="Europe/Paris">
                              Europe / Paris
                            </option>
                            <option value="UTC">UTC</option>
                          </select>
                        </div>

                        {/* <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Thème
                          </label>

                          <select
                            name="theme"
                            value={settings.theme || "light"}
                            onChange={handleSettingsChange}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                          >
                            <option value="light">Clair</option>
                            <option value="dark">Sombre</option>
                            <option value="system">Système</option>
                          </select>
                        </div> */}

                        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Animations
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Activer les animations de l'interface.
                            </p>
                          </div>

                          <input
                            type="checkbox"
                            name="animations"
                            checked={Boolean(settings.animations)}
                            onChange={handleSettingsChange}
                            className="h-5 w-5 rounded border-slate-300"
                          />
                        </label>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSavePreferences}
                          disabled={savingPreferences}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                          {savingPreferences ? (
                            <>
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <Save size={17} />
                              Enregistrer
                            </>
                          )}
                        </button>
                      </div>
                    </SectionCard>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}