import { useState } from "react";

export function useHistoryState() {

  const [versionHistory, setVersionHistory] = useState([]);

  const [currentVersion, setCurrentVersion] = useState(1);

  return {

    versionHistory,
    setVersionHistory,

    currentVersion,
    setCurrentVersion,

  };

}