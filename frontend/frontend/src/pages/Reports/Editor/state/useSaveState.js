import { useState } from "react";

export function useSaveState() {

  const [isSaving, setIsSaving] = useState(false);

  const [isSaved, setIsSaved] = useState(true);

  const [lastSaved, setLastSaved] = useState(null);

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  return {

    isSaving,
    setIsSaving,

    isSaved,
    setIsSaved,

    lastSaved,
    setLastSaved,

    autoSaveEnabled,
    setAutoSaveEnabled,

  };

}