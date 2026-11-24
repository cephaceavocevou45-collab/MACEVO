import api from "../api/axios";

// ==========================================================
// CONFIGURATION
// ==========================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "/api/"
).replace(/\/+$/, "");

const WORD_TO_LATEX_BASE_URL =
  `${API_BASE_URL}/word-to-latex`;

const MAX_FILE_SIZE = 50 * 1024 * 1024;

// ==========================================================
// NORMALISATION DES OPTIONS
// ==========================================================

const normalizeOptions = (options = {}) => ({
  document_class:
    options.document_class ??
    options.documentClass ??
    "report",

  font_size:
    options.font_size ??
    options.fontSize ??
    "11pt",

  margins:
    options.margins ??
    "2.5cm",

  language:
    options.language ??
    "french",

  table_of_contents:
    options.table_of_contents ??
    options.tableOfContents ??
    options.toc ??
    true,

  section_numbering:
    options.section_numbering ??
    options.sectionNumbering ??
    true,

  bibliography_package:
    options.bibliography_package ??
    options.bibliographyPackage ??
    options.bibPackage ??
    "biblatex",

  bibliography_style:
    options.bibliography_style ??
    options.bibliographyStyle ??
    options.bibStyle ??
    "apa",

  image_handling:
    options.image_handling ??
    options.imageHandling ??
    "copy",

  optimize_images:
    options.optimize_images ??
    options.optimizeImages ??
    true,

  include_footnotes:
    options.include_footnotes ??
    options.includeFootnotes ??
    options.footnotes ??
    true,

  include_comments:
    options.include_comments ??
    options.includeComments ??
    options.comments ??
    false,

  include_metadata:
    options.include_metadata ??
    options.includeMetadata ??
    options.metadata ??
    false,

  detect_complex_tables:
    options.detect_complex_tables ??
    options.detectComplexTables ??
    true,

  auto_error_correction:
    options.auto_error_correction ??
    options.autoErrorCorrection ??
    true,
});

// ==========================================================
// GESTION DES ERREURS
// ==========================================================

const getErrorMessage = (
  error,
  fallback = "Une erreur est survenue."
) => {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.detail) {
    return String(data.detail);
  }

  if (data?.message) {
    return String(data.message);
  }

  if (data?.error) {
    return String(data.error);
  }

  if (data && typeof data === "object") {
    const messages = [];

    Object.entries(data).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        value.forEach((message) => {
          if (typeof message === "string") {
            messages.push(
              field === "non_field_errors"
                ? message
                : `${field}: ${message}`
            );
          } else if (
            message &&
            typeof message === "object"
          ) {
            Object.values(message).forEach(
              (nestedMessage) => {
                if (typeof nestedMessage === "string") {
                  messages.push(
                    `${field}: ${nestedMessage}`
                  );
                }
              }
            );
          }
        });

        return;
      }

      if (value && typeof value === "object") {
        Object.entries(value).forEach(
          ([nestedField, nestedValue]) => {
            if (Array.isArray(nestedValue)) {
              nestedValue.forEach((message) => {
                if (typeof message === "string") {
                  messages.push(
                    `${field}.${nestedField}: ${message}`
                  );
                }
              });

              return;
            }

            if (
              nestedValue !== null &&
              nestedValue !== undefined
            ) {
              messages.push(
                `${field}.${nestedField}: ${nestedValue}`
              );
            }
          }
        );

        return;
      }

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {
        messages.push(`${field}: ${value}`);
      }
    });

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  if (
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};

// ==========================================================
// VALIDATION DU FICHIER WORD
// ==========================================================

const validateWordFile = (file) => {
  if (!(file instanceof File)) {
    throw new Error(
      "Le fichier Word fourni est invalide."
    );
  }

  if (!file.name.toLowerCase().endsWith(".docx")) {
    throw new Error(
      "Le fichier doit être au format .docx."
    );
  }

  if (file.size <= 0) {
    throw new Error(
      "Le fichier Word sélectionné est vide."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Le fichier dépasse la taille maximale autorisée de 50 Mo."
    );
  }
};

// ==========================================================
// UPLOAD
// ==========================================================

const uploadDocument = async (
  file,
  options = {},
  onUploadProgress
) => {
  validateWordFile(file);

  const formData = new FormData();

  // IMPORTANT :
  // WordDocumentUploadSerializer attend le champ "file".
  formData.append("file", file);

  // Les options sont envoyées sous forme JSON
  // dans le champ multipart "options".
  formData.append(
    "options",
    JSON.stringify(
      normalizeOptions(options)
    )
  );

  try {
    const response = await api.post(
      "word-to-latex/upload/",
      formData,
      {
        onUploadProgress,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Impossible de téléverser et convertir le document Word."
      )
    );
  }
};

