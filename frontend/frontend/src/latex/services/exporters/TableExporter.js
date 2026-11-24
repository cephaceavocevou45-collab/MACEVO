/**
 * ==========================================================
 * MACEVO
 *
 * ---
 * Fichier : TableExporter.js
 * Description : Export des tableaux HTML vers LaTeX
 * Version : 3.1.0
 * ==========================================================
 */

import latexBuilder from "../utils/LatexBuilder";

class TableExporter {

    constructor(exporter) {

        this.exporter = exporter;

    }


    /* ======================================================
       TABLE
    ====================================================== */

    exportTable(node) {

        if (!node) {
            return "";
        }

        const rows =
            this.getRows(node);

        if (!rows.length) {
            return "";
        }

        const columns =
            this.getColumnCount(rows);

        if (!columns) {
            return "";
        }

        const alignment =
            this.buildAlignment(
                columns
            );

        const body =
            rows
                .map(row =>
                    this.exportRow(row)
                )
                .filter(Boolean)
                .join("\n");

        if (!body) {
            return "";
        }

        return latexBuilder.concat(
            "\\begin{tabular}",
            alignment,
            "\n",
            body,
            "\n",
            "\\end{tabular}",
            "\n\n"
        );

    }


    /* ======================================================
       RÉCUPÉRER LES LIGNES
    ====================================================== */

    getRows(table) {

        if (!table) {
            return [];
        }

        const rows = [];


        Array.from(
            table.children
        ).forEach(section => {

            const tagName =
                section.tagName
                    ?.toLowerCase();


            if (
                tagName === "thead" ||
                tagName === "tbody" ||
                tagName === "tfoot"
            ) {

                Array.from(
                    section.children
                ).forEach(child => {

                    if (
                        child.tagName
                            ?.toLowerCase() ===
                        "tr"
                    ) {
                        rows.push(child);
                    }

                });

                return;

            }


            if (
                tagName === "tr"
            ) {
                rows.push(section);
            }

        });


        return rows;

    }


    /* ======================================================
       THEAD
    ====================================================== */

    exportHead(node) {

        if (!node) {
            return "";
        }

        return this.exportChildren(node);

    }


    /* ======================================================
       TBODY
    ====================================================== */

    exportBody(node) {

        if (!node) {
            return "";
        }

        return this.exportChildren(node);

    }


    /* ======================================================
       TFOOT
    ====================================================== */

    exportFoot(node) {

        if (!node) {
            return "";
        }

        return this.exportChildren(node);

    }


    /* ======================================================
       ROW
    ====================================================== */

    exportRow(node) {

        if (!node) {
            return "";
        }

        const cells =
            Array.from(
                node.children
            ).filter(child => {

                const tagName =
                    child.tagName
                        ?.toLowerCase();

                return (
                    tagName === "td" ||
                    tagName === "th"
                );

            });


        if (!cells.length) {
            return "";
        }


        const content =
            cells
                .map(cell =>
                    this.exportCell(cell)
                )
                .join(" & ");


        return content + " \\\\";

    }


    /* ======================================================
       CELLULE HEADER
    ====================================================== */

    exportHeaderCell(node) {

        if (!node) {
            return "";
        }

        return this.exportCellContent(
            node,
            true
        );

    }


    /* ======================================================
       CELLULE
    ====================================================== */

    exportCell(node) {

        if (!node) {
            return "";
        }

        const tagName =
            node.tagName
                ?.toLowerCase();

        return this.exportCellContent(
            node,
            tagName === "th"
        );

    }


    /* ======================================================
       CONTENU CELLULE
    ====================================================== */

    exportCellContent(
        node,
        header = false
    ) {

        if (!node) {
            return "";
        }

        let content = "";


        if (this.exporter) {

            content =
                this.exporter
                    .exportChildren(node);

        }
        else {

            content =
                node.textContent ?? "";

        }


        content =
            content.trim();


        if (!content) {
            content = "\\mbox{}";
        }


        const colspan =
            this.getSpan(
                node,
                "colspan"
            );


        if (header) {

            content =
                latexBuilder.command(
                    "textbf",
                    content
                );

        }


        if (colspan > 1) {

            content =
                this.multicolumn(
                    colspan,
                    "c",
                    content
                );

        }


        return content;

    }


    /* ======================================================
       MULTICOLUMN
    ====================================================== */

    multicolumn(
        columns,
        alignment,
        content
    ) {

        const count =
            Math.max(
                1,
                parseInt(
                    columns,
                    10
                ) || 1
            );

        return (
            "\\multicolumn{" +
            count +
            "}{" +
            alignment +
            "}{" +
            content +
            "}"
        );

    }


    /* ======================================================
       SPAN
    ====================================================== */

    getSpan(
        node,
        attribute
    ) {

        if (!node) {
            return 1;
        }

        const value =
            parseInt(
                node.getAttribute(
                    attribute
                ),
                10
            );

        if (
            Number.isNaN(value) ||
            value < 1
        ) {
            return 1;
        }

        return value;

    }


    /* ======================================================
       NOMBRE DE COLONNES
    ====================================================== */

    getColumnCount(rows) {

        let count = 0;


        rows.forEach(row => {

            let rowCount = 0;


            Array.from(
                row.children
            ).forEach(cell => {

                rowCount +=
                    this.getSpan(
                        cell,
                        "colspan"
                    );

            });


            count =
                Math.max(
                    count,
                    rowCount
                );

        });


        return count;

    }


    /* ======================================================
       ALIGNEMENT
    ====================================================== */

    buildAlignment(columns) {

        const count =
            Math.max(
                1,
                parseInt(
                    columns,
                    10
                ) || 1
            );

        /*
         * Avant :
         * {l|l|l|}
         *
         * Maintenant :
         * {l|l|l}
         */

        return (
            "{" +
            Array.from(
                { length: count },
                () => "l"
            ).join("|") +
            "}"
        );

    }


    /* ======================================================
       ENFANTS
    ====================================================== */

    exportChildren(node) {

        if (
            !this.exporter ||
            !node
        ) {
            return "";
        }

        return this.exporter
            .exportChildren(node);

    }

}


export default TableExporter;