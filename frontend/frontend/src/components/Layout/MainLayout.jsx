/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : MainLayout.jsx
 * Description : Layout principal de l'application
 * Version : 3.0.0
 * ==========================================================
 */

import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";
import Footer from "./Footer";

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">

      {/* ==========================
          Barre de navigation
      ========================== */}
      <Navbar />

      {/* ==========================
          Contenu principal
      ========================== */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ==========================
          Pied de page
      ========================== */}
      <Footer />

    </div>
  );
}

export default MainLayout;