const uploadWordDocument = uploadDocument;

// ==========================================================
// COMPATIBILITÉ WORDTOLATEX.JSX
// ==========================================================

const uploadAndConvert = async (
  file,
  options = {},
  onUploadProgress
) => {
  return uploadDocument(
    file,
    options,
    onUploadProgress
  );
};

// ==========================================================
// LISTE DES CONVERSIONS
// ==========================================================

const getConversions = async () => {
  try {
    const response = await api.get(
      "word-to-latex/conversions/"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Impossible de récupérer les conversions."
      )
    );
  }
};

const getConversionList = getConversions;

// ==========================================================
// DÉTAIL D'UNE CONVERSION
// ==========================================================

const getConversion = async (conversionId) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  try {
    const response = await api.get(
      `word-to-latex/conversions/${encodeURIComponent(
        conversionId
      )}/`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Impossible de récupérer cette conversion."
      )
    );
  }
};

// ==========================================================
// SUPPRESSION
// ==========================================================

const deleteConversion = async (conversionId) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  try {
    const response = await api.delete(
      `word-to-latex/conversions/${encodeURIComponent(
        conversionId
      )}/delete/`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Impossible de supprimer cette conversion."
      )
    );
  }
};

const removeConversion = deleteConversion;

// ==========================================================
// URL DE TÉLÉCHARGEMENT
// ==========================================================

const getDownloadUrl = (
  conversionId,
  fileType
) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  if (!fileType) {
    throw new Error(
      "Type de fichier manquant."
    );
  }

  return (
    `${WORD_TO_LATEX_BASE_URL}` +
    `/conversions/${encodeURIComponent(
      conversionId
    )}` +
    `/download/${encodeURIComponent(
      fileType
    )}/`
  );
};

// ==========================================================
// RÉCUPÉRATION D'UN FICHIER
// ==========================================================

const fetchConversionFile = async (
  conversionId,
  fileType,
  onDownloadProgress
) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  if (!fileType) {
    throw new Error(
      "Type de fichier manquant."
    );
  }

  try {
    const response = await api.get(
      `word-to-latex/conversions/${encodeURIComponent(
        conversionId
      )}/download/${encodeURIComponent(
        fileType
      )}/`,
      {
        responseType: "blob",
        onDownloadProgress,
      }
    );

    if (!(response.data instanceof Blob)) {
      throw new Error(
        "Le serveur a retourné un fichier invalide."
      );
    }

    if (response.data.size <= 0) {
      throw new Error(
        "Le fichier généré est vide."
      );
    }

    return response.data;
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text =
          await error.response.data.text();

        const parsed = JSON.parse(text);

        throw new Error(
          getErrorMessage(
            {
              response: {
                data: parsed,
              },
            },
            "Impossible de récupérer le fichier généré."
          )
        );
      } catch (blobError) {
        if (
          blobError instanceof Error &&
          blobError.message
        ) {
          throw blobError;
        }
      }
    }

    throw new Error(
      getErrorMessage(
        error,
        "Impossible de récupérer le fichier généré."
      )
    );
  }
};

// ==========================================================
// TÉLÉCHARGEMENT CLIENT
// ==========================================================

const createDownload = (
  blob,
  filename
) => {
  if (!(blob instanceof Blob)) {
    throw new Error(
      "Le fichier à télécharger est invalide."
    );
  }

  if (blob.size <= 0) {
    throw new Error(
      "Le fichier à télécharger est vide."
    );
  }

  const objectUrl =
    window.URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = objectUrl;
  anchor.download =
    filename || "document";
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
};

// ==========================================================
// TÉLÉCHARGEMENT D'UNE CONVERSION
// ==========================================================

const downloadConversion = async (
  conversionId,
  fileType,
  filename,
  onDownloadProgress
) => {
  const blob =
    await fetchConversionFile(
      conversionId,
      fileType,
      onDownloadProgress
    );

  createDownload(
    blob,
    filename || `document.${fileType}`
  );

  return blob;
};

// ==========================================================
// NOM DE FICHIER HTTP
// ==========================================================

const getFilenameFromResponse = (
  response,
  fallback
) => {
  const contentDisposition =
    response?.headers?.["content-disposition"];

  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i
    );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1]
      );
    } catch {
      return utf8Match[1];
    }
  }

  const filenameMatch =
    contentDisposition.match(
      /filename="?([^"]+)"?/i
    );

  return (
    filenameMatch?.[1] ||
    fallback
  );
};

// ==========================================================
// EXTRACTION FICHIER DEPUIS RÉPONSE EXPORT
// ==========================================================

