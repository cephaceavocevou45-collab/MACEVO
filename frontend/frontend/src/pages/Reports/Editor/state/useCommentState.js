import { useState } from "react";

export function useCommentState() {

  const [comments, setComments] = useState([]);

  const [activeComment, setActiveComment] = useState(null);

  return {

    comments,
    setComments,

    activeComment,
    setActiveComment,

  };

}