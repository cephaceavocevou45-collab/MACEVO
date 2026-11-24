import { useState } from "react";
import { Trash2, RotateCcw, FileText, ShieldAlert } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function Corbeille() {
  const [trashItems, setTrashItems] = useState([
    { 
      id: 1, 
      title: "Rapport ancien - Marketing", 
      subtitle: "Rapport de stage", 
      type: "Stage", 
      typeColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
      dateSuppression: "17 mai 2004", 
      expiration: "Dans 13 jours",
      size: "1.2 MB" 
    },
    { 
      id: 2, 
      title: "Mémoire - Version 1", 
      subtitle: "Mémoire de Licence", 
      type: "Mémoire", 
      typeColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
      dateSuppression: "15 mai 2004", 
      expiration: "Dans 11 jours",
      size: "450 KB" 
    },
    { 
      id: 3, 
      title: "Article - Réseaux de neurones", 
      subtitle: "Article scientifique", 
      type: "Article", 
      typeColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/40",
      dateSuppression: "12 mai 2004", 
      expiration: "Dans 8 jours",
      size: "850 KB" 
    },
    { 
      id: 4, 
      title: "PFE - Version finale", 
      subtitle: "Projet de fin d'études", 
      type: "PFE", 
      typeColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
      dateSuppression: "10 mai 2004", 
      expiration: "Dans 6 jours",
      size: "2.1 MB" 
    }
  ]);

  const restoreItem = (id) => {
    setTrashItems(trashItems.filter(item => item.id !== id));
  };

  const deletePermanently = (id) => {
    setTrashItems(trashItems.filter(item => item.id !== id));
  };

  const emptyTrash = () => {
    setTrashItems([]);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Suppression de max-w-6xl mx-auto pour occuper toute la largeur */}
          <div className="w-full space-y-6">
            
            {/* En-tête */}
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Corbeille
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Vos rapports supprimés. Ils seront définitivement supprimés après 30 jours.
              </p>
            </div>

            {/* Tableau principal des éléments supprimés */}
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {trashItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                        <th className="py-3.5 px-6">Nom du rapport</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Supprimé le</th>
                        <th className="py-3.5 px-4">Expiration</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {trashItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                              <FileText size={18} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white line-through opacity-80">
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.typeColor}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                            {item.dateSuppression}
                          </td>
                          <td className="py-4 px-4 text-red-600 dark:text-red-400 font-semibold">
                            {item.expiration}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => restoreItem(item.id)}
                                title="Restaurer"
                                className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                              >
                                <RotateCcw size={15} />
                              </button>
                              <button
                                onClick={() => deletePermanently(item.id)}
                                title="Supprimer définitivement"
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 space-y-3">
                  <Trash2 className="mx-auto text-slate-300 dark:text-slate-700" size={40} />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Votre corbeille est vide</p>
                  <p className="text-xs text-slate-400">Aucun élément supprimé pour le moment.</p>
                </div>
              )}
            </div>

            {/* Bannière du bas */}
            <div className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Les rapports dans la corbeille seront automatiquement supprimés après 30 jours.
                </p>
              </div>

              {trashItems.length > 0 && (
                <button
                  onClick={emptyTrash}
                  className="bg-white dark:bg-[#161b22] border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
                >
                  <Trash2 size={14} /> Vider la corbeille
                </button>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}