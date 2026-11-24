import { useNavigate } from "react-router-dom";
import { ArrowRight, FilePlus2, Layers3, Sparkles, WandSparkles, Check, Clock3 } from "lucide-react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const choices = [
  { title: "Nouveau rapport", eyebrow: "GUIDÉ PAS À PAS", description: "Définissez votre sujet, votre contexte et vos préférences. MACEVO vous proposera un plan entièrement modifiable.", action: "Commencer le parcours", icon: WandSparkles, to: "/rapports/nouveau", color: "blue", time: "5 étapes" },
  { title: "Choisir un modèle", eyebrow: "BIBLIOTHÈQUE", description: "Partez d’une structure existante et adaptez-la à votre niveau, votre discipline et vos consignes.", action: "Explorer les modèles", icon: Layers3, to: "/rapports/templates", color: "violet", time: "Aperçu immédiat" },
  { title: "Document vierge", eyebrow: "LIBERTÉ TOTALE", description: "Ouvrez l’éditeur sans plan ni texte prérempli. Vous ajoutez seulement ce dont vous avez besoin.", action: "Ouvrir un document vierge", icon: FilePlus2, to: "/rapports/document-vierge", color: "teal", time: "Démarrage direct" },
];

export default function StartReport() {
  const navigate = useNavigate();
  return (
    <div className="macevo-premium-canvas flex h-screen overflow-hidden text-slate-900 dark:text-slate-100"><Sidebar /><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><Navbar />
      <main className="flex-1 overflow-y-auto px-5 py-7 md:px-10 md:py-10 max-w-[1440px] mx-auto w-full space-y-8">
        <section className="macevo-premium-hero relative isolate overflow-hidden rounded-[28px] px-7 py-9 md:px-11 md:py-12 text-white">
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-blue-100"><Sparkles size={14} /> ESPACE DE CRÉATION</span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">Chaque grand travail commence par un bon cadre.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">Choisissez comment démarrer. Votre document s’ouvrira ensuite dans le même éditeur scientifique, prêt à évoluer avec votre recherche.</p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300"><span className="inline-flex items-center gap-2"><Check size={14} className="text-emerald-300"/>Modifiable à tout moment</span><span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-300"/>Vos consignes restent prioritaires</span></div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-600">Choisir un parcours</p><h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">Quel est votre point de départ ?</h2></div><span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex"><Clock3 size={14}/> Vous pourrez changer d’avis dans l’éditeur</span></div>
          <div className="grid gap-4 xl:grid-cols-3">
            {choices.map(({ title, eyebrow, description, action, icon: Icon, to, color, time }, index) => (
              <button key={to} onClick={() => navigate(to)} className="group relative flex min-h-[290px] flex-col rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 md:p-7">
                <div className="flex w-full items-start justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300" : color === "violet" ? "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300" : "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"}`}><Icon size={22}/></span><span className="text-[11px] font-bold text-slate-300">0{index + 1}</span></div>
                <span className="mt-6 text-[10px] font-bold tracking-[.15em] text-slate-400">{eyebrow}</span><h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
                <div className="mt-auto flex w-full items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800"><span className="text-xs text-slate-400">{time}</span><span className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 transition group-hover:gap-3">{action}<ArrowRight size={15}/></span></div>
              </button>
            ))}
          </div>
        </section>

      </main>
    </div></div>
  );
}
