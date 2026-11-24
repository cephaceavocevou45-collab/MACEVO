import { useState } from "react";

export function useStatisticsState() {

  const [wordCount, setWordCount] = useState(0);

  const [characterCount, setCharacterCount] = useState(0);

  const [readingTime, setReadingTime] = useState(0);

  const [pageCount, setPageCount] = useState(1);

  return {

    wordCount,
    setWordCount,

    characterCount,
    setCharacterCount,

    readingTime,
    setReadingTime,

    pageCount,
    setPageCount,

  };

}