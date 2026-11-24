import { useState } from "react";

export function useReferenceState() {

  const [references, setReferences] = useState([]);

  const [citations, setCitations] = useState([]);

  const [bibliographyStyle, setBibliographyStyle] = useState("APA");

  return {

    references,
    setReferences,

    citations,
    setCitations,

    bibliographyStyle,
    setBibliographyStyle,

  };

}