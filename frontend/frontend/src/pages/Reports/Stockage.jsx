import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardDrive, Sparkles, Cloud, Trash2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function Stockage() {
  const navigate = useNavigate();
  const [storageData] = useState({
    used: 4.2, // en GB
    total: 10, // en GB
    breakdown: [
      { type: "Rapports LaTeX & Documents", size: "2.8 GB", percentage: 65, color: "bg-blue-600" },
      { type: "Fichiers Médias & Images", size: "1.1 GB", percentage: 25, color: "bg-emerald-500" },
      { type: "Autres & Cache", size: "0.3 GB", percentage: 10, color: "bg-amber-500" }
    ]
  });

  const percentageUsed = Math.round((storageData.used / storageData.total) * 100);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117] overflow-hidden select-none">
      {/* Barre latérale intégrée */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* En-tête */}
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <HardDrive className="text-blue-600" size={28} /> Gestion du Stockage
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Surveillez l'utilisation de votre espace cloud et libérez de l'espace si nécessaire.
            </p>
          </div>

          {/* Carte principale de jauge */}
          <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-6 lg:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Espace utilisé</p>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {storageData.used} GB <span className="text-base font-normal text-slate-400">/ {storageData.total} GB ({percentageUsed}%)</span>
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => navigate("/premium")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-2xl text-xs transition flex items-center gap-2 shadow-sm"
              >
                <Sparkles size={16} /> Passer à 100 GB (Premium)
              </button>
            </div>

            {/* Barre de progression visuelle */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: '65%' }} title="Rapports LaTeX"></div>
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: '25%' }} title="Médias"></div>
              <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: '10%' }} title="Autres"></div>
            </div>

            {/* Légende */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {storageData.breakdown.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.type}</p>
                    <p className="text-[11px] text-slate-400">{item.size} ({item.percentage}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Conseils / Nettoyage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Cloud className="text-blue-600" size={18} /> Synchronisation Cloud
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Vos documents et projets MACEVO AI sont sauvegardés en temps réel et sécurisés sur nos serveurs chiffrés.
              </p>
            </div>

            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Trash2 className="text-red-500" size={18} /> Optimisation rapide
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Pensez à vider régulièrement votre corbeille pour récupérer de l'espace disque instantanément.
              </p>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
