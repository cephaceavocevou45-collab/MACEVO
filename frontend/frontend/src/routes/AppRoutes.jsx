import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "../components/Layout/MainLayout";
import AppLayout from "../components/Layout/AppLayout";
import ProtectedRoute from "../components/Auth/ProtectedRoute";
import EditorHome from "../pages/Reports/Editor/EditorHome";

const WordToLatex = lazy(() => import("../pages/WordToLatex"));
const PdfToLatex = lazy(() => import("../pages/PdfToLatex"));
const Home = lazy(() => import("../pages/Home/Homee"));
const Login = lazy(() => import("../pages/Login/Login"));
const Register = lazy(() => import("../pages/Register/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword/ForgotPassword"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Reports = lazy(() => import("../pages/Reports/Reports"));
const Editorr = lazy(() => import("../pages/Reports/Editor/Editorr"));
const NewReport = lazy(() => import("../pages/Reports/NewReport"));
const CreateReport = lazy(() => import("../pages/Reports/CreateReport"));
const Templates = lazy(() => import("../pages/Reports/Templates"));
const ModelesLatex = lazy(() => import("../pages/Reports/ModelesLatex"));
const ImportWord = lazy(() => import("../pages/Reports/ImportWord"));
const ViewReport = lazy(() => import("../pages/Reports/ViewReport"));
const DocumentVierge = lazy(() => import("../pages/Reports/DocumentVierge"));
const StartReport = lazy(() => import("../pages/Reports/StartReport"));
const DepotScientifique = lazy(() => import("../pages/Reports/DepotScientifique"));
const ScientificGenerator = lazy(() => import("../pages/Reports/ScientificGenerator/ScientificGenerator"));
const Favoris = lazy(() => import("../pages/Reports/Favoris"));
const Corbeille = lazy(() => import("../pages/Reports/Corbeille"));
const Premium = lazy(() => import("../pages/Reports/Premium"));
const Stockage = lazy(() => import("../pages/Reports/Stockage"));
const Statistics = lazy(() => import("../pages/Statistics/Statistics"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const ExportPDF = lazy(() => import("../pages/Features/ExportPDF"));
const Support = lazy(() => import("../pages/Support/Support"));
const UIShowcase = lazy(() => import("../pages/UI/UIShowcase"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

function AppRoutes() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-medium text-slate-500 dark:bg-slate-950 dark:text-slate-300"><span className="animate-pulse">Chargement de votre espace…</span></div>}>
    <Routes>
      {/* ---------------------------------------------------------
          ROUTES PUBLIQUES
      --------------------------------------------------------- */}

      <Route path="/word-to-latex" element={<WordToLatex />} />
      <Route path="/pdf-to-latex" element={<PdfToLatex />} />

      <Route path="ui" element={<UIShowcase />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* ---------------------------------------------------------
          APPLICATION
      --------------------------------------------------------- */}

      <Route element={<AppLayout />}>
        {/* Authentification */}
        <Route path="connexion" element={<Login />} />
        <Route path="inscription" element={<Register />} />
        <Route
          path="mot-de-passe-oublie"
          element={<ForgotPassword />}
        />

        {/* -------------------------------------------------------
            TABLEAU DE BORD
        ------------------------------------------------------- */}

        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            RAPPORTS
        ------------------------------------------------------- */}

        <Route
          path="rapports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="rapports/demarrer"
          element={<ProtectedRoute><StartReport /></ProtectedRoute>}
        />

        <Route
          path="rapports/nouveau"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="rapports/creer"
          element={
            <ProtectedRoute>
              <CreateReport />
            </ProtectedRoute>
          }
        />

        {/* Modèles */}
        <Route
          path="rapports/templates"
          element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          }
        />

        <Route
          path="rapports/modeles-latex"
          element={
            <ProtectedRoute>
              <ModelesLatex />
            </ProtectedRoute>
          }
        />

        <Route
          path="modeles"
          element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          }
        />

        {/* Import Word */}
        <Route
          path="rapports/import-word"
          element={
            <ProtectedRoute>
              <ImportWord />
            </ProtectedRoute>
          }
        />


        {/* Visualisation d'un rapport */}
        <Route
          path="rapports/:id"
          element={
            <ProtectedRoute>
              <ViewReport />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            DOCUMENT VIERGE
        ------------------------------------------------------- */}

        <Route
          path="rapports/document-vierge"
          element={
            <ProtectedRoute>
              <DocumentVierge />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            ÉDITEUR SCIENTIFIQUE MACEVO
        ------------------------------------------------------- */}

        {/* Sélectionner un document existant avant d'ouvrir l'éditeur. */}
        <Route
          path="rapports/editeur"
          element={<ProtectedRoute><EditorHome /></ProtectedRoute>}
        />

        {/* Édition d'un Report existant */}
        <Route
          path="rapports/editeur/:id"
          element={
            <ProtectedRoute>
              <Editorr />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            DÉPÔT SCIENTIFIQUE
        ------------------------------------------------------- */}

        <Route
          path="rapports/depot-scientifique"
          element={
            <ProtectedRoute>
              <DepotScientifique />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            GÉNÉRATEUR SCIENTIFIQUE
        ------------------------------------------------------- */}

        <Route
          path="rapports/generateur-scientifique"
          element={
            <ProtectedRoute>
              <ScientificGenerator />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            STATISTIQUES
        ------------------------------------------------------- */}

        <Route
          path="statistiques"
          element={
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            PROFIL
        ------------------------------------------------------- */}

        <Route
          path="profil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            PARAMÈTRES
        ------------------------------------------------------- */}

        <Route
          path="parametres"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* -------------------------------------------------------
            AUTRES FONCTIONNALITÉS
        ------------------------------------------------------- */}

        <Route
          path="premium"
          element={
            <ProtectedRoute>
              <Premium />
            </ProtectedRoute>
          }
        />

        <Route
          path="stockage"
          element={
            <ProtectedRoute>
              <Stockage />
            </ProtectedRoute>
          }
        />

        <Route
          path="support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />

        <Route
          path="favoris"
          element={
            <ProtectedRoute>
              <Favoris />
            </ProtectedRoute>
          }
        />

        <Route
          path="corbeille"
          element={
            <ProtectedRoute>
              <Corbeille />
            </ProtectedRoute>
          }
        />

        {/* Export PDF */}
        <Route
          path="fonctionnalites/export-pdf"
          element={
            <ProtectedRoute>
              <ExportPDF />
            </ProtectedRoute>
          }
        />

        {/* Word → LaTeX */}
        <Route
          path="fonctionnalites/word-latex"
          element={
            <ProtectedRoute>
              <WordToLatex />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ---------------------------------------------------------
          404
      --------------------------------------------------------- */}

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;
