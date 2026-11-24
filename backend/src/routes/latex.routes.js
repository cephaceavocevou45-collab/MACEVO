/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : latex.routes.js
 * Description : Routes API LaTeX
 * Version : 1.0.0
 * ==========================================================
 */

import {

    Router,

} from "express";

import latexController
    from "../controllers/latex.controller.js";


const router =
    Router();


/* ==========================================================
   COMPILATION
========================================================== */

router.post(

    "/compile",

    (req, res) =>

        latexController.compile(

            req,

            res

        )

);


/* ==========================================================
   PDF
========================================================== */

router.get(

    "/pdf/:id",

    (req, res) =>

        latexController.pdf(

            req,

            res

        )

);


/* ==========================================================
   LOGS
========================================================== */

router.get(

    "/logs/:id",

    (req, res) =>

        latexController.logs(

            req,

            res

        )

);


/* ==========================================================
   PING
========================================================== */

router.get(

    "/ping",

    (req, res) =>

        latexController.ping(

            req,

            res

        )

);


export default router;