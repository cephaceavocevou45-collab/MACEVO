import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import {
  Eye,
  EyeOff,
  BookOpen,
  GraduationCap,
  FileText,
  FileDown,
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Heart,
  PenLine,
  Monitor,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================================
  // CONNEXION CLASSIQUE
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("login/", {
        email,
        password,
      });

      login(response.data);
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setLoading(false);

      if (err.response) {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else {
        setError("Impossible de contacter le serveur.");
      }
    }
  };

  // =========================================================
  // CONNEXION GOOGLE
  // =========================================================
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const response = await api.post("google-login/", {
        token: credentialResponse.credential,
      });

      login(response.data);
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("Impossible de se connecter avec Google.");
    }
  };

  const handleGoogleError = () => {
    setError("Connexion Google annulée.");
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#f5f8ff] text-slate-900">
      {/* =========================================================
          ANIMATIONS
      ========================================================= */}
      <style>{`
        @keyframes floatOne {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(18px, -22px, 0) rotate(4deg);
          }
        }

        @keyframes floatTwo {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-18px, 20px, 0) rotate(-4deg);
          }
        }

        @keyframes floatThree {
          0%, 100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(12px, -15px, 0) rotate(-3deg);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: .35;
            transform: scale(1);
          }
          50% {
            opacity: .7;
            transform: scale(1.08);
          }
        }

        @keyframes documentFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(2deg);
          }
        }

        @keyframes screenOne {
          0%, 28% {
            opacity: 1;
            transform: scale(1);
          }
          33%, 94% {
            opacity: 0;
            transform: scale(.97);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes screenTwo {
          0%, 28% {
            opacity: 0;
            transform: scale(.97);
          }
          33%, 61% {
            opacity: 1;
            transform: scale(1);
          }
          66%, 100% {
            opacity: 0;
            transform: scale(.97);
          }
        }

        @keyframes screenThree {
          0%, 61% {
            opacity: 0;
            transform: scale(.97);
          }
          66%, 94% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(.97);
          }
        }

        @keyframes walking {
          0% {
            transform: translateX(-55px);
          }
          50% {
            transform: translateX(25px);
          }
          100% {
            transform: translateX(105px);
          }
        }

        @keyframes bodyWalk {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes leftLeg {
          0%, 100% {
            transform: rotate(18deg);
          }
          50% {
            transform: rotate(-18deg);
          }
        }

        @keyframes rightLeg {
          0%, 100% {
            transform: rotate(-18deg);
          }
          50% {
            transform: rotate(18deg);
          }
        }

        @keyframes leftArm {
          0%, 100% {
            transform: rotate(25deg);
          }
          50% {
            transform: rotate(-25deg);
          }
        }

        @keyframes rightArm {
          0%, 100% {
            transform: rotate(-25deg);
          }
          50% {
            transform: rotate(25deg);
          }
        }

        @keyframes blink {
          0%, 46%, 50%, 100% {
            transform: scaleY(1);
          }
          48% {
            transform: scaleY(.1);
          }
        }

        @keyframes typing {
          0%, 100% {
            opacity: .35;
          }
          50% {
            opacity: 1;
          }
        }

        .macevo-float-1 {
          animation: floatOne 7s ease-in-out infinite;
        }

        .macevo-float-2 {
          animation: floatTwo 9s ease-in-out infinite;
        }

        .macevo-float-3 {
          animation: floatThree 8s ease-in-out infinite;
        }

        .macevo-doc {
          animation: documentFloat 6s ease-in-out infinite;
        }

        .macevo-doc-delay {
          animation: documentFloat 7.5s ease-in-out infinite;
          animation-delay: -2s;
        }

        .macevo-doc-delay-2 {
          animation: documentFloat 8s ease-in-out infinite;
          animation-delay: -4s;
        }

        .macevo-screen-1 {
          animation: screenOne 12s ease-in-out infinite;
        }

        .macevo-screen-2 {
          animation: screenTwo 12s ease-in-out infinite;
        }

        .macevo-screen-3 {
          animation: screenThree 12s ease-in-out infinite;
        }

        .macevo-walking {
          animation: walking 11s ease-in-out infinite alternate;
        }

        .macevo-body {
          animation: bodyWalk .8s ease-in-out infinite;
        }

        .macevo-left-leg {
          transform-origin: top center;
          animation: leftLeg .8s ease-in-out infinite;
        }

        .macevo-right-leg {
          transform-origin: top center;
          animation: rightLeg .8s ease-in-out infinite;
        }

        .macevo-left-arm {
          transform-origin: top center;
          animation: leftArm .8s ease-in-out infinite;
        }

        .macevo-right-arm {
          transform-origin: top center;
          animation: rightArm .8s ease-in-out infinite;
        }

        .macevo-eye {
          transform-origin: center;
          animation: blink 5s infinite;
        }

        .macevo-typing {
          animation: typing 1.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* =========================================================
          STRUCTURE PRINCIPALE
      ========================================================= */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.55fr_0.9fr]">

        {/* =======================================================
            PARTIE GAUCHE — UNIVERS MACEVO
        ======================================================= */}
        <section className="relative min-h-[760px] overflow-hidden bg-gradient-to-br from-[#eef5ff] via-white to-[#dceaff]">

          {/* Lumières d'arrière-plan */}
          <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl macevo-float-1" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl macevo-float-2" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl macevo-float-3" />

          {/* Grille scientifique */}
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(37,99,235,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.08) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

          {/* =====================================================
              ÉQUATIONS FLOTTANTES
          ===================================================== */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">

            <div className="absolute left-[48%] top-[9%] rounded-2xl border border-blue-200/60 bg-white/40 px-4 py-3 font-serif text-lg italic text-blue-700/70 shadow-sm backdrop-blur-md macevo-float-1">
              E = mc²
            </div>

            <div className="absolute right-[10%] top-[20%] rounded-2xl border border-indigo-200/60 bg-white/40 px-4 py-3 font-serif text-xl text-indigo-700/60 shadow-sm backdrop-blur-md macevo-float-2">
              ∑ xᵢ = μ
            </div>

            <div className="absolute left-[35%] top-[33%] font-serif text-3xl italic text-blue-600/35 macevo-float-3">
              ∫ f(x)dx
            </div>

            <div className="absolute right-[20%] top-[42%] font-serif text-3xl text-indigo-600/35 macevo-float-1">
              π ≈ 3.14159
            </div>

            <div className="absolute left-[12%] bottom-[23%] font-mono text-sm text-blue-600/35 macevo-float-2">
  ∂u/∂t = α∇²u
</div>

            <div className="absolute right-[8%] bottom-[25%] font-mono text-sm text-indigo-600/35 macevo-float-3">
              LaTeX → PDF
            </div>
          </div>

          {/* =====================================================
              CONTENU GAUCHE
          ===================================================== */}
          <div className="relative z-10 mx-auto flex min-h-screen max-w-[1050px] flex-col px-7 py-8 sm:px-10 lg:px-14">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25">
                <GraduationCap size={27} strokeWidth={2.2} />
              </div>

              <div>
                <div className="text-2xl font-black tracking-tight text-[#1455d9]">
                  MACEVO
                </div>
                <div className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                  INTELLIGENCE • RECHERCHE • RÉUSSITE
                </div>
              </div>
            </div>

            {/* Hero */}
            <div className="mt-12 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur">
                <Sparkles size={14} />
                La rédaction scientifique simplifiée
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl">
                Créez.
                <br />
                Rédigez.
                <br />
                <span className="text-blue-600">Présentez.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Votre espace simple pour créer des rapports scientifiques
                professionnels, même sans connaître LaTeX.
              </p>

              {/* Mini fonctionnalités */}
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <FileText size={16} />
                  </div>
                  <span>Rapports<br />scientifiques</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <BookOpen size={16} />
                  </div>
                  <span>Modèles<br />précouçus</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <FileDown size={16} />
                  </div>
                  <span>Exportation<br />PDF / Word</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <Sparkles size={16} />
                  </div>
                  <span>IA<br />intégrée</span>
                </div>

              </div>
            </div>

            {/* =================================================
                SCÈNE PRINCIPALE
            ================================================= */}
            <div className="relative mt-auto flex min-h-[430px] flex-1 items-end justify-center pb-4 pt-12">

              {/* Documents flottants */}

              <div className="macevo-doc absolute left-[3%] top-[10%] hidden w-36 rotate-[-7deg] rounded-xl border border-blue-100 bg-white p-3 shadow-xl sm:block">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <GraduationCap size={15} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-700">
                    Mémoire de Licence
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-slate-200" />
                  <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                  <div className="h-1.5 w-3/5 rounded bg-blue-100" />
                </div>
              </div>

              <div className="macevo-doc-delay absolute left-[39%] top-[1%] hidden w-36 rotate-[5deg] rounded-xl border border-blue-100 bg-white p-3 shadow-xl md:block">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <FileText size={15} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">
                    Rapport de stage
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-slate-200" />
                  <div className="h-1.5 w-11/12 rounded bg-slate-200" />
                  <div className="h-1.5 w-2/3 rounded bg-blue-200" />
                </div>
              </div>

              <div className="macevo-doc-delay-2 absolute right-[10%] top-[17%] hidden w-36 rotate-[8deg] rounded-xl border border-blue-100 bg-white p-3 shadow-xl sm:block">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                    <PenLine size={15} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">
                    Article scientifique
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-slate-200" />
                  <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                  <div className="mt-2 h-7 rounded bg-blue-50">
                    <div className="ml-3 mt-3 h-1 w-2/3 rounded bg-blue-300" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[24%] left-[3%] hidden flex-col gap-2 sm:flex">
                <div className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white shadow-lg">
                  PDF
                </div>

                <div className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-lg">
                  DOCX
                </div>

                <div className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-black text-white shadow-lg">
                  LaTeX
                </div>
              </div>

              {/* =================================================
                  SOL / HALO DERRIÈRE L'ORDINATEUR
              ================================================= */}
              <div className="absolute bottom-[18%] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-400/15 blur-3xl" />

              {/* =================================================
                  ORDINATEUR
              ================================================= */}
              <div className="relative z-20 flex translate-y-3 flex-col items-center">

                {/* Écran */}
                <div className="relative h-[175px] w-[285px] rounded-t-[18px] border-[6px] border-slate-800 bg-slate-900 p-1.5 shadow-2xl sm:h-[210px] sm:w-[350px]">

                  {/* Webcam */}
                  <div className="absolute left-1/2 top-[-3px] z-30 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-600" />

                  {/* Écran 1 */}
                  <div className="macevo-screen-1 absolute inset-1.5 overflow-hidden rounded-lg bg-white p-2.5">

                    <div className="flex h-full">

                      {/* Sidebar */}
                      <div className="w-[28%] rounded-md bg-[#123fa8] p-2 text-white">
                        <div className="mb-4 flex items-center gap-1">
                          <GraduationCap size={10} />
                          <span className="text-[7px] font-bold">MACEVO</span>
                        </div>

                        <div className="space-y-2 text-[5px] text-blue-100">
                          <div className="rounded bg-white/15 px-1 py-1">
                            Tableau de bord
                          </div>
                          <div>Mes rapports</div>
                          <div>Modèles</div>
                          <div>Paramètres</div>
                          <div>Centre d'aide</div>
                        </div>
                      </div>

                      {/* Dashboard */}
                      <div className="flex-1 p-2">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <div className="text-[8px] font-black text-slate-800">
                              Mes rapports
                            </div>
                            <div className="text-[5px] text-slate-400">
                              Votre espace scientifique
                            </div>
                          </div>

                          <div className="rounded bg-blue-600 px-2 py-1 text-[5px] font-bold text-white">
                            + Nouveau
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">

                          <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                            <div className="mb-1 flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-600">
                              <GraduationCap size={10} />
                            </div>
                            <div className="text-[6px] font-bold">
                              Mémoire de licence
                            </div>
                            <div className="mt-1 text-[4px] text-slate-400">
                              Dernière modification
                            </div>
                          </div>

                          <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                            <div className="mb-1 flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-indigo-600">
                              <FileText size={10} />
                            </div>
                            <div className="text-[6px] font-bold">
                              Rapport de stage
                            </div>
                            <div className="mt-1 text-[4px] text-slate-400">
                              Il y a 2 heures
                            </div>
                          </div>

                          <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                            <div className="mb-1 flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-600">
                              <PenLine size={10} />
                            </div>
                            <div className="text-[6px] font-bold">
                              Article scientifique
                            </div>
                            <div className="mt-1 text-[4px] text-slate-400">
                              Brouillon
                            </div>
                          </div>

                          <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
                            <div className="mb-1 flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-amber-600">
                              <FileDown size={10} />
                            </div>
                            <div className="text-[6px] font-bold">
                              PFE
                            </div>
                            <div className="mt-1 text-[4px] text-slate-400">
                              Prêt à exporter
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Écran 2 — éditeur */}
                  <div className="macevo-screen-2 absolute inset-1.5 overflow-hidden rounded-lg bg-white p-2.5">

                    <div className="flex h-full flex-col">

                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <PenLine size={11} className="text-blue-600" />
                          <span className="text-[7px] font-bold">
                            Éditeur scientifique
                          </span>
                        </div>

                        <div className="rounded bg-blue-50 px-2 py-1 text-[5px] font-semibold text-blue-600">
                          Enregistré
                        </div>
                      </div>

                      <div className="flex flex-1 pt-2">

                        <div className="w-[24%] border-r border-slate-100 pr-2">
                          <div className="mb-2 text-[5px] font-bold text-slate-400">
                            STRUCTURE
                          </div>

                          <div className="space-y-2 text-[5px] text-slate-500">
                            <div className="font-semibold text-blue-600">
                              Introduction
                            </div>
                            <div>Chapitre I</div>
                            <div>Chapitre II</div>
                            <div>Résultats</div>
                            <div>Conclusion</div>
                          </div>
                        </div>

                        <div className="flex-1 px-3">
                          <div className="text-[9px] font-black">
                            Introduction
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <div className="h-1.5 w-full rounded bg-slate-200" />
                            <div className="h-1.5 w-11/12 rounded bg-slate-200" />
                            <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                          </div>

                          <div className="macevo-typing mt-5 rounded-md border border-blue-100 bg-blue-50 p-3 text-center">
                            <div className="font-serif text-xl italic text-blue-700">
                              E = mc²
                            </div>
                          </div>

                          <div className="mt-4 flex gap-1.5">
                            <div className="rounded bg-slate-100 px-2 py-1 text-[5px]">
                              Image
                            </div>
                            <div className="rounded bg-slate-100 px-2 py-1 text-[5px]">
                              Équation
                            </div>
                            <div className="rounded bg-slate-100 px-2 py-1 text-[5px]">
                              Tableau
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Écran 3 — export */}
                  <div className="macevo-screen-3 absolute inset-1.5 overflow-hidden rounded-lg bg-slate-950 p-3 text-white">

                    <div className="flex h-full flex-col">

                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <FileDown size={11} className="text-blue-400" />
                          <span className="text-[7px] font-bold">
                            Exportation
                          </span>
                        </div>

                        <span className="text-[5px] font-semibold text-emerald-400">
                          ✓ Terminé
                        </span>
                      </div>

                      <div className="flex flex-1 items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600">
                            <FileDown size={15} />
                          </div>

                          <div className="text-[9px] font-bold">
                            Votre document est prêt
                          </div>

                          <div className="mt-1 text-[5px] text-slate-400">
                            Choisissez votre format
                          </div>

                          <div className="mt-3 flex justify-center gap-1">
                            <span className="rounded bg-red-500 px-2 py-1 text-[5px] font-bold">
                              PDF
                            </span>

                            <span className="rounded bg-blue-500 px-2 py-1 text-[5px] font-bold">
                              DOCX
                            </span>

                            <span className="rounded bg-slate-700 px-2 py-1 text-[5px] font-bold">
                              LaTeX
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Base clavier */}
                <div className="h-3 w-[310px] rounded-b-xl bg-slate-800 shadow-xl sm:w-[380px]" />

                {/* Ombre */}
                <div className="mt-5 h-5 w-[380px] max-w-[90vw] rounded-full bg-blue-900/10 blur-xl" />
              </div>

              {/* =================================================
                  AVATAR QUI MARCHE
              ================================================= */}
              <div className="macevo-walking absolute bottom-[12%] left-[12%] z-30">

                <div className="macevo-body relative h-[270px] w-[145px]">

                  {/* Sac à dos */}
                  <div className="absolute left-[18px] top-[100px] h-[90px] w-[35px] rounded-[18px] bg-slate-900 shadow-lg">
                    <div className="absolute right-[-4px] top-[15px] h-[60px] w-[10px] rounded-full border-2 border-slate-700" />
                  </div>

                  {/* Tête */}
                  <div className="absolute left-[43px] top-[20px] z-20 h-[62px] w-[62px] rounded-full border-2 border-[#e7a47e] bg-[#f4b48c] shadow-md">

                    {/* Cheveux */}
                    <div className="absolute -left-1 -top-4 h-[35px] w-[68px] rounded-[50%_50%_35%_35%] bg-slate-900">
                      <div className="absolute left-2 top-1 h-5 w-5 rounded-full bg-slate-900" />
                      <div className="absolute left-5 top-[-5px] h-5 w-5 rounded-full bg-slate-900" />
                      <div className="absolute left-10 top-0 h-5 w-5 rounded-full bg-slate-900" />
                    </div>

                    {/* Oreille */}
                    <div className="absolute -right-1 top-[26px] h-4 w-3 rounded-full bg-[#e7a47e]" />

                    {/* Lunettes */}
                    <div className="absolute left-[8px] top-[25px] flex gap-1">
                      <div className="h-[13px] w-[18px] rounded-md border-2 border-slate-800 bg-white/20" />
                      <div className="h-[13px] w-[18px] rounded-md border-2 border-slate-800 bg-white/20" />
                      <div className="mt-[5px] h-[2px] w-2 bg-slate-800" />
                    </div>

                    {/* Yeux */}
                    <div className="macevo-eye absolute left-[14px] top-[29px] h-1.5 w-1.5 rounded-full bg-slate-900" />
                    <div className="macevo-eye absolute right-[14px] top-[29px] h-1.5 w-1.5 rounded-full bg-slate-900" />

                    {/* Sourire */}
                    <div className="absolute bottom-[11px] left-1/2 h-2 w-4 -translate-x-1/2 rounded-b-full border-b-2 border-slate-800" />
                  </div>

                  {/* Cou */}
                  <div className="absolute left-[65px] top-[75px] z-10 h-[20px] w-[20px] bg-[#e7a47e]" />

                  {/* Corps / sweat MACEVO */}
                  <div className="absolute left-[35px] top-[82px] z-10 h-[100px] w-[78px] rounded-[25px_25px_14px_14px] bg-blue-600 shadow-xl">

                    {/* Capuche */}
                    <div className="absolute -top-1 left-1/2 h-[40px] w-[52px] -translate-x-1/2 rounded-[50%_50%_20%_20%] border-4 border-blue-500 bg-blue-700" />

                    {/* Logo M */}
                    <div className="absolute left-1/2 top-[42px] -translate-x-1/2 text-xl font-black text-white">
                      M
                    </div>
                  </div>

                  {/* Bras gauche */}
                  <div className="macevo-left-arm absolute left-[24px] top-[93px] z-0 h-[82px] w-[20px] rounded-full bg-blue-600">
                    <div className="absolute -bottom-1 left-[-1px] h-[18px] w-[22px] rounded-full bg-[#f4b48c]" />
                  </div>

                  {/* Bras droit */}
                  <div className="macevo-right-arm absolute right-[20px] top-[93px] z-0 h-[82px] w-[20px] rounded-full bg-blue-600">
                    <div className="absolute -bottom-1 left-[-1px] h-[18px] w-[22px] rounded-full bg-[#f4b48c]" />
                  </div>

                  {/* Jambe gauche */}
                  <div className="macevo-left-leg absolute left-[43px] top-[172px] z-0 h-[70px] w-[24px] rounded-b-2xl bg-slate-800">
                    <div className="absolute -bottom-2 -left-2 h-[17px] w-[42px] rotate-[-7deg] rounded-full bg-white shadow-md">
                      <div className="absolute bottom-0 left-2 h-1 w-7 rounded-full bg-blue-500" />
                    </div>
                  </div>

                  {/* Jambe droite */}
                  <div className="macevo-right-leg absolute right-[40px] top-[172px] z-0 h-[70px] w-[24px] rounded-b-2xl bg-slate-800">
                    <div className="absolute -bottom-2 -left-2 h-[17px] w-[42px] rotate-[7deg] rounded-full bg-white shadow-md">
                      <div className="absolute bottom-0 left-2 h-1 w-7 rounded-full bg-blue-500" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Badge IA */}
              <div className="absolute bottom-[17%] right-[7%] hidden rounded-2xl border border-blue-200 bg-white/80 px-4 py-3 shadow-xl backdrop-blur-md md:block macevo-float-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-blue-600 p-2 text-white">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      IA MACEVO
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Assistant intelligent
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bas */}
            <div className="relative z-20 mt-2 flex items-center justify-between border-t border-blue-100/70 pt-4 text-[11px] text-slate-500">

              <div className="flex items-center gap-2">
                <Monitor size={14} className="text-blue-600" />
                <span>
                  Une plateforme pensée pour les étudiants
                </span>
              </div>

              <div className="hidden items-center gap-5 sm:flex">
                <span>Mathématiques</span>
                <span>Physique</span>
                <span>Informatique</span>
                <span>Sciences</span>
              </div>

            </div>
          </div>
        </section>

        {/* =======================================================
            PARTIE DROITE — CONNEXION
        ======================================================= */}
        <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-14">

          {/* Décor discret */}
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-60 w-60 rounded-full bg-indigo-50 blur-3xl" />

          <div className="relative z-10 w-full max-w-[470px]">

            {/* Logo mobile / petit écran */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
                <GraduationCap size={24} />
              </div>

              <div>
                <div className="text-xl font-black text-blue-600">
                  MACEVO
                </div>
                <div className="text-[9px] font-semibold tracking-widest text-slate-400">
                  INTELLIGENCE • RECHERCHE • RÉUSSITE
                </div>
              </div>
            </div>

            {/* Petit indicateur */}
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-blue-600">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Espace étudiant sécurisé
            </div>

            {/* Titre */}
            <div className="mb-8">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Bienvenue ! <span className="inline-block">👋</span>
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
                Connectez-vous à votre espace pour créer, modifier et
                télécharger vos rapports scientifiques.
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* =================================================
                FORMULAIRE
            ================================================= */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Adresse e-mail
                </label>

                <div className="group relative">

                  <Mail
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
                  />

                  <input
                    id="email"
                    type="email"
                    placeholder="exemple@domaine.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    autoComplete="email"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-12 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-bold text-slate-700"
                  >
                    Mot de passe
                  </label>
                </div>

                <div className="group relative">

                  <Lock
                    size={19}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                    autoComplete="current-password"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-12 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between gap-4 pt-1">

                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Se souvenir de moi
                </label>

                <Link
                  to="/mot-de-passe-oublie"
                  className="text-xs font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>

              </div>

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

            </form>

            {/* =================================================
                SÉPARATEUR
            ================================================= */}
            {googleClientId && (
              <>
                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium text-slate-400">
                    ou continuer avec
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="w-full overflow-hidden rounded-2xl">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    shape="pill"
                    text="continue_with"
                    width="100%"
                  />
                </div>
              </>
            )}

            {/* Inscription */}
            <p className="mt-7 text-center text-sm text-slate-500">
              Pas encore de compte ?{" "}
              <Link
                to="/inscription"
                className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                Créer un compte
              </Link>
            </p>

            {/* =================================================
                GARANTIES
            ================================================= */}
            <div className="mt-10 grid grid-cols-3 border-t border-slate-100 pt-6">

              <div className="flex flex-col items-center gap-2 text-center">
                <ShieldCheck size={17} className="text-blue-600" />
                <span className="text-[10px] font-medium text-slate-400">
                  Sécurisé
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 border-x border-slate-100 text-center">
                <Zap size={17} className="text-blue-600" />
                <span className="text-[10px] font-medium text-slate-400">
                  Rapide
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 text-center">
                <Heart size={17} className="text-blue-600" />
                <span className="text-[10px] font-medium text-slate-400">
                  Pour votre réussite
                </span>
              </div>

            </div>

          </div>
        </section>
      </div>
    </div>
  );
}