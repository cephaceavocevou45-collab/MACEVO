import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, CheckCircle2, FileText, Sparkles } from "lucide-react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { reportTemplates } from "../../config/reportTemplates";

export default function CreateReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");

  // Mémorisation du modèle sélectionné
  const selectedTemplate = useMemo(
    () => reportTemplates.find((template) => template.id === templateId) || null,
    [templateId]
  );

  const [form, setForm] = useState({
    title: "",
    institution: "",
    department: "",
    supervisor: "",
    academicYear: "2026-2027",
    abstract: "",
    content: "",
  });

  const [selectedSections, setSelectedSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Synchronisation des sections du modèle sélectionné
  useEffect(() => {
    if (selectedTemplate?.sections) {
      setSelectedSections(selectedTemplate.sections);
    } else {
      setSelectedSections([]);
    }
  }, [selectedTemplate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSection = (section) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((item) => item !== section)
        : [...prev, section]
    );
  };

  // Génération automatique de la structure Markdown à partir des sections actives
  const generateStructure = () => {
    if (!selectedTemplate) return "";
    return selectedSections
      .map((section, index) => {
        const sampleText = "Rédigez ici le contenu de cette section...";
        return `## ${index + 1}. ${section}\n\n${sampleText}\n\n`;
      })
      .join("---\n\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTemplate) {
      alert("Aucun modèle valide n'a été sélectionné.");
      return;
    }

    if (!form.title.trim()) {
      alert("Veuillez renseigner le titre du rapport.");
      return;
    }

    if (selectedSections.length === 0) {
      alert("Veuillez sélectionner au moins une section.");
      return;
    }

    setLoading(true);

    try {
      // Si le contenu personnalisé est vide, on génère la structure à partir des sections
      const generatedContent = form.content.trim() || generateStructure();

      const payload = {
        title: form.title.trim(),
        summary: form.abstract.trim(),
        institution: form.institution.trim(),
        department: form.department.trim(),
        supervisor: form.supervisor.trim(),
        academic_year: form.academicYear.trim(),
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        template_level: selectedTemplate.level,
        template_type: selectedTemplate.type,
        content: generatedContent,
      };

      // Envoi vers l'API Django configurée sur /api/reports/
      const response = await api.post("reports/", payload);
      
      // Redirection vers l'éditeur ou la vue de détail du rapport créé
      navigate(`/rapports/${response.data.id}`);
    } catch (error) {
      console.error("Erreur lors de la création du rapport :", error);
      alert(
        error.response?.data?.detail ||
          Object.values(error.response?.data || {}).flat().join("\n") ||
          "Impossible de créer le rapport. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!templateId || !selectedTemplate) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117] transition-colors duration-200">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-8">
            <button
              onClick={() => navigate("/rapports/templates")}
              className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl mb-8 transition"
            >
              <ArrowLeft size={18} />
              Retour aux modèles
            </button>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-lg p-10 text-center">
              <FileText size={60} className="mx-auto text-slate-400 dark:text-slate-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-6">
                Aucun modèle sélectionné
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-3">
                Veuillez sélectionner un modèle avant de créer votre rapport.
              </p>
              <button
                onClick={() => navigate("/rapports/templates")}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Choisir un modèle
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117] transition-colors duration-200">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <button
            onClick={() => navigate("/rapports/templates")}
            className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl mb-8 transition"
          >
            <ArrowLeft size={18} />
            Retour aux modèles
          </button>

          {/* En-tête du modèle sélectionné */}
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shrink-0">
                  <FileText size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Modèle sélectionné
                    </span>
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedTemplate.name}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Niveau
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTemplate.level}
                  </span>
                </div>
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Type
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTemplate.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire principal */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-lg p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Informations du rapport
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Renseignez les informations principales de votre document.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Titre du document *
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="Ex. Impact de l'intelligence artificielle..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 mt-2 outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Université / Institution
                    </label>
                    <input
                      name="institution"
                      value={form.institution}
                      onChange={handleChange}
                      placeholder="Nom de votre université ou institution"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 mt-2 outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Faculté / Département
                    </label>
                    <input
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="Faculté, département ou filière"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 mt-2 outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Directeur / Encadreur
                    </label>
                    <input
                      name="supervisor"
                      value={form.supervisor}
                      onChange={handleChange}
                      placeholder="Nom du directeur ou encadreur"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 mt-2 outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Année académique
                    </label>
                    <input
                      name="academicYear"
                      value={form.academicYear}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 mt-2 outline-none transition placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Résumé
                    </label>
                    <textarea
                      rows={4}
                      name="abstract"
                      value={form.abstract}
                      onChange={handleChange}
                      placeholder="Présentez brièvement votre travail..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 mt-2 outline-none transition resize-y placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Contenu personnalisé (Optionnel)
                    </label>
                    <textarea
                      rows={6}
                      name="content"
                      value={form.content}
                      onChange={handleChange}
                      placeholder="Laissez vide pour utiliser automatiquement la structure du modèle."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 mt-2 outline-none transition resize-y placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Si vous laissez ce champ vide, MACEVO utilisera automatiquement la structure des sections sélectionnées à droite.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Barre latérale : Gestion des sections du modèle */}
            <div>
              <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-lg p-6 sticky top-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Structure du modèle
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Personnalisez votre document
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {selectedTemplate.sections.map((section, index) => {
                    const active = selectedSections.includes(section);

                    return (
                      <button
                        type="button"
                        key={`${section}-${index}`}
                        onClick={() => toggleSection(section)}
                        className={`w-full flex items-center gap-3 text-left p-3 rounded-xl border transition-all duration-200 ${
                          active
                            ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            active
                              ? "bg-blue-600 dark:bg-blue-500 text-white"
                              : "bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {active ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>

                        <span
                          className={`text-sm font-medium ${
                            active
                              ? "text-slate-800 dark:text-slate-200"
                              : "text-slate-400 dark:text-slate-500 line-through"
                          }`}
                        >
                          {section}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Sections sélectionnées
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                      {selectedSections.length}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-4 rounded-xl font-semibold transition shadow-md cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Créer le rapport
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}