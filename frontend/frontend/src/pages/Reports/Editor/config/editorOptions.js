import { editorExtensions } from "./extensions";
import { editorProps } from "./editorProps";
import { editorEvents } from "./events";

export const editorOptions = {
  extensions: editorExtensions,

  editorProps,

  content: "",

  autofocus: true,

  editable: true,

  ...editorEvents,
};