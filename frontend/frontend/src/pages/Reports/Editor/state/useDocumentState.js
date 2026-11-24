import { useState } from "react";

export function useDocumentState() {
  const [currentDocument, setCurrentDocument] = useState(null);

  const [documentTitle, setDocumentTitle] = useState("");

  const [documentAuthor, setDocumentAuthor] = useState("");

  const [documentType, setDocumentType] = useState("Article");

  // Contenu du document actuellement ouvert dans l'éditeur
  const [content, setContent] = useState("");

  const [createdAt, setCreatedAt] = useState(null);

  const [updatedAt, setUpdatedAt] = useState(null);

  return {
    currentDocument,
    setCurrentDocument,

    documentTitle,
    setDocumentTitle,

    documentAuthor,
    setDocumentAuthor,

    documentType,
    setDocumentType,

    content,
    setContent,

    createdAt,
    setCreatedAt,

    updatedAt,
    setUpdatedAt,
  };
}