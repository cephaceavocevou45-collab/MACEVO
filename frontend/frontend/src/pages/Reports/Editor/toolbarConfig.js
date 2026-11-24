import {
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

export const toolbarButtons = [

  {
    id: "save",
    icon: Save,
    tooltip: "Sauvegarder",
  },

  {
    id: "undo",
    icon: Undo,
    tooltip: "Annuler",
    command: editor => editor.chain().focus().undo().run(),
  },

  {
    id: "redo",
    icon: Redo,
    tooltip: "Rétablir",
    command: editor => editor.chain().focus().redo().run(),
  },

  {
    id: "bold",
    icon: Bold,
    tooltip: "Gras",
    command: editor => editor.chain().focus().toggleBold().run(),
  },

  {
    id: "italic",
    icon: Italic,
    tooltip: "Italique",
    command: editor => editor.chain().focus().toggleItalic().run(),
  },

  {
    id: "underline",
    icon: Underline,
    tooltip: "Souligné",
    command: editor => editor.chain().focus().toggleUnderline().run(),
  },

  {
    id: "h1",
    icon: Heading1,
    tooltip: "Titre 1",
    command: editor =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },

  {
    id: "h2",
    icon: Heading2,
    tooltip: "Titre 2",
    command: editor =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },

  {
    id: "bullet",
    icon: List,
    tooltip: "Liste",
    command: editor =>
      editor.chain().focus().toggleBulletList().run(),
  },

  {
    id: "ordered",
    icon: ListOrdered,
    tooltip: "Liste numérotée",
    command: editor =>
      editor.chain().focus().toggleOrderedList().run(),
  },

  {
    id: "quote",
    icon: Quote,
    tooltip: "Citation",
    command: editor =>
      editor.chain().focus().toggleBlockquote().run(),
  },

];