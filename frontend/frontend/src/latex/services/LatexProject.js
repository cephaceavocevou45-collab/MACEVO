/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : LatexProject.js
 * Description : Gestionnaire du projet LaTeX.
 * Version : 3.0.0
 * ==========================================================
 */

class LatexProject {

    constructor() {

        this.reset();

    }

    /* ======================================================
       INITIALISATION
    ====================================================== */

    reset() {

        this.project = {

            files: [

                {
                    id: "main",
                    name: "main.tex",
                    type: "tex",
                    content: ""
                },

                {
                    id: "images",
                    name: "images",
                    type: "folder",
                    children: []
                },

                {
                    id: "bib",
                    name: "bib",
                    type: "folder",
                    children: []
                },

                {
                    id: "style",
                    name: "style.sty",
                    type: "sty",
                    content: ""
                }

            ],

            activeFile: "main"

        };

    }

    /* ======================================================
       PROJET
    ====================================================== */

    getProject() {

        return this.project;

    }

    setProject(project) {

        this.project = project;

    }

    /* ======================================================
       IDENTIFIANT
    ====================================================== */

    generateId(prefix = "file") {

        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    }

    /* ======================================================
       FICHIERS
    ====================================================== */

    getFiles() {

        return this.project.files;

    }

    getFile(id) {

        return this.project.files.find(

            file => file.id === id

        );

    }

    getActiveFile() {

        return this.getFile(

            this.project.activeFile

        );

    }

    setActiveFile(id) {

        if (this.getFile(id)) {

            this.project.activeFile = id;

        }

    }

    /* ======================================================
       CONTENU
    ====================================================== */

    getContent(id = this.project.activeFile) {

        return this.getFile(id)?.content ?? "";

    }

    getActiveContent() {

        return this.getContent();

    }

    setContent(content, id = this.project.activeFile) {

        const file = this.getFile(id);

        if (!file) {

            return;

        }

        file.content = content;

    }

    updateFileContent(id, content) {

        this.setContent(content, id);

    }

    /* ======================================================
       CREATION
    ====================================================== */

    createTexFile(name = "nouveau.tex") {

        const id = this.generateId("tex");

        this.project.files.push({

            id,

            name,

            type: "tex",

            content: ""

        });

        this.project.activeFile = id;

        return id;

    }

    createBibFile(name = "references.bib") {

        const id = this.generateId("bib");

        this.project.files.push({

            id,

            name,

            type: "bib",

            content: ""

        });

        this.project.activeFile = id;

        return id;

    }

    createStyleFile(name = "style.sty") {

        const id = this.generateId("sty");

        this.project.files.push({

            id,

            name,

            type: "sty",

            content: ""

        });

        this.project.activeFile = id;

        return id;

    }

    createFolder(name = "Nouveau dossier") {

        const id = this.generateId("folder");

        this.project.files.push({

            id,

            name,

            type: "folder",

            children: []

        });

        return id;

    }

    /* ======================================================
       SUPPRESSION
    ====================================================== */

    remove(id) {

        if (id === "main") {

            return;

        }

        this.project.files = this.project.files.filter(

            file => file.id !== id

        );

        if (this.project.activeFile === id) {

            this.project.activeFile = "main";

        }

    }

    /* ======================================================
       RENOMMAGE
    ====================================================== */

    rename(id, newName) {

        const file = this.getFile(id);

        if (!file) {

            return;

        }

        file.name = newName;

    }

}

const latexProject = new LatexProject();

export default latexProject;