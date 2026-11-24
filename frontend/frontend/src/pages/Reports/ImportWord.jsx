import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  FileText,
  FileCheck,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";

export default function ImportWord() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Octets";
    const k = 1024;
    const sizes = ["Octets", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    const validExtensions = [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const isDocx = selectedFile.name.endsWith(".docx") || selectedFile.name.endsWith(".doc");

    if (validExtensions.includes(selectedFile.type) || isDocx) {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Veuillez sélectionner un fichier Word valide (.doc ou .docx).");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Gestion du Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Endpoint API backend pour la conversion Word
      const response = await api.post("assistant/import-word/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.id) {
        navigate(`/rapports/${response.data.id}`);
      }
    } catch (err) {
      console.error("Erreur d'importation :", err);
      setError("Échec de l'importation du document. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const featuresList = [
    "Titres et structure hiérarchique",
    "Paragraphes et corps de texte",
    "Images et illustrations insérées",
    "Tableaux et données structurées",
    "Citations et références bibliographiques",
    "Mise en page et styles principaux",
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 transition-colors">
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

          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Importer un document Word
            </h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400">
              Importez un fichier .doc ou .docx afin de le convertir automatiquement.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-10 shadow-lg dark:bg-slate-800">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Zone Drag and Drop */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition ${
                isDragging
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                  : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-slate-700/30"
              }`}
            >
              <div className="flex flex-col items-center">
                <Upload size={56} className="mb-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Déposez votre fichier ici
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  ou cliquez pour sélectionner un document Word
                </p>
                <p className="mt-4 text-xs font-semibold text-gray-400">
                  Formats supportés : .doc et .docx
                </p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Aperçu du fichier sélectionné */}
            {file && (
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-green-300 bg-green-50 p-5 dark:border-green-800/40 dark:bg-green-950/20">
                <div className="flex items-center gap-4">
                  <FileCheck size={32} className="text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{file.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-green-100 hover:text-gray-700 dark:hover:bg-green-900/40"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={!file || loading}
              onClick={handleImport}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-300 disabled:opacity-60 dark:disabled:bg-slate-700"
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Conversion en cours...
                </>
              ) : (
                "Importer et convertir"
              )}
            </button>
          </div>

          {/* Section d'information */}
          <div className="mt-8 rounded-3xl bg-white p-8 shadow-lg dark:bg-slate-800">
            <div className="flex items-start gap-4">
              <FileText size={36} className="text-blue-600 shrink-0 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Éléments conservés lors de la conversion
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {featuresList.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}