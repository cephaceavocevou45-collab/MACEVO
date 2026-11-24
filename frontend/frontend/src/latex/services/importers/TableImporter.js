/**
 * ==========================================================
 * MACEVO
 *
 * Fichier : TableImporter.js
 * Description : Import des tableaux LaTeX -> HTML
 * ==========================================================
 */

class TableImporter {

    convert(source = "") {

        let result =
            String(source ?? "");


        /*
         * tabular
         */

        result =
            result.replace(
                /\\begin\{tabular\}\{[^{}]*\}([\s\S]*?)\\end\{tabular\}/g,
                (_, content) =>
                    this.convertTable(content)
            );


        /*
         * table
         */

        result =
            result.replace(
                /\\begin\{table\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{table\}/g,
                (_, content) =>
                    `<table><tbody>${content}</tbody></table>`
            );


        return result;

    }


    convertTable(content) {

        const rows =
            String(content ?? "")
                .split(/\\\\/)
                .map(row => row.trim())
                .filter(Boolean);


        let html =
            "<table><tbody>";


        rows.forEach(row => {

            row =
                row.replace(
                    /\\hline/g,
                    ""
                ).trim();


            if (!row) {
                return;
            }


            const cells =
                row
                    .split("&")
                    .map(
                        cell => cell.trim()
                    );


            html += "<tr>";


            cells.forEach(cell => {

                html +=
                    `<td>${cell}</td>`;

            });


            html += "</tr>";

        });


        html +=
            "</tbody></table>";


        return html;

    }

}


export default TableImporter;