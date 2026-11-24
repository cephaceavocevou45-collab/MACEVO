import { useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import wordToLatexService from "../services/wordToLatexService";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileArchive,
  FileCode2,
  FileText,
  FileUp,
  Loader2,
  RefreshCw,
  Settings2,
  Share2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const DEFAULT_OPTIONS = {
  documentClass: "report",
  fontSize: "11pt",
  margins: "2.5cm",
  language: "french",
  toc: true,
  sectionNumbering: true,
  bibPackage: "biblatex",
  bibStyle: "apa",
  imageHandling: "copy",
  optimizeImages: true,
  footnotes: true,
  comments: false,
  metadata: false,
  detectComplexTables: true,
  autoErrorCorrection: true,
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 octet";
  }

  const units = ["octets", "Ko", "Mo", "Go"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / 1024 ** index;

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${
    units[index]
  }`;
};

const getFilenameWithoutExtension = (filename = "") => {
  const clean = filename.trim();

  if (!clean) {
    return "document";
  }

  const lastDot = clean.lastIndexOf(".");

  if (lastDot <= 0) {
    return clean;
  }

  return clean.slice(0, lastDot);
};

const getServerFilename = (conversion, fileType) => {
  if (!conversion) {
    return null;
  }

  const fieldMap = {
    latex: "latex_file",
    zip: "zip_file",
    pdf: "pdf_file",
  };

  const field = fieldMap[fileType];

  if (!field) {
    return null;
  }

  const value = conversion[field];

  if (!value) {
    return null;
  }

  if (typeof value === "object" && value.name) {
    return value.name;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.split("?")[0];
  const filename = normalized.split("/").pop();

  return filename || null;
};

const normalizeConversionResponse = (payload) => {
  if (!payload) {
    return null;
  }

  if (payload.conversion) {
    return payload.conversion;
  }

  return payload;
};

const downloadBlob = (blob, filename) => {
  if (!(blob instanceof Blob)) {
    throw new Error("Le fichier reçu est invalide.");
  }

  if (blob.size <= 0) {
    throw new Error("Le fichier reçu est vide.");
  }

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
};

const getServiceErrorMessage = (error) => {
  if (!error) {
    return "Une erreur inattendue est survenue.";
  }

  if (typeof wordToLatexService.getErrorMessage === "function") {
    const serviceMessage = wordToLatexService.getErrorMessage(error);

    if (serviceMessage) {
      return serviceMessage;
    }
  }

  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (typeof responseData?.detail === "string") {
    return responseData.detail;
  }

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (responseData && typeof responseData === "object") {
    const messages = [];

    Object.values(responseData).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string") {
            messages.push(item);
          }
        });
      } else if (typeof value === "string") {
        messages.push(value);
      }
    });

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Une erreur est survenue pendant le traitement du document.";
};

const Toggle = ({
  checked,
  onChange,
  disabled = false,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 rounded-full transition ${
      checked ? "bg-indigo-600" : "bg-slate-300"
    } ${
      disabled
        ? "cursor-not-allowed opacity-50"
        : "cursor-pointer"
    }`}
    aria-pressed={checked}
    aria-label="Activer ou désactiver cette option"
  >
    <span
      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
        checked ? "left-6" : "left-1"
      }`}
    />
  </button>
);

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { number: 1, label: "Importer" },
    { number: 2, label: "Configurer" },
    { number: 3, label: "Résultat" },
  ];

  return (
    <div className="mb-8 flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition ${
                currentStep > step.number
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : currentStep === step.number
                  ? "border-indigo-600 bg-white text-indigo-600"
                  : "border-slate-300 bg-white text-slate-400"
              }`}
            >
              {currentStep > step.number ? (
                <Check size={18} />
              ) : (
                step.number
              )}
            </div>

            <span
              className={`mt-2 text-xs font-medium ${
                currentStep >= step.number
                  ? "text-slate-700"
                  : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`mx-4 mb-6 h-0.5 w-16 transition ${
                currentStep > step.number
                  ? "bg-indigo-600"
                  : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </span>

    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={17}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  </label>
);

const SettingRow = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
    <div>
      <p className="text-sm font-medium text-slate-800">
        {title}
      </p>

      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </div>

    <Toggle
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  </div>
);

