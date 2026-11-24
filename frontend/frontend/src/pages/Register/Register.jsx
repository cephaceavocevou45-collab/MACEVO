import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  FolderOpen,
  FileEdit,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  MoreHorizontal,
  Clock3,
  Download,
  Sparkles,
} from "lucide-react";

export default function Register() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  /* ============================================================
     PASSWORD STRENGTH
  ============================================================ */

  const getPasswordStrength = () => {
    if (!password) {
      return {
        score: 0,
        label: "",
      };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return {
        score,
        label: "Faible",
      };
    }

    if (score === 2) {
      return {
        score,
        label: "Moyen",
      };
    }

    if (score === 3) {
      return {
        score,
        label: "Bon",
      };
    }

    return {
      score,
      label: "Excellent",
    };
  };

  const passwordStrength = getPasswordStrength();

  /* ============================================================
     ERROR RESET
  ============================================================ */

  const clearMessages = () => {
    if (error) setError("");
    if (success) setSuccess("");
  };

  /* ============================================================
     REGISTER
  ============================================================ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!firstname.trim()) {
      setError("Veuillez renseigner votre prénom.");
      return;
    }

    if (!lastname.trim()) {
      setError("Veuillez renseigner votre nom.");
      return;
    }

    if (!email.trim()) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    if (!password) {
      setError("Veuillez choisir un mot de passe.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!acceptTerms) {
      setError(
        "Veuillez accepter les conditions d'utilisation pour continuer."
      );
      return;
    }

    try {
      setLoading(true);

      const fullname = `${firstname.trim()} ${lastname.trim()}`;

      const response = await authService.register({
        fullname,
        email: email.trim(),
        password,
        confirmPassword,
      });

      login(response.data);

      setSuccess("Votre compte MACEVO a été créé avec succès.");

      setTimeout(() => {
        navigate("/profil");
      }, 1000);
    } catch (err) {
      console.error("Erreur inscription :", err);

      const data = err?.response?.data;

      if (data?.email) {
        setError(
          Array.isArray(data.email) ? data.email[0] : data.email
        );
      } else if (data?.password) {
        setError(
          Array.isArray(data.password) ? data.password[0] : data.password
        );
      } else if (data?.confirmPassword) {
        setError(
          Array.isArray(data.confirmPassword)
            ? data.confirmPassword[0]
            : data.confirmPassword
        );
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError(
          "Impossible de créer votre compte pour le moment. Veuillez réessayer."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     GOOGLE REGISTER
  ============================================================ */

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const response = await authService.googleLogin({
        token: credentialResponse.credential,
      });

      login(response.data);

      navigate("/dashboard");
    } catch (err) {
      console.error("Erreur inscription Google :", err);

      const data = err?.response?.data;

      setError(
        data?.detail ||
          "L'inscription avec Google a échoué. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("L'inscription avec Google a été annulée.");
  };

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#f4f7fb] text-slate-900">
      <style>{`
        @keyframes registerFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes registerFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes registerPulse {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.65;
          }
        }

        .register-fade-up {
          animation: registerFadeUp 0.7s ease-out both;
        }

        .register-float {
          animation: registerFloat 5s ease-in-out infinite;
        }

        .register-pulse {
          animation: registerPulse 4s ease-in-out infinite;
        }

        .macevo-preview-shadow {
          box-shadow:
            0 30px 80px rgba(15, 23, 42, 0.16),
            0 8px 30px rgba(15, 23, 42, 0.08);
        }

        .macevo-window-shadow {
          box-shadow:
            0 20px 45px rgba(15, 23, 42, 0.12),
            0 4px 12px rgba(15, 23, 42, 0.06);
        }

        .thin-scrollbar::-webkit-scrollbar {
          width: 5px;
        }

        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }
      `}</style>

      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.82fr_1.55fr]">

        {/* ======================================================
            LEFT — REGISTER FORM
        ====================================================== */}

        <section className="relative z-10 flex min-h-screen items-center justify-center overflow-y-auto bg-white px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="register-fade-up w-full max-w-[480px]">

            {/* LOGO */}

            <div className="mb-8 flex items-center justify-between">
              <Link
                to="/"
                className="group inline-flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <span className="text-lg font-black tracking-tight">
                    M
                  </span>
                </div>

                <div>
                  <div className="text-[20px] font-black tracking-[-0.04em] text-slate-950">
                    MACEVO
                  </div>

                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Intelligence scientifique
                  </div>
                </div>
              </Link>

              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-500">
                  Espace sécurisé
                </span>
              </div>
            </div>

            {/* TITLE */}

            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <GraduationCap className="h-3.5 w-3.5" />
                Votre espace étudiant
              </div>

              <h1 className="text-[34px] font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[38px]">
                Créez votre espace
                <span className="block text-blue-600">
                  scientifique.
                </span>
              </h1>

              <p className="mt-3 max-w-[420px] text-[14px] leading-6 text-slate-500">
                Centralisez vos travaux, rédigez vos rapports et
                préparez vos documents scientifiques avec MACEVO.
              </p>
            </div>

            {/* GOOGLE */}

            {googleClientId && (
              <div className="mb-5">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signup_with"
                    shape="rectangular"
                    size="large"
                    width="100%"
                  />
                </div>
              </div>
            )}

            {/* SEPARATOR */}

            {googleClientId && (
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  ou avec votre e-mail
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* FIRST / LAST NAME */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="firstname"
                    className="mb-2 block text-[12px] font-bold text-slate-700"
                  >
                    Prénom
                  </label>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="firstname"
                      type="text"
                      value={firstname}
                      onChange={(e) => {
                        setFirstname(e.target.value);
                        clearMessages();
                      }}
                      placeholder="Votre prénom"
                      autoComplete="given-name"
                      className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastname"
                    className="mb-2 block text-[12px] font-bold text-slate-700"
                  >
                    Nom
                  </label>

                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="lastname"
                      type="text"
                      value={lastname}
                      onChange={(e) => {
                        setLastname(e.target.value);
                        clearMessages();
                      }}
                      placeholder="Votre nom"
                      autoComplete="family-name"
                      className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

              </div>

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[12px] font-bold text-slate-700"
                >
                  Adresse e-mail
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearMessages();
                    }}
                    placeholder="exemple@email.com"
                    autoComplete="email"
                    className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[12px] font-bold text-slate-700"
                  >
                    Mot de passe
                  </label>

                  {passwordStrength.label && (
                    <span
                      className={`text-[11px] font-bold ${
                        passwordStrength.score <= 1
                          ? "text-red-500"
                          : passwordStrength.score === 2
                          ? "text-amber-500"
                          : passwordStrength.score === 3
                          ? "text-blue-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearMessages();
                    }}
                    placeholder="8 caractères minimum"
                    autoComplete="new-password"
                    className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* PASSWORD STRENGTH */}

                {password && (
                  <div className="mt-2.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((item) => (
                        <div
                          key={item}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            item <= passwordStrength.score
                              ? passwordStrength.score <= 1
                                ? "bg-red-400"
                                : passwordStrength.score === 2
                                ? "bg-amber-400"
                                : passwordStrength.score === 3
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Utilisez des lettres majuscules, chiffres et caractères
                      spéciaux pour renforcer votre mot de passe.
                    </p>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-[12px] font-bold text-slate-700"
                >
                  Confirmer le mot de passe
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearMessages();
                    }}
                    placeholder="Retapez votre mot de passe"
                    autoComplete="new-password"
                    className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-[13px] font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label={
                      showConfirmPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {confirmPassword && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {password === confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[10px] font-semibold text-emerald-600">
                          Les mots de passe correspondent.
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold text-red-500">
                        Les mots de passe ne correspondent pas.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* TERMS */}

              <label className="flex cursor-pointer items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    clearMessages();
                  }}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600"
                />

                <span className="text-[11px] leading-5 text-slate-500">
                  J'accepte les{" "}
                  <Link
                    to="/conditions"
                    className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-blue-600"
                  >
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link
                    to="/confidentialite"
                    className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-blue-600"
                  >
                    politique de confidentialité
                  </Link>{" "}
                  de MACEVO.
                </span>
              </label>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-medium leading-5 text-red-600">
                  {error}
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[12px] font-medium leading-5 text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* CTA */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-[13px] font-bold text-white shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Création de votre espace...
                  </>
                ) : (
                  <>
                    Créer mon espace MACEVO
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* LOGIN */}

            <div className="mt-7 text-center">
              <span className="text-[12px] text-slate-500">
                Vous avez déjà un compte ?
              </span>{" "}
              <Link
                to="/connexion"
                className="text-[12px] font-bold text-blue-600 transition-colors hover:text-blue-700"
              >
                Se connecter
              </Link>
            </div>

            {/* SECURITY FOOTER */}

            <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Vos informations de compte servent à gérer votre espace MACEVO.
            </div>
          </div>
        </section>

        {/* ======================================================
            RIGHT — REALISTIC MACEVO PRODUCT PREVIEW
        ====================================================== */}

        <section className="relative hidden min-h-screen overflow-hidden bg-[#eef3f9] lg:block">

          {/* BACKGROUND */}

          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(37,99,235,0.10),transparent_30%),radial-gradient(circle_at_20%_85%,rgba(14,165,233,0.07),transparent_28%)]" />

            <div
              className="absolute inset-0 opacity-[0.45]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
              }}
            />
          </div>

          {/* CONTENT */}

          <div className="relative flex min-h-screen flex-col px-8 py-8 xl:px-12">

            {/* TOP BRAND */}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600">
                  Plateforme scientifique
                </p>

                <h2 className="mt-2 max-w-[600px] text-[28px] font-black leading-tight tracking-[-0.04em] text-slate-950 xl:text-[34px]">
                  Un espace conçu pour
                  <span className="text-blue-600">
                    {" "}
                    travailler intelligemment.
                  </span>
                </h2>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md xl:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-600">
                  MACEVO opérationnel
                </span>
              </div>
            </div>

            {/* PRODUCT PREVIEW */}

            <div className="register-float macevo-preview-shadow relative mt-9 flex-1 rounded-[20px] border border-white bg-white p-2">

              <div className="flex h-full min-h-[590px] overflow-hidden rounded-[15px] border border-slate-200 bg-[#f8fafc]">

                {/* SIDEBAR */}

                <aside className="hidden w-[185px] shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">

                  {/* SIDEBAR LOGO */}

                  <div className="flex h-[62px] items-center gap-2.5 border-b border-slate-100 px-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <span className="text-xs font-black">
                        M
                      </span>
                    </div>

                    <div>
                      <div className="text-[12px] font-black tracking-[-0.03em] text-slate-950">
                        MACEVO
                      </div>

                      <div className="text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Intelligence
                      </div>
                    </div>
                  </div>

                  {/* NAVIGATION */}

                  <div className="flex-1 px-3 py-5">

                    <div className="mb-2 px-2 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Workspace
                    </div>

                    <div className="space-y-1">

                      <div className="flex h-9 items-center gap-2.5 rounded-lg bg-blue-50 px-3 text-[10px] font-bold text-blue-700">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Tableau de bord
                      </div>

                      <div className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[10px] font-medium text-slate-500">
                        <FolderOpen className="h-3.5 w-3.5" />
                        Mes rapports
                      </div>

                      <div className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[10px] font-medium text-slate-500">
                        <FileEdit className="h-3.5 w-3.5" />
                        Éditeur
                      </div>

                      <div className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[10px] font-medium text-slate-500">
                        <FileText className="h-3.5 w-3.5" />
                        Modèles
                      </div>

                    </div>

                    <div className="mb-2 mt-7 px-2 text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Assistance
                    </div>

                    <div className="space-y-1">

                      <div className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[10px] font-medium text-slate-500">
                        <Settings className="h-3.5 w-3.5" />
                        Paramètres
                      </div>

                      <div className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[10px] font-medium text-slate-500">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Centre d'aide
                      </div>

                    </div>
                  </div>

                  {/* USER */}

                  <div className="border-t border-slate-100 p-3">

                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                        C
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[9px] font-bold text-slate-700">
                          Étudiant
                        </div>

                        <div className="truncate text-[8px] text-slate-400">
                          Espace personnel
                        </div>
                      </div>

                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </div>

                  </div>
                </aside>

                {/* MAIN APP */}

                <main className="min-w-0 flex-1">

                  {/* APP HEADER */}

                  <header className="flex h-[62px] items-center justify-between border-b border-slate-200 bg-white px-5">

                    <div className="relative hidden w-[230px] sm:block">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                      <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 pl-9 text-[9px] text-slate-400">
                        Rechercher un rapport...
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2">

                      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white">
                        <Bell className="h-3.5 w-3.5 text-slate-500" />
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
                      </div>

                      <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                          C
                        </div>

                        <div className="hidden sm:block">
                          <div className="text-[9px] font-bold text-slate-700">
                            Mon espace
                          </div>

                          <div className="text-[8px] text-slate-400">
                            Étudiant
                          </div>
                        </div>
                      </div>

                    </div>
                  </header>

                  {/* DASHBOARD CONTENT */}

                  <div className="thin-scrollbar h-[calc(100%-62px)] overflow-y-auto p-5">

                    {/* GREETING */}

                    <div className="flex items-start justify-between">

                      <div>
                        <p className="text-[9px] font-semibold text-slate-400">
                          ESPACE PERSONNEL
                        </p>

                        <h3 className="mt-1 text-[19px] font-black tracking-[-0.035em] text-slate-900">
                          Bonjour, bienvenue sur MACEVO.
                        </h3>

                        <p className="mt-1 text-[9px] text-slate-500">
                          Retrouvez vos travaux et continuez votre rédaction.
                        </p>
                      </div>

                      <button className="hidden items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-[9px] font-bold text-white shadow-sm sm:flex">
                        <FileText className="h-3 w-3" />
                        Nouveau rapport
                      </button>

                    </div>

                    {/* STATS */}

                    <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-semibold text-slate-400">
                            Rapports
                          </span>

                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                        </div>

                        <div className="mt-2 text-[18px] font-black text-slate-900">
                          12
                        </div>

                        <div className="mt-1 text-[8px] text-emerald-600">
                          +3 ce mois
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-semibold text-slate-400">
                            En rédaction
                          </span>

                          <FileEdit className="h-3.5 w-3.5 text-violet-500" />
                        </div>

                        <div className="mt-2 text-[18px] font-black text-slate-900">
                          4
                        </div>

                        <div className="mt-1 text-[8px] text-slate-400">
                          travaux actifs
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-semibold text-slate-400">
                            Modèles
                          </span>

                          <LayoutDashboard className="h-3.5 w-3.5 text-cyan-500" />
                        </div>

                        <div className="mt-2 text-[18px] font-black text-slate-900">
                          24
                        </div>

                        <div className="mt-1 text-[8px] text-slate-400">
                          disponibles
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-semibold text-slate-400">
                            Exports
                          </span>

                          <Download className="h-3.5 w-3.5 text-emerald-500" />
                        </div>

                        <div className="mt-2 text-[18px] font-black text-slate-900">
                          18
                        </div>

                        <div className="mt-1 text-[8px] text-slate-400">
                          documents PDF
                        </div>
                      </div>

                    </div>

                    {/* LOWER CONTENT */}

                    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.8fr]">

                      {/* RECENT REPORTS */}

                      <div className="rounded-xl border border-slate-200 bg-white">

                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                          <div>
                            <h4 className="text-[10px] font-black text-slate-800">
                              Mes derniers rapports
                            </h4>

                            <p className="mt-0.5 text-[8px] text-slate-400">
                              Vos travaux récents
                            </p>
                          </div>

                          <button className="text-[8px] font-bold text-blue-600">
                            Voir tout
                          </button>

                        </div>

                        <div className="divide-y divide-slate-100">

                          {/* REPORT 1 */}

                          <div className="flex items-center gap-3 px-4 py-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <FileText className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[9px] font-bold text-slate-700">
                                Mémoire de Licence
                              </div>

                              <div className="mt-0.5 flex items-center gap-2 text-[8px] text-slate-400">
                                <span>Informatique</span>
                                <span>•</span>
                                <span>Modifié il y a 2 min</span>
                              </div>
                            </div>

                            <div className="hidden w-[75px] sm:block">
                              <div className="mb-1 flex justify-between text-[7px]">
                                <span className="text-slate-400">
                                  Progression
                                </span>
                                <span className="font-bold text-blue-600">
                                  78%
                                </span>
                              </div>

                              <div className="h-1 rounded-full bg-slate-100">
                                <div className="h-1 w-[78%] rounded-full bg-blue-600" />
                              </div>
                            </div>

                            <MoreHorizontal className="h-4 w-4 text-slate-400" />

                          </div>

                          {/* REPORT 2 */}

                          <div className="flex items-center gap-3 px-4 py-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                              <FileText className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[9px] font-bold text-slate-700">
                                Rapport de stage
                              </div>

                              <div className="mt-0.5 flex items-center gap-2 text-[8px] text-slate-400">
                                <span>Sciences</span>
                                <span>•</span>
                                <span>Hier</span>
                              </div>
                            </div>

                            <div className="hidden w-[75px] sm:block">
                              <div className="mb-1 flex justify-between text-[7px]">
                                <span className="text-slate-400">
                                  Progression
                                </span>
                                <span className="font-bold text-violet-600">
                                  52%
                                </span>
                              </div>

                              <div className="h-1 rounded-full bg-slate-100">
                                <div className="h-1 w-[52%] rounded-full bg-violet-500" />
                              </div>
                            </div>

                            <MoreHorizontal className="h-4 w-4 text-slate-400" />

                          </div>

                          {/* REPORT 3 */}

                          <div className="flex items-center gap-3 px-4 py-3">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                              <FileText className="h-3.5 w-3.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[9px] font-bold text-slate-700">
                                Étude scientifique
                              </div>

                              <div className="mt-0.5 flex items-center gap-2 text-[8px] text-slate-400">
                                <span>Physique</span>
                                <span>•</span>
                                <span>Il y a 3 jours</span>
                              </div>
                            </div>

                            <div className="hidden w-[75px] sm:block">
                              <div className="mb-1 flex justify-between text-[7px]">
                                <span className="text-slate-400">
                                  Progression
                                </span>
                                <span className="font-bold text-emerald-600">
                                  91%
                                </span>
                              </div>

                              <div className="h-1 rounded-full bg-slate-100">
                                <div className="h-1 w-[91%] rounded-full bg-emerald-500" />
                              </div>
                            </div>

                            <MoreHorizontal className="h-4 w-4 text-slate-400" />

                          </div>

                        </div>
                      </div>

                      {/* RIGHT CARD */}

                      <div className="space-y-4">

                        {/* AI CARD */}

                        <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">

                          <div className="register-pulse absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-200/40 blur-2xl" />

                          <div className="relative">

                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <Sparkles className="h-3.5 w-3.5" />
                              </div>

                              <div>
                                <div className="text-[9px] font-black text-slate-800">
                                  Assistant MACEVO
                                </div>

                                <div className="text-[7px] text-slate-400">
                                  Assistance à la rédaction
                                </div>
                              </div>
                            </div>

                            <p className="mt-3 text-[9px] leading-4 text-slate-500">
                              Structurez votre travail, améliorez votre
                              rédaction et avancez plus rapidement.
                            </p>

                            <div className="mt-3 flex items-center gap-1.5 text-[8px] font-bold text-blue-600">
                              Découvrir l'assistant
                              <ArrowRight className="h-3 w-3" />
                            </div>

                          </div>
                        </div>

                        {/* ACTIVITY */}

                        <div className="rounded-xl border border-slate-200 bg-white p-4">

                          <div className="flex items-center justify-between">

                            <div>
                              <h4 className="text-[10px] font-black text-slate-800">
                                Activité récente
                              </h4>

                              <p className="mt-0.5 text-[8px] text-slate-400">
                                Cette semaine
                              </p>
                            </div>

                            <Clock3 className="h-3.5 w-3.5 text-slate-400" />

                          </div>

                          <div className="mt-4 space-y-3">

                            <div className="flex items-center gap-2.5">
                              <div className="h-6 w-6 rounded-full bg-blue-50" />
                              <div className="flex-1">
                                <div className="h-2 w-[80%] rounded bg-slate-100" />
                                <div className="mt-1.5 h-1.5 w-[50%] rounded bg-slate-50" />
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="h-6 w-6 rounded-full bg-violet-50" />
                              <div className="flex-1">
                                <div className="h-2 w-[65%] rounded bg-slate-100" />
                                <div className="mt-1.5 h-1.5 w-[40%] rounded bg-slate-50" />
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <div className="h-6 w-6 rounded-full bg-emerald-50" />
                              <div className="flex-1">
                                <div className="h-2 w-[72%] rounded bg-slate-100" />
                                <div className="mt-1.5 h-1.5 w-[46%] rounded bg-slate-50" />
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>

                    {/* EDITOR PREVIEW */}

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white">

                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                        <div className="flex items-center gap-2">

                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                            <FileEdit className="h-3.5 w-3.5" />
                          </div>

                          <div>
                            <div className="text-[9px] font-black text-slate-800">
                              Éditeur scientifique
                            </div>

                            <div className="text-[7px] text-slate-400">
                              Rédaction structurée
                            </div>
                          </div>

                        </div>

                        <div className="flex items-center gap-2">

                          <div className="rounded-md border border-slate-200 px-2 py-1 text-[7px] font-semibold text-slate-500">
                            Enregistré
                          </div>

                          <div className="rounded-md bg-slate-900 px-2 py-1 text-[7px] font-bold text-white">
                            Exporter PDF
                          </div>

                        </div>

                      </div>

                      <div className="flex min-h-[115px]">

                        <div className="hidden w-[110px] border-r border-slate-100 bg-slate-50 p-3 sm:block">

                          <div className="text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Document
                          </div>

                          <div className="mt-3 space-y-2">

                            <div className="h-2 w-[80%] rounded bg-blue-100" />

                            <div className="h-1.5 w-[65%] rounded bg-slate-200" />

                            <div className="h-1.5 w-[72%] rounded bg-slate-200" />

                            <div className="h-1.5 w-[58%] rounded bg-slate-200" />

                          </div>

                        </div>

                        <div className="flex-1 p-4">

                          <div className="mb-3 h-3 w-[45%] rounded bg-slate-800/80" />

                          <div className="space-y-2">

                            <div className="h-1.5 w-full rounded bg-slate-100" />
                            <div className="h-1.5 w-[92%] rounded bg-slate-100" />
                            <div className="h-1.5 w-[96%] rounded bg-slate-100" />
                            <div className="h-1.5 w-[78%] rounded bg-slate-100" />

                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">

                            <div className="h-7 rounded-md bg-blue-50" />
                            <div className="h-7 rounded-md bg-slate-50" />
                            <div className="h-7 rounded-md bg-slate-50" />

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                </main>

              </div>
            </div>

            {/* BOTTOM MESSAGE */}

            <div className="mt-5 flex items-center justify-between">

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white bg-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-700">
                    Conçu pour les étudiants
                  </p>

                  <p className="text-[9px] text-slate-400">
                    De la rédaction à l'exportation de vos travaux.
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 text-[9px] font-semibold text-slate-400 sm:flex">
                <span>MACEVO</span>
                <span>•</span>
                <span>2026</span>
              </div>

            </div>

          </div>
        </section>
      </div>
    </div>
  );
}


