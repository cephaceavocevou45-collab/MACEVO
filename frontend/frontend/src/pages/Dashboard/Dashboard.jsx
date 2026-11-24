import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  FileText, CheckCircle, Calendar, PlusCircle, 
  Upload, HardDrive, ArrowRight, MoreHorizontal, 
  FolderKanban, Star, FileCode2, FileCode, ShieldCheck
} from "lucide-react";

import api from "../../api/axios";
import reportService from "../../services/reportService";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import StatsCard from "../../components/StatsCard";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState({
    total_reports: 0,
    draft_reports: 0,
    completed_reports: 0,
    reports_today: 0,
    storage_used: "0 GB",
    storage_total: "100 GB",
    storage_percent: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get("dashboard/stats/");
      setStats(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }

    try {
      const data = await reportService.getReports();
      const reports = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];
      setRecentReports(
        reports.slice(0, 5).map((report) => ({
          id: report.id,
          title: report.title || "Rapport sans titre",
          type: String(report.document_type || report.report_type || "Rapport").slice(0, 12),
          date: report.updated_at
            ? new Date(report.updated_at).toLocaleDateString()
            : "Date non renseignée",
          status: report.status === "completed" ? "Terminé" : "En cours",
          color: report.status === "completed"
            ? "bg-emerald-50 text-emerald-600"
            : "bg-blue-50 text-blue-600",
        }))
      );
    } catch (error) {
      console.error("Impossible de charger les rapports récents.", error);
    }
  };

  const [recentReports, setRecentReports] = useState([]);
  const recentActivities = [];

  const filteredRecentReports = recentReports.filter((report) =>
    report.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  if (loading) {
    return (
      <div className="macevo-premium-canvas flex min-h-screen items-center justify-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {t("dashboard.loading", "Chargement...")}
        </h2>
      </div>
    );
  }

  return (
    <div className="macevo-premium-canvas flex h-dvh min-h-screen overflow-hidden font-sans text-slate-800 dark:text-slate-100">
      <Sidebar 
        storageUsed={stats.storage_used} 
        storageTotal={stats.storage_total} 
        storagePercent={stats.storage_percent} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <main className="flex-1 overflow-y-auto p-4 pb-8 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          
          {/* En-tête */}
          <div className="macevo-premium-hero relative isolate flex flex-col overflow-hidden rounded-[28px] p-7 text-white md:flex-row md:items-center md:justify-between md:gap-8 md:p-9">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-blue-100">Espace de recherche</span>
              <h2 className="mt-4 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white">
                Bienvenue sur MACEVO
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                Votre espace de recherche est prêt. Retrouvez vos travaux ou commencez-en un nouveau.
              </p>
            </div>
            
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <button 
                onClick={() => navigate("/rapports/nouveau")} 
                className="w-full justify-center bg-white hover:bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition sm:w-auto"
              >
                <PlusCircle size={16} /> Créer un nouveau rapport
              </button>
              {/* CORRECTION : Pointe vers la route exacte du routeur */}
              <button 
                onClick={() => navigate("/rapports/import-word")} 
                className="w-full justify-center bg-white/10 border border-white/20 hover:bg-white/15 px-4 py-3 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition backdrop-blur sm:w-auto"
              >
                <Upload size={16} /> Importer un document
              </button>
            </div>
          </div>

          {/* 4 Cartes Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Rapports" 
              value={stats.total_reports} 
              subtitle="Total de documents" 
              icon={<FileText size={22} />} 
              iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-950/40" 
            />
            <StatsCard 
              title="Terminés" 
              value={stats.completed_reports} 
              subtitle="Travaux finalisés" 
              icon={<CheckCircle size={22} />} 
              iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" 
            />
            <StatsCard 
              title="En cours" 
              value={stats.draft_reports} 
              subtitle="Travaux en cours" 
              icon={<Calendar size={22} />} 
              iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-950/40" 
            />
            <StatsCard 
              title="Stockage utilisé" 
              value={stats.storage_used} 
              subtitle={`Sur ${stats.storage_total}`} 
              icon={<HardDrive size={22} />} 
              iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-950/40" 
            />
          </div>

          {/* Grille Centrale */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rapports récents</h3>
                  {filteredRecentReports.length > 0 && (
                    <button onClick={() => navigate("/rapports")} className="text-xs font-semibold text-blue-600 hover:underline">Voir tout</button>
                  )}
                </div>

                {filteredRecentReports.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredRecentReports.map((report) => (
                      <div key={report.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[10px] uppercase ${report.color}`}>
                            {report.type}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white">{report.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{report.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            report.status === 'Terminé' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                          }`}>
                            {report.status}
                          </span>
                          <button type="button" onClick={() => navigate(`/rapports/${report.id}`)} aria-label={`Ouvrir ${report.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-800"><MoreHorizontal size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <FileCode className="mx-auto text-slate-300 dark:text-slate-700" size={40} />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aucun rapport récent</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Vous n'avez pas encore créé ou importé de documents. Vos futurs travaux apparaîtront ici.
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/rapports/nouveau")}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-xs font-semibold rounded-xl hover:bg-blue-100 transition"
                    >
                      Créer un rapport <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Activité récente</h3>
                  {recentActivities.length > 0 && (
                    <button onClick={() => navigate("/rapports")} className="text-xs font-semibold text-blue-600 hover:underline">Voir tout</button>
                  )}
                </div>

                {recentActivities.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {recentActivities.map((act) => {
                      const IconComp = act.icon;
                      return (
                        <div key={act.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${act.color}`}>
                              <IconComp size={16} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-800 dark:text-white font-medium">
                                {act.text} <span className="font-bold text-slate-900 dark:text-slate-200">"{act.target}"</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">{act.time}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aucune activité récente</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Vos actions et modifications s'afficheront ici au fur et à mesure que vous utiliserez la plateforme.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Actions rapides (Bas de page) */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              
              <button type="button" onClick={() => navigate("/rapports/nouveau")} className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-blue-500 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 flex items-center justify-center"><FileText size={18} /></div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Nouveau rapport</span>
              </button>

              <button type="button" onClick={() => navigate("/rapports/templates")} className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-blue-500 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 flex items-center justify-center"><FolderKanban size={18} /></div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Parcourir les modèles</span>
              </button>

              {/* CORRECTION : Pointe vers /rapports/import-word */}
              <button type="button" onClick={() => navigate("/rapports/import-word")} className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-blue-500 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 flex items-center justify-center"><Upload size={18} /></div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Importer un document</span>
              </button>

              {/* CORRECTION : Pointe vers /fonctionnalites/word-latex */}
              <button type="button" onClick={() => navigate("/fonctionnalites/word-latex")} className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-blue-500 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 flex items-center justify-center"><FileCode2 size={18} /></div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Word → LaTeX</span>
              </button>

              <button type="button" onClick={() => navigate("/favoris")} className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-blue-500 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/40 flex items-center justify-center"><Star size={18} /></div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mes favoris</span>
              </button>

            </div>
          </div>

          <aside className="flex flex-col gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100 sm:flex-row sm:items-center">
            <ShieldCheck size={18} className="shrink-0 text-amber-600 dark:text-amber-300" />
            <p><strong>Règles académiques :</strong> elles peuvent varier selon le programme et l’établissement, même au sein d’un pays. Ajoutez les consignes locales et leur source pour garder votre document aligné sur les exigences reçues.</p>
          </aside>
        </main>
      </div>
    </div>
  );
}