const WordToLatex = () => {
  const fileInputRef = useRef(null);

  const sharePreparedFileRef = useRef(null);
  const sharePreparationRequestRef = useRef(0);

  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [latexCode, setLatexCode] = useState("");

  const [options, setOptions] = useState({
    ...DEFAULT_OPTIONS,
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [processingStage, setProcessingStage] = useState("idle");

  const [downloading, setDownloading] = useState(null);

  const [sharing, setSharing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareFileType, setShareFileType] = useState("pdf");

  const [sharePreparing, setSharePreparing] = useState(false);
  const [sharePreparationError, setSharePreparationError] = useState("");
  const [shareReady, setShareReady] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateOption = (key, value) => {
    setOptions((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const resetSharePreparation = () => {
    sharePreparedFileRef.current = null;
    setSharePreparing(false);
    setSharePreparationError("");
    setShareReady(false);
  };

  const resetConversionState = () => {
    setConversion(null);
    setLatexCode("");
    setUploadProgress(0);
    setConverting(false);
    setProcessingStage("idle");
    setDownloading(null);
    setError("");
    setSuccessMessage("");
    resetSharePreparation();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccessMessage("");
    resetSharePreparation();

    if (!file.name.toLowerCase().endsWith(".docx")) {
      setSelectedFile(null);
      setError(
        "Veuillez sélectionner un fichier Word au format .docx."
      );
      return;
    }

    if (file.size <= 0) {
      setSelectedFile(null);
      setError("Le fichier sélectionné est vide.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError(
        `Le fichier dépasse la taille maximale autorisée de ${formatFileSize(
          MAX_FILE_SIZE
        )}.`
      );
      return;
    }

    setSelectedFile(file);
    setConversion(null);
    setLatexCode("");
    setStep(1);
  };

  const removeFile = () => {
    setSelectedFile(null);
    resetConversionState();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError("Veuillez sélectionner un fichier Word.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setConverting(true);
    setProcessingStage("uploading");
    setUploadProgress(0);
    resetSharePreparation();

    try {
      const response = await wordToLatexService.uploadDocument(
        selectedFile,
        options,
        (progressEvent) => {
          if (!progressEvent?.total) {
            return;
          }

          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );

          setUploadProgress(
            Math.max(0, Math.min(100, progress))
          );
        }
      );

      setProcessingStage("analyzing");

      const normalizedConversion =
        normalizeConversionResponse(response);

      if (!normalizedConversion) {
        throw new Error(
          "Le serveur n'a retourné aucune conversion."
        );
      }

      setConversion(normalizedConversion);

      setLatexCode(
        response?.latex_content ||
          response?.latex_code ||
          normalizedConversion?.latex_code ||
          ""
      );

      setProcessingStage("completed");
      setUploadProgress(100);
      setStep(3);

      setSuccessMessage(
        "Le document Word a été converti avec succès en LaTeX."
      );
    } catch (conversionError) {
      setProcessingStage("error");
      setError(getServiceErrorMessage(conversionError));
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadFile = async (fileType) => {
    if (!conversion?.id) {
      setError("La conversion n'est pas disponible.");
      return;
    }

    setDownloading(fileType);
    setError("");

    try {
      const response =
        await wordToLatexService.downloadFile(
          conversion.id,
          fileType
        );

      const blob = response?.data;

      if (!(blob instanceof Blob)) {
        throw new Error("Le fichier reçu est invalide.");
      }

      if (blob.size <= 0) {
        throw new Error("Le fichier reçu est vide.");
      }

      const serverFilename = getServerFilename(
        conversion,
        fileType
      );

      const baseName = getFilenameWithoutExtension(
        conversion.original_filename ||
          selectedFile?.name ||
          "document"
      );

      const extensionMap = {
        latex: "tex",
        zip: "zip",
        pdf: "pdf",
      };

      const filename =
        serverFilename ||
        `${baseName}.${extensionMap[fileType] || fileType}`;

      downloadBlob(blob, filename);
    } catch (downloadError) {
      setError(getServiceErrorMessage(downloadError));
    } finally {
      setDownloading(null);
    }
  };

  const handleExportZip = async () => {
    if (!conversion?.id) {
      setError("La conversion n'est pas disponible.");
      return;
    }

    setDownloading("zip");
    setError("");

    try {
      const response =
        await wordToLatexService.exportZip(
          conversion.id
        );

      const updatedConversion =
        normalizeConversionResponse(response);

      if (updatedConversion) {
        setConversion((previous) => ({
          ...(previous || {}),
          ...updatedConversion,
        }));
      }

      await handleDownloadFile("zip");
    } catch (exportError) {
      setError(getServiceErrorMessage(exportError));
    } finally {
      setDownloading(null);
    }
  };

  const handleExportPdf = async () => {
    if (!conversion?.id) {
      setError("La conversion n'est pas disponible.");
      return;
    }

    setDownloading("pdf");
    setError("");

    try {
      const response =
        await wordToLatexService.exportPdf(
          conversion.id
        );

      const updatedConversion =
        normalizeConversionResponse(response);

      if (updatedConversion) {
        setConversion((previous) => ({
          ...(previous || {}),
          ...updatedConversion,
        }));
      }

      await handleDownloadFile("pdf");
    } catch (exportError) {
      setError(getServiceErrorMessage(exportError));
    } finally {
      setDownloading(null);
    }
  };

  const handleBack = () => {
    if (converting) {
      return;
    }

    setError("");
    setSuccessMessage("");

    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  };

  const handleNewConversion = () => {
    setStep(1);
    setSelectedFile(null);
    resetConversionState();

    setOptions({
      ...DEFAULT_OPTIONS,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getShareFileConfig = (
    fileType,
    currentConversion = conversion
  ) => {
    const baseName = getFilenameWithoutExtension(
      currentConversion?.original_filename ||
        selectedFile?.name ||
        "document"
    );

    const configs = {
      pdf: {
        type: "pdf",
        label: "Document PDF",
        extension: ".pdf",
        mimeType: "application/pdf",
        description: "Version PDF finale du document.",
        filename: `${baseName}.pdf`,
        available: Boolean(currentConversion?.pdf_file),
        icon: FileText,
      },

      zip: {
        type: "zip",
        label: "Projet LaTeX ZIP",
        extension: ".zip",
        mimeType: "application/zip",
        description:
          "Projet LaTeX complet avec les fichiers associés.",
        filename: `${baseName}.zip`,
        available: Boolean(currentConversion?.zip_file),
        icon: FileArchive,
      },

      latex: {
        type: "latex",
        label: "Source LaTeX",
        extension: ".tex",
        mimeType: "text/plain",
        description: "Code source LaTeX du document.",
        filename: `${baseName}.tex`,
        available: Boolean(
          currentConversion?.latex_file ||
            currentConversion?.latex_code ||
            latexCode
        ),
        icon: FileCode2,
      },
    };

    return configs[fileType] || configs.pdf;
  };

  const prepareShareFile = async (fileType) => {
    if (!conversion?.id) {
      throw new Error(
        "La conversion n'est pas disponible."
      );
    }

    const requestId =
      ++sharePreparationRequestRef.current;

    setSharePreparing(true);
    setSharePreparationError("");
    setShareReady(false);
    sharePreparedFileRef.current = null;

    try {
      let latestConversion = conversion;

      if (fileType === "zip") {
        const response =
          await wordToLatexService.exportZip(
            conversion.id
          );

        const exportedConversion =
          normalizeConversionResponse(response);

        if (exportedConversion) {
          latestConversion = {
            ...latestConversion,
            ...exportedConversion,
          };

          setConversion((previous) => ({
            ...(previous || {}),
            ...exportedConversion,
          }));
        }
      }

      if (fileType === "pdf") {
        const response =
          await wordToLatexService.exportPdf(
            conversion.id
          );

        const exportedConversion =
          normalizeConversionResponse(response);

        if (exportedConversion) {
          latestConversion = {
            ...latestConversion,
            ...exportedConversion,
          };

          setConversion((previous) => ({
            ...(previous || {}),
            ...exportedConversion,
          }));
        }
      }

      const response =
        await wordToLatexService.downloadFile(
          conversion.id,
          fileType
        );

      const blob = response?.data;

      if (!(blob instanceof Blob)) {
        throw new Error(
          "Le fichier préparé pour le partage est invalide."
        );
      }

      if (blob.size <= 0) {
        throw new Error(
          "Le fichier préparé pour le partage est vide."
        );
      }

      const config = getShareFileConfig(
        fileType,
        latestConversion
      );

      const filename =
        getServerFilename(
          latestConversion,
          fileType
        ) || config.filename;

      const file = new File([blob], filename, {
        type: config.mimeType,
        lastModified: Date.now(),
      });

      if (
        requestId !==
        sharePreparationRequestRef.current
      ) {
        return null;
      }

      if (
        typeof navigator === "undefined" ||
        typeof navigator.canShare !== "function"
      ) {
        throw new Error(
          "Le partage natif de fichiers n'est pas disponible dans ce navigateur."
        );
      }

      let canShare = false;

      try {
        canShare = navigator.canShare({
          files: [file],
        });
      } catch {
        canShare = false;
      }

      if (!canShare) {
        throw new Error(
          `Le partage natif du fichier ${config.extension} n'est pas disponible dans ce navigateur ou sur ce système.`
        );
      }

      sharePreparedFileRef.current = {
        file,
        fileType,
        filename,
        mimeType: config.mimeType,
        label: config.label,
      };

      setShareReady(true);

      return sharePreparedFileRef.current;
    } catch (preparationError) {
      if (
        requestId ===
        sharePreparationRequestRef.current
      ) {
        sharePreparedFileRef.current = null;
        setShareReady(false);
        setSharePreparationError(
          getServiceErrorMessage(preparationError)
        );
      }

      throw preparationError;
    } finally {
      if (
        requestId ===
        sharePreparationRequestRef.current
      ) {
        setSharePreparing(false);
      }
    }
  };

  const handleShare = () => {
    setError("");
    setSuccessMessage("");
    setSharePreparationError("");

    if (!conversion?.id) {
      setError("La conversion n'est pas disponible.");
      return;
    }

    const preferredType = conversion?.pdf_file
      ? "pdf"
      : conversion?.zip_file
      ? "zip"
      : "latex";

    setShareFileType(preferredType);
    setShareModalOpen(true);

    prepareShareFile(preferredType).catch(() => {
      // L'erreur est affichée dans le modal.
    });
  };

  const handleShareFileTypeChange = (fileType) => {
    setShareFileType(fileType);
    setSharePreparationError("");
    setShareReady(false);
    sharePreparedFileRef.current = null;

    prepareShareFile(fileType).catch(() => {
      // L'erreur est affichée dans le modal.
    });
  };

  const closeShareModal = () => {
    if (sharing) {
      return;
    }

    sharePreparationRequestRef.current += 1;
    sharePreparedFileRef.current = null;

    setShareModalOpen(false);
    setSharePreparing(false);
    setSharePreparationError("");
    setShareReady(false);
  };

  const handleConfirmShare = async () => {
    if (sharing) {
      return;
    }

    const prepared = sharePreparedFileRef.current;

    if (!prepared?.file) {
      setSharePreparationError(
        "Le fichier n'est pas encore prêt. Veuillez patienter quelques secondes."
      );
      return;
    }

    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      setSharePreparationError(
        "Le partage natif n'est pas disponible dans ce navigateur."
      );
      return;
    }

    let canShareFiles = false;

    try {
      canShareFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({
          files: [prepared.file],
        });
    } catch {
      canShareFiles = false;
    }

    if (!canShareFiles) {
      setSharePreparationError(
        "Le partage de fichiers n'est pas disponible sur ce navigateur ou ce système."
      );
      return;
    }

    setSharing(true);
    setError("");

    try {
      await navigator.share({
        title: "Conversion Word → LaTeX",
        text: `Document partagé depuis MACEVO : ${prepared.filename}`,
        files: [prepared.file],
      });

      setSuccessMessage(
        "Le fichier a été transmis au système de partage."
      );

      setShareModalOpen(false);
      sharePreparedFileRef.current = null;
      setShareReady(false);
    } catch (shareError) {
      if (shareError?.name === "AbortError") {
        return;
      }

      setSharePreparationError(
        getServiceErrorMessage(shareError)
      );
    } finally {
      setSharing(false);
    }
  };

  const stats = conversion
    ? [
        {
          label: "Paragraphes",
          value: conversion.paragraphs_count ?? 0,
        },
        {
          label: "Mots",
          value: conversion.words_count ?? 0,
        },
        {
          label: "Tableaux",
          value: conversion.tables_count ?? 0,
        },
        {
          label: "Images",
          value: conversion.images_count ?? 0,
        },
        {
          label: "Équations",
          value: conversion.equations_count ?? 0,
        },
        {
          label: "Schémas",
          value: conversion.diagrams_count ?? 0,
        },
        {
          label: "Figures",
          value: conversion.figures_count ?? 0,
        },
        {
          label: "Références",
          value: conversion.references_count ?? 0,
        },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-w-0 flex-1">
      <Navbar />

      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600">
                  <FileCode2 size={18} />
                  MACEVO
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Word → LaTeX
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Convertissez vos documents scientifiques Word en
                  documents LaTeX structurés, avec conservation des
                  équations, tableaux, figures et éléments scientifiques.
                </p>
              </div>

              {conversion && (
                <button
                  type="button"
                  onClick={handleNewConversion}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                >
                  <RefreshCw size={17} />
                  Nouvelle conversion
                </button>
              )}
            </div>
          </div>

          <StepIndicator currentStep={step} />

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">{error}</div>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-400 transition hover:text-red-700"
                aria-label="Fermer le message d'erreur"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div>{successMessage}</div>
            </div>
          )}

          {step === 1 && (
            <section className="mx-auto max-w-4xl">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <UploadCloud
                      size={20}
                      className="text-indigo-600"
                    />
                    Importer un document Word
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Sélectionnez votre document scientifique au format
                    .docx.
                  </p>
                </div>

                <div className="p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="group flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 text-center transition hover:border-indigo-300 hover:bg-indigo-50/30"
                    >
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition group-hover:scale-105">
                        <FileUp size={30} />
                      </div>

                      <h3 className="text-base font-semibold text-slate-800">
                        Cliquez pour sélectionner votre fichier
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Format accepté : .docx
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Taille maximale : 50 Mo
                      </p>
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                          <FileText size={26} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-800">
                            {selectedFile.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removeFile}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-500"
                          aria-label="Supprimer le fichier"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                          Continuer
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="mx-auto max-w-5xl">
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Settings2
                        size={20}
                        className="text-indigo-600"
                      />
                      Configuration de la conversion
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Paramétrez la structure du document LaTeX final.
                    </p>
                  </div>

                  <div className="space-y-6 p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        label="Classe du document"
                        value={options.documentClass}
                        onChange={(value) =>
                          updateOption("documentClass", value)
                        }
                        options={[
                          {
                            value: "report",
                            label: "Report",
                          },
                          {
                            value: "article",
                            label: "Article",
                          },
                        ]}
                        disabled={converting}
                      />

                      <SelectField
                        label="Taille de police"
                        value={options.fontSize}
                        onChange={(value) =>
                          updateOption("fontSize", value)
                        }
                        options={[
                          {
                            value: "10pt",
                            label: "10 pt",
                          },
                          {
                            value: "11pt",
                            label: "11 pt",
                          },
                          {
                            value: "12pt",
                            label: "12 pt",
                          },
                        ]}
                        disabled={converting}
                      />

                      <SelectField
                        label="Marges"
                        value={options.margins}
                        onChange={(value) =>
                          updateOption("margins", value)
                        }
                        options={[
                          {
                            value: "2.5cm",
                            label: "2,5 cm",
                          },
                          {
                            value: "2cm",
                            label: "2 cm",
                          },
                          {
                            value: "3cm",
                            label: "3 cm",
                          },
                        ]}
                        disabled={converting}
                      />

                      <SelectField
                        label="Langue"
                        value={options.language}
                        onChange={(value) =>
                          updateOption("language", value)
                        }
                        options={[
                          {
                            value: "french",
                            label: "Français",
                          },
                          {
                            value: "english",
                            label: "English",
                          },
                          {
                            value: "spanish",
                            label: "Español",
                          },
                          {
                            value: "german",
                            label: "Deutsch",
                          },
                        ]}
                        disabled={converting}
                      />

                      <SelectField
                        label="Bibliographie"
                        value={options.bibPackage}
                        onChange={(value) =>
                          updateOption("bibPackage", value)
                        }
                        options={[
                          {
                            value: "biblatex",
                            label: "BibLaTeX",
                          },
                          {
                            value: "bibtex",
                            label: "BibTeX",
                          },
                          {
                            value: "none",
                            label: "Aucune",
                          },
                        ]}
                        disabled={converting}
                      />

                      <SelectField
                        label="Style bibliographique"
                        value={options.bibStyle}
                        onChange={(value) =>
                          updateOption("bibStyle", value)
                        }
                        options={[
                          {
                            value: "apa",
                            label: "APA",
                          },
                          {
                            value: "numeric",
                            label: "Numeric",
                          },
                          {
                            value: "authoryear",
                            label: "Author-Year",
                          },
                        ]}
                        disabled={
                          converting ||
                          options.bibPackage === "none"
                        }
                      />
                    </div>

                    <div className="space-y-3">
                      <SettingRow
                        title="Table des matières"
                        description="Générer automatiquement la table des matières."
                        checked={options.toc}
                        onChange={(value) =>
                          updateOption("toc", value)
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Numérotation des sections"
                        description="Conserver une structure de sections numérotées."
                        checked={options.sectionNumbering}
                        onChange={(value) =>
                          updateOption(
                            "sectionNumbering",
                            value
                          )
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Conserver les notes de bas de page"
                        description="Convertir les notes Word en notes LaTeX."
                        checked={options.footnotes}
                        onChange={(value) =>
                          updateOption("footnotes", value)
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Conserver les commentaires"
                        description="Inclure les commentaires Word détectés."
                        checked={options.comments}
                        onChange={(value) =>
                          updateOption("comments", value)
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Inclure les métadonnées"
                        description="Utiliser le titre et l'auteur du document Word."
                        checked={options.metadata}
                        onChange={(value) =>
                          updateOption("metadata", value)
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Copier les images"
                        description="Conserver les figures et images dans le projet LaTeX."
                        checked={
                          options.imageHandling === "copy"
                        }
                        onChange={(value) =>
                          updateOption(
                            "imageHandling",
                            value ? "copy" : "ignore"
                          )
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Optimiser les images"
                        description="Optimiser les images lorsque cela est possible."
                        checked={options.optimizeImages}
                        onChange={(value) =>
                          updateOption(
                            "optimizeImages",
                            value
                          )
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Détecter les tableaux complexes"
                        description="Analyser les structures de tableaux avancées."
                        checked={options.detectComplexTables}
                        onChange={(value) =>
                          updateOption(
                            "detectComplexTables",
                            value
                          )
                        }
                        disabled={converting}
                      />

                      <SettingRow
                        title="Correction automatique"
                        description="Activer les corrections automatiques lors de la conversion."
                        checked={options.autoErrorCorrection}
                        onChange={(value) =>
                          updateOption(
                            "autoErrorCorrection",
                            value
                          )
                        }
                        disabled={converting}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-5">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={converting}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ArrowLeft size={17} />
                      Retour
                    </button>

                    <button
                      type="button"
                      onClick={handleConvert}
                      disabled={
                        converting || !selectedFile
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {converting ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Conversion...
                        </>
                      ) : (
                        <>
                          Convertir en LaTeX
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-800">
                    Document sélectionné
                  </p>

                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                      <FileText size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {selectedFile?.name ||
                          "Document Word"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {selectedFile
                          ? formatFileSize(
                              selectedFile.size
                            )
                          : ""}
                      </p>
                    </div>
                  </div>

                  {converting && (
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="font-medium text-slate-600">
                          {processingStage === "uploading"
                            ? "Envoi du document"
                            : processingStage === "analyzing"
                            ? "Analyse scientifique"
                            : "Conversion LaTeX"}
                        </span>

                        <span className="text-slate-400">
                          {uploadProgress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all"
                          style={{
                            width: `${uploadProgress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </section>
          )}

          {step === 3 && conversion && (
            <section>
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <h2 className="font-semibold text-emerald-900">
                      Conversion terminée
                    </h2>

                    <p className="mt-1 text-sm text-emerald-700">
                      Votre document scientifique est maintenant
                      disponible au format LaTeX.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Aperçu LaTeX
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        {conversion.latex_lines_count || 0} lignes · le ZIP inclut les images et fichiers requis
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadFile("latex")
                      }
                      disabled={
                        downloading === "latex"
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
                    >
                      {downloading === "latex" ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Download size={15} />
                      )}
                      Télécharger .tex
                    </button>
                  </div>

                  <pre className="max-h-[600px] overflow-auto bg-slate-950 p-6 text-xs leading-6 text-slate-200">
                    <code>
                      {latexCode ||
                        conversion.latex_code ||
                        "Aucun contenu LaTeX disponible."}
                    </code>
                  </pre>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-slate-900">
                      Exports
                    </h2>

                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadFile("latex")
                        }
                        disabled={
                          downloading === "latex"
                        }
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30 disabled:opacity-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <FileCode2 size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            Source LaTeX
                          </p>

                          <p className="text-xs text-slate-500">
                            .tex
                          </p>
                        </div>

                        {downloading === "latex" ? (
                          <Loader2
                            size={17}
                            className="animate-spin text-indigo-600"
                          />
                        ) : (
                          <Download
                            size={17}
                            className="text-slate-400"
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleExportZip}
                        disabled={
                          downloading === "zip"
                        }
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30 disabled:opacity-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <FileArchive size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            Projet LaTeX
                          </p>

                          <p className="text-xs text-slate-500">
                            .zip
                          </p>
                        </div>

                        {downloading === "zip" ? (
                          <Loader2
                            size={17}
                            className="animate-spin text-amber-600"
                          />
                        ) : (
                          <Download
                            size={17}
                            className="text-slate-400"
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleExportPdf}
                        disabled={
                          downloading === "pdf"
                        }
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/30 disabled:opacity-50"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <FileText size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            Document PDF
                          </p>

                          <p className="text-xs text-slate-500">
                            .pdf
                          </p>
                        </div>

                        {downloading === "pdf" ? (
                          <Loader2
                            size={17}
                            className="animate-spin text-red-600"
                          />
                        ) : (
                          <Download
                            size={17}
                            className="text-slate-400"
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                    <div className="flex items-start gap-3">
                      <Share2
                        size={21}
                        className="mt-0.5 shrink-0 text-indigo-600"
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold text-indigo-900">
                          Partager le fichier
                        </h3>

                        <p className="mt-1 text-sm leading-5 text-indigo-700">
                          Préparez le fichier puis ouvrez le système de
                          partage natif disponible sur votre appareil.
                        </p>

                        <button
                          type="button"
                          onClick={handleShare}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          <Share2 size={17} />
                          Partager le fichier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={17} />
                  Modifier la configuration
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
      </div>

      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Share2 size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Partager le fichier
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Sélectionnez le fichier à partager.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeShareModal}
                disabled={sharing}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid gap-3 md:grid-cols-3">
                {["pdf", "zip", "latex"].map((fileType) => {
                  const config =
                    getShareFileConfig(fileType);

                  const Icon = config.icon;
                  const selected =
                    shareFileType === fileType;

                  return (
                    <button
                      key={fileType}
                      type="button"
                      disabled={
                        sharePreparing || sharing
                      }
                      onClick={() =>
                        handleShareFileTypeChange(
                          fileType
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                          : "border-slate-200 bg-white hover:border-indigo-200"
                      } ${
                        sharePreparing || sharing
                          ? "cursor-not-allowed opacity-70"
                          : ""
                      }`}
                    >
                      <div
                        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Icon size={19} />
                      </div>

                      <p className="text-sm font-semibold text-slate-800">
                        {config.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {config.description}
                      </p>

                      <p className="mt-2 text-xs font-medium text-slate-400">
                        {config.extension}
                      </p>
                    </button>
                  );
                })}
              </div>

              {sharePreparing && (
                <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  <div>
                    <p className="font-medium">
                      Préparation du fichier...
                    </p>

                    <p className="mt-0.5 text-xs text-indigo-600">
                      Le fichier sera préparé avant l'ouverture du
                      partage.
                    </p>
                  </div>
                </div>
              )}

              {!sharePreparing && shareReady && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 size={18} />

                  <div>
                    <p className="font-medium">
                      Fichier prêt pour le partage
                    </p>

                    <p className="mt-0.5 text-xs text-emerald-600">
                      {sharePreparedFileRef.current?.filename}
                    </p>
                  </div>
                </div>
              )}

              {sharePreparationError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <div className="flex-1">
                    <p className="font-medium">
                      Partage indisponible
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-600">
                      {sharePreparationError}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-5">
              <button
                type="button"
                onClick={closeShareModal}
                disabled={sharing}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmShare}
                disabled={
                  !shareReady ||
                  sharePreparing ||
                  sharing
                }
                className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sharing ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Ouverture...
                  </>
                ) : sharePreparing ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Préparation...
                  </>
                ) : (
                  <>
                    <Share2 size={17} />
                    Partager le fichier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordToLatex;
