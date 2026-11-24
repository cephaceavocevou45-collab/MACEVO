import { useEditor } from "@tiptap/react";
import { editorOptions } from "../config/editorOptions";

export default function useTipTapEditor() {
  return useEditor(editorOptions);
}