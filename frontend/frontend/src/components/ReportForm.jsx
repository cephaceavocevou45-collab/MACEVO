import { useState, useEffect } from "react";
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Trash2, 
  Upload, 
  File as FileIcon, 
  ExternalLink,
  Info 
} from "lucide-react";

export default function ReportForm({
  initialData = {},
  onSubmit,
  buttonText = "Enregistrer",
}) {
  const [activeTab, setActiveTab] = useState("info");

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    scientific_field: "",
    status: "draft",
    references: [],
    files: [],
  });

  // États locaux pour l'ajout d'une référence
  const [newRef, setNewRef] = useState({ title: "", authors: "", year: "", link: "" });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        summary: initialData.summary || "",
        scientific_field: initialData.scientific_field || "",
        status: initialData.status || "draft",
        references: initialData.references || [],
        files: initialData.files || [],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- GESTION DES RÉFÉRENCES ---
  const handleAddReference = (e) => {
    e.preventDefault();
    if (!newRef.title.trim()) return;

    const updatedRefs = [...formData.references, { ...newRef, id: Date.now() }];
    setFormData({ ...formData, references: updatedRefs });
    setNewRef({ title: "", authors: "", year: "", link: "" });
  };

  const handleDeleteReference = (id) => {
    const updatedRefs = formData.references.filter((ref) => ref.id !== id);
    setFormData({ ...formData, references: updatedRefs });
  };

  // --- GESTION DES FICHIERS ---
  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const newFileEntries = uploadedFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      type: file.type || "Document",
      uploadedAt: new Date().toLocaleDateString("fr-FR"),
    }));

    setFormData({
      ...formData,
      files: [...formData.files, ...newFileEntries],
    });
  };

  const handleDeleteFile = (id) => {
    const updatedFiles = formData.files.filter((file) => file.id !== id);
    setFormData({ ...formData, files: updatedFiles });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-900">
        Rapport scientifique
      </h2>

      {/* Barre de navigation des onglets */}
      <div className="flex border-b border-gray-200 mb-8 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "info"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Info className="w-4 h-4" /> Informations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("references")}
          className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "references"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Références ({formData.references.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("files")}
          className={`pb-3 px-1 flex items-center gap-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "files"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" /> Fichiers ({formData.files.length})
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ONGLET 1 : INFORMATIONS GENERALES */}
        {activeTab === "info" && (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Titre du rapport
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Titre du rapport"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Domaine scientifique
              </label>
              <input
                type="text"
                name="scientific_field"
                value={formData.scientific_field}
                onChange={handleChange}
                required
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex : Informatique, Médecine..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Résumé
              </label>
              <textarea
                rows="6"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                required
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Résumé du rapport..."
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="draft">Brouillon</option>
                <option value="progress">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
          </div>
        )}

        {/* ONGLET 2 : RÉFÉRENCES BIBLIOGRAPHIQUES */}
        {activeTab === "references" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">
                Ajouter une référence bibliographique
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Titre de l'ouvrage ou de l'article *"
                  value={newRef.title}
                  onChange={(e) => setNewRef({ ...newRef, title: e.target.value })}
                  className="p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Auteur(s) (ex: Dupont, A.)"
                  value={newRef.authors}
                  onChange={(e) => setNewRef({ ...newRef, authors: e.target.value })}
                  className="p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Année (ex: 2026)"
                  value={newRef.year}
                  onChange={(e) => setNewRef({ ...newRef, year: e.target.value })}
                  className="p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  placeholder="Lien URL / DOI (Optionnel)"
                  value={newRef.link}
                  onChange={(e) => setNewRef({ ...newRef, link: e.target.value })}
                  className="p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddReference}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Ajouter la référence
              </button>
            </div>

            {formData.references.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                Aucune référence bibliographique enregistrée.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.references.map((ref) => (
                  <div
                    key={ref.id}
                    className="flex items-start justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">{ref.title}</p>
                      <p className="text-xs text-gray-500">
                        {ref.authors && <span>{ref.authors} </span>}
                        {ref.year && <span>({ref.year})</span>}
                      </p>
                      {ref.link && (
                        <a
                          href={ref.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Voir la source
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteReference(ref.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3 : FICHIERS JOINTS */}
        {activeTab === "files" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Glissez vos fichiers ici ou
              </p>
              <label className="mt-3 inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-200 transition">
                Parcourir les fichiers
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">
                PDF, DOCX, PNG, JPG (Max. 25MB)
              </p>
            </div>

            {formData.files.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                Aucun fichier associé à ce rapport.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
                {formData.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3.5 bg-white hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {file.size} • Ajouté le {file.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOUTON SOUMISSION */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition mt-8"
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
}