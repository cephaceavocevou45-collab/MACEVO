import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, FileEdit, FileText, LoaderCircle, Plus } from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import reportService from "../../../services/reportService";

export default function EditorHome() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    reportService.getReports()
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.results || data?.reports || [];
        if (active) setReports(items.filter((report) => report?.id));
      })
      .catch(() => {
        if (active) setError("Impossible de charger vos rapports. Vérifiez votre connexion puis réessayez.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="flex h-dvh min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Éditeur scientifique</p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Choisir un rapport à modifier</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Sélectionnez un document pour l’ouvrir dans l’éditeur. Vous pouvez aussi démarrer un nouveau rapport.</p>
              </div>
              <button type="button" onClick={() => navigate("/rapports/nouveau")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus size={17} /> Nouveau rapport
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900"><LoaderCircle className="animate-spin" size={18} /> Chargement des rapports…</div>
            ) : error ? (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><AlertCircle className="mt-0.5 shrink-0" size={18} />{error}</div>
            ) : reports.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {reports.map((report) => (
                  <button key={report.id} type="button" onClick={() => navigate(`/rapports/editeur/${report.id}`)} className="group flex min-h-36 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900">
                    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><FileText size={19} /></span>
                    <span className="flex w-full items-center justify-between gap-3 font-semibold"><span className="truncate">{report.title || "Rapport sans titre"}</span><ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" size={17} /></span>
                    <span className="mt-1 text-xs text-slate-500">{report.report_type || report.document_type || "Document académique"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><FileEdit size={21} /></span>
                <h2 className="text-lg font-semibold">Aucun rapport à modifier pour le moment</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Créez un rapport ou choisissez un modèle. Vous pourrez ensuite le retrouver ici pour continuer votre rédaction.</p>
                <button type="button" onClick={() => navigate("/rapports/nouveau")} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} /> Créer un rapport</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
