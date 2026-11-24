import { TextStyle } from "@tiptap/extension-text-style";
import { StarterKit } from "@tiptap/starter-kit";

import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";

import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";

import Placeholder from "@tiptap/extension-placeholder";

import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import CharacterCount from "@tiptap/extension-character-count";
import LineHeight from "./LineHeight";

import { editorPlaceholder } from "./placeholder";
import { MacevoBreak } from "./MacevoBreaks";

export const editorExtensions = [

    StarterKit,

    MacevoBreak,

    Underline,

    Highlight,

    TextStyle,

    Color,

    Typography,

    Link,

    Image,

    TaskList,

    TaskItem.configure({
        nested: true,
    }),

    TextAlign.configure({
        types: [
            "heading",
            "paragraph",
        ],
    }),

    LineHeight,

    Table.configure({
        resizable: true,
    }),

    TableRow,

    TableHeader,

    TableCell,

    CharacterCount,

    Placeholder.configure({
        placeholder: editorPlaceholder,
    }),

];
