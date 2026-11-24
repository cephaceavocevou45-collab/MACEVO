import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sigma,
  BookOpen,
  FileText,
  GraduationCap,
  Presentation,
  ChevronRight,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const LATEX_TEMPLATES = [
  {
    id: "ieee",
    title: "IEEE",
    description: "Articles scientifiques en ingénierie et informatique.",
    category: "Journal",
    icon: Sigma,
    color: "bg-blue-600 dark:bg-blue-500",
  },
  {
    id: "acm",
    title: "ACM",
    description: "Conférences et publications en informatique.",
    category: "Conférence",
    icon: BookOpen,
    color: "bg-emerald-600 dark:bg-emerald-500",
  },
  {
    id: "springer",
    title: "Springer",
    description: "Livres et revues Springer Nature.",
    category: "Journal",
    icon: FileText,
    color: "bg-purple-600 dark:bg-purple-500",
  },
  {
    id: "elsevier",
    title: "Elsevier",
    description: "Articles scientifiques Elsevier.",
    category: "Journal",
    icon: FileText,
    color: "bg-orange-600 dark:bg-orange-500",
  },
  {
    id: "nature",
    title: "Nature",
    description: "Modèle officiel des revues Nature.",
    category: "Journal",
    icon: BookOpen,
    color: "bg-red-600 dark:bg-red-500",
  },
  {
    id: "beamer",
    title: "Beamer",
    description: "Présentation scientifique professionnelle.",
    category: "Présentation",
    icon: Presentation,
    color: "bg-pink-600 dark:bg-pink-500",
  },
  {
    id: "memoire-universitaire",
    title: "Mémoire Universitaire",
    description: "Mémoire académique structuré en LaTeX.",
    category: "Université",
    icon: GraduationCap,
    color: "bg-indigo-600 dark:bg-indigo-500",
  },
  {
    id: "these-doctorale",
    title: "Thèse Doctorale",
    description: "Structure complète et avancée pour une thèse.",
    category: "Doctorat",
    icon: GraduationCap,
    color: "bg-cyan-600 dark:bg-cyan-500",
  },
];

const CATEGORIES = ["Tous", "Journal", "Conférence", "Université", "Doctorat", "Présentation"];

export default function ModelesLatex() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const filteredTemplates =
    selectedCategory === "Tous"
      ? LATEX_TEMPLATES
      : LATEX_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (templateId) => {
    navigate(`/rapports/latex/${templateId}`);
  };

  return (
    <div className="flex h-screen bg-gray-100 transition-colors dark:bg-[#0d1117]">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <button
            type="button"
            onClick={() => navigate("/rapports/nouveau")}
            className="mb-8 flex items-center gap-2 rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Bibliothèque LaTeX
            </h1>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400 md:text-lg">
              Choisissez un modèle LaTeX professionnel préconfiguré.
            </p>
          </div>

          {/* Filtres par catégorie */}
          <div className="mb-8 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
                    : "bg-white text-gray-600 hover:bg-gray-200 dark:bg-[#161b22] dark:text-gray-300 dark:hover:bg-slate-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grille des templates */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((item) => {
              const IconComponent = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectTemplate(item.id)}
                  className="group flex cursor-pointer flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl dark:border-slate-800/80 dark:bg-[#161b22] dark:hover:border-slate-700"
                >
                  <div>
                    <div className="mb-6 flex items-start justify-between">
                      <div
                        className={`${item.color} flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-200 group-hover:scale-105`}
                      >
                        <IconComponent size={34} />
                      </div>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-gray-300">
                        {item.category}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                      {item.title}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition group-hover:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-600">
                    <span>Utiliser ce modèle</span>
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}