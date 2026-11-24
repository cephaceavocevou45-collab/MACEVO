import { useState } from "react";
import { Star, MoreVertical, Heart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function Favoris() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Rapports");

  const [favorites, setFavorites] = useState([
    { 
      id: 1, 
      title: "Mémoire IA et Éducation", 
      subtitle: "Mémoire de Licence", 
      date: "Modifié le 17 mai 2004", 
      type: "Rapports",
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40"
    },
    { 
      id: 2, 
      title: "Rapport de Stage - Technosoft", 
      subtitle: "Rapport de stage", 
      date: "Modifié le 16 mai 2004", 
      type: "Rapports",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
    },
    { 
      id: 3, 
      title: "Article IMRAD - Deep Learning", 
      subtitle: "Article scientifique", 
      date: "Modifié le 15 mai 2004", 
      type: "Rapports",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40"
    },
    { 
      id: 4, 
      title: "Thèse de Doctorat", 
      subtitle: "Thèse", 
      date: "Modifié le 10 mai 2004", 
      type: "Rapports",
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
    },
    { 
      id: 5, 
      title: "Projet de fin d'études - PFE", 
      subtitle: "Projet de fin d'études", 
      date: "Modifié le 8 mai 2004", 
      type: "Rapports",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
    },
    { 
      id: 6, 
      title: "Notes de Cours - Statistiques", 
      subtitle: "Notes de cours", 
      date: "Modifié le 5 mai 2004", 
      type: "Rapports",
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
    },
  ]);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(item => item.id !== id));
  };

  const filteredFavorites = favorites.filter(item => item.type === activeTab);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="w-full space-y-6">
            
            {/* En-tête */}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Favoris
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Vos rapports et modèles favoris pour un accès rapide.
              </p>
            </div>

            {/* Onglets (Rapports / Modèles) */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-8 text-xs font-bold">
              <button
                onClick={() => setActiveTab("Rapports")}
                className={`pb-3 relative transition cursor-pointer ${
                  activeTab === "Rapports"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Rapports
                {activeTab === "Rapports" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("Modèles")}
                className={`pb-3 relative transition cursor-pointer ${
                  activeTab === "Modèles"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Modèles
                {activeTab === "Modèles" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Grille de cartes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFavorites.length > 0 ? (
                filteredFavorites.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-blue-500/50 transition flex flex-col justify-between space-y-6 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${item.color}`}>
                        <Star size={20} className="fill-current" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => removeFavorite(item.id)}
                          title="Retirer des favoris"
                          className="text-amber-500 hover:scale-110 transition cursor-pointer"
                        >
                          <Star size={16} className="fill-amber-500" />
                        </button>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition cursor-pointer">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                      <p className="text-[11px] text-slate-400 pt-2">{item.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <Star className="mx-auto text-slate-300 dark:text-slate-700" size={40} />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Aucun élément dans {activeTab.toLowerCase()}</p>
                  <p className="text-xs text-slate-400">Ajoutez des éléments à vos favoris pour les retrouver ici.</p>
                </div>
              )}
            </div>

            {/* Bannière du bas */}
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center shrink-0">
                  <Heart size={20} className="fill-red-500/20" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ajoutez des rapports ou modèles à vos favoris</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Retrouvez-les facilement ici pour gagner du temps.</p>
                </div>
              </div>

              <button
                onClick={() => navigate("/modeles")}
                className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-blue-600 dark:text-blue-400 font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
              >
                Découvrir des modèles <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}