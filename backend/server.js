/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : server.js
 * Description : Serveur backend principal MACEVO
 * Version : 1.0.0
 * ==========================================================
 */

import express from "express";
import cors from "cors";

import latexRoutes from "./src/routes/latex.routes.js";


/* ==========================================================
   APPLICATION
========================================================== */

const app =
    express();


/* ==========================================================
   CONFIGURATION
========================================================== */

const PORT =
    Number(

        process.env.PORT ||

        3001

    );


/* ==========================================================
   MIDDLEWARE
========================================================== */

app.use(

    cors({

        origin: true,

        credentials: true,

    })

);


app.use(

    express.json({

        limit: "2mb",

    })

);


/* ==========================================================
   ROUTES
========================================================== */

app.use(

    "/api/latex",

    latexRoutes

);


/* ==========================================================
   ROUTE RACINE
========================================================== */

app.get(

    "/",

    (req, res) => {

        res.json({

            success: true,

            name: "MACEVO Backend",

            version: "1.0.0",

            service: "LaTeX",

        });

    }

);


/* ==========================================================
   404
========================================================== */

app.use(

    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Route introuvable.",

            path:
                req.originalUrl,

        });

    }

);


/* ==========================================================
   ERREUR GLOBALE
========================================================== */

app.use(

    (error, req, res, next) => {

        console.error(

            "Erreur serveur:",

            error

        );


        if (res.headersSent) {

            return next(error);

        }


        res.status(500).json({

            success: false,

            message:
                error?.message ??
                "Erreur interne du serveur.",

        });

    }

);


/* ==========================================================
   DEMARRAGE
========================================================== */

app.listen(

    PORT,

    () => {

        console.log("");

        console.log(
            "=========================================="
        );

        console.log(
            " MACEVO BACKEND"
        );

        console.log(
            "=========================================="
        );

        console.log(
            ` Serveur : http://localhost:${PORT}`
        );

        console.log(
            ` LaTeX   : http://localhost:${PORT}/api/latex`
        );

        console.log(
            "=========================================="
        );

        console.log("");

    }

);