const extractExportUrl = (
  response,
  fieldName
) => {
  const data = response?.data;

  if (!data) {
    return null;
  }

  if (typeof data === "string") {
    return data;
  }

  return (
    data[fieldName] ||
    data.conversion?.[fieldName] ||
    null
  );
};

// ==========================================================
// EXPORT ZIP
// ==========================================================

const exportZip = async (
  conversionId
) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  try {
    const response = await api.post(
      `word-to-latex/conversions/${encodeURIComponent(
        conversionId
      )}/export/zip/`,
      {}
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Impossible de générer l'archive ZIP."
      )
    );
  }
};

// ==========================================================
// EXPORT PDF
// ==========================================================

const exportPdf = async (
  conversionId
) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  try {
    const response = await api.post(
      `word-to-latex/conversions/${encodeURIComponent(
        conversionId
      )}/export/pdf/`,
      {}
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(
        error,
        "Impossible de générer le PDF."
      )
    );
  }
};

// ==========================================================
// DOWNLOAD ZIP
// ==========================================================

const downloadZip = async (
  conversionId,
  filename
) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  const result =
    await exportZip(conversionId);

  const zipUrl =
    result?.zip_file ||
    result?.conversion?.zip_file;

  if (!zipUrl) {
    return downloadConversion(
      conversionId,
      "zip",
      filename ||
        "word-to-latex.zip"
    );
  }

  let blob;

  if (
    typeof zipUrl === "string" &&
    /^https?:\/\//i.test(zipUrl)
  ) {
    const response =
      await api.get(
        zipUrl,
        {
          responseType: "blob",
        }
      );

    blob = response.data;
  } else {
    const response =
      await api.get(
        zipUrl.startsWith("/")
          ? zipUrl
          : `/${zipUrl}`,
        {
          responseType: "blob",
        }
      );

    blob = response.data;
  }

  createDownload(
    blob,
    filename ||
      "word-to-latex.zip"
  );

  return blob;
};

// ==========================================================
// DOWNLOAD PDF
// ==========================================================

const downloadPdf = async (
  conversionId,
  filename
) => {
  if (!conversionId) {
    throw new Error(
      "Identifiant de conversion manquant."
    );
  }

  const result =
    await exportPdf(conversionId);

  const pdfUrl =
    result?.pdf_file ||
    result?.conversion?.pdf_file;

  if (!pdfUrl) {
    return downloadConversion(
      conversionId,
      "pdf",
      filename ||
        "document.pdf"
    );
  }

  let blob;

  if (
    typeof pdfUrl === "string" &&
    /^https?:\/\//i.test(pdfUrl)
  ) {
    const response =
      await api.get(
        pdfUrl,
        {
          responseType: "blob",
        }
      );

    blob = response.data;
  } else {
    const response =
      await api.get(
        pdfUrl.startsWith("/")
          ? pdfUrl
          : `/${pdfUrl}`,
        {
          responseType: "blob",
        }
      );

    blob = response.data;
  }

  createDownload(
    blob,
    filename ||
      "document.pdf"
  );

  return blob;
};

// ==========================================================
// API DOWNLOAD FILE
// ==========================================================

const apiDownloadFile = async (
  conversionId,
  fileType,
  onDownloadProgress
) => {
  return fetchConversionFile(
    conversionId,
    fileType,
    onDownloadProgress
  );
};

// ==========================================================
// DOWNLOAD FILE
// ==========================================================

const downloadFile = async (
  conversionId,
  fileType,
  onDownloadProgress
) => {
  const blob =
    await apiDownloadFile(
      conversionId,
      fileType,
      onDownloadProgress
    );

  return {
    data: blob,
  };
};

// ==========================================================
// EXPORTS
// ==========================================================

const wordToLatexService = {
  api,

  uploadDocument,
  uploadWordDocument,
  uploadAndConvert,

  getConversions,
  getConversionList,

  getConversion,

  deleteConversion,
  removeConversion,

  getDownloadUrl,

  fetchConversionFile,
  downloadConversion,
  downloadFile,

  getFilenameFromResponse,

  exportZip,
  exportPdf,

  downloadZip,
  downloadPdf,

  createDownload,
  extractExportUrl,

  getErrorMessage,
  normalizeOptions,
};

export {
  api,

  uploadDocument,
  uploadWordDocument,
  uploadAndConvert,

  getConversions,
  getConversionList,

  getConversion,

  deleteConversion,
  removeConversion,

  getDownloadUrl,

  fetchConversionFile,
  downloadConversion,
  downloadFile,

  getFilenameFromResponse,

  exportZip,
  exportPdf,

  downloadZip,
  downloadPdf,

  createDownload,
  extractExportUrl,

  getErrorMessage,
  normalizeOptions,
};

export default wordToLatexService;