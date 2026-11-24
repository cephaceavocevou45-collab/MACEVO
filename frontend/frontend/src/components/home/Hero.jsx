import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, FileText, Image, Sigma } from "lucide-react";

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_40%,rgba(37,99,235,.24),transparent_48%),linear-gradient(120deg,#020617,#0f172a_58%,#111827)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[.12] [background-image:linear-gradient(rgba(148,163,184,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.25)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="mx-auto grid min-h-[680px] w-full max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:py-24">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-200"><span className="h-2 w-2 rounded-full bg-blue-400" /> Espace de rédaction académique</span>
          <h1 className="mt-7 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">Donnez une structure claire à vos <span className="text-blue-300">travaux scientifiques.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">Préparez rapports, mémoires et thèses avec des modèles adaptés à votre discipline, votre niveau et aux consignes de votre établissement.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/inscription" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold shadow-lg shadow-blue-950/40 transition hover:bg-blue-500">Créer mon espace <ArrowRight size={17} /></Link>
            <Link to="/#features" className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10">Découvrir les outils</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><BookOpen size={16} className="text-blue-300" /> Rapports, mémoires et thèses</span><span className="inline-flex items-center gap-2"><FileText size={16} className="text-blue-300" /> Modèles et document vierge</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .65, delay: .12 }} className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-blue-500/10 blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-sm font-semibold">Espace de rédaction</p><p className="mt-1 text-xs text-slate-400">Structure académique</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">Brouillon</span></div>
            <div className="grid min-h-[335px] grid-cols-[150px_1fr] sm:grid-cols-[185px_1fr]">
              <aside className="border-r border-white/10 bg-slate-950/50 p-4"><p className="mb-4 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Plan du document</p><div className="space-y-3 text-xs">{[["01", "Introduction"], ["02", "Cadre théorique"], ["03", "Méthodologie"], ["04", "Résultats"], ["05", "Discussion"]].map(([n, title], i) => <div key={n} className={`flex gap-2 rounded-lg px-2 py-2 ${i === 2 ? "bg-blue-500/10 text-blue-200" : "text-slate-400"}`}><span className="font-mono text-[10px] opacity-70">{n}</span><span>{title}</span></div>)}</div></aside>
              <div className="bg-[#f8fafc] p-5 text-slate-800 sm:p-7"><div className="mx-auto max-w-[270px] space-y-4 rounded-sm bg-white p-5 shadow-md sm:p-7"><div className="mx-auto h-1 w-12 rounded bg-blue-600"/><p className="text-center text-[9px] font-semibold uppercase tracking-[.18em] text-slate-500">Mémoire de recherche</p><h2 className="text-center text-base font-bold leading-snug">Analyse et présentation d’un travail scientifique</h2><div className="mx-auto h-px w-12 bg-slate-200"/><p className="text-[9px] leading-relaxed text-slate-500">La question de recherche, les objectifs et la méthode guident la construction de chaque chapitre.</p><div className="space-y-1.5"><div className="h-1.5 rounded bg-slate-100"/><div className="h-1.5 rounded bg-slate-100"/><div className="h-1.5 w-4/5 rounded bg-slate-100"/></div><div className="grid grid-cols-2 gap-2 pt-1"><div className="flex items-center gap-1.5 rounded-md bg-blue-50 p-2 text-[8px] text-blue-800"><Image size={12}/> Figures documentées</div><div className="flex items-center gap-1.5 rounded-md bg-indigo-50 p-2 text-[8px] text-indigo-800"><Sigma size={12}/> Équations</div></div><p className="border-t border-slate-100 pt-2 text-center text-[8px] text-slate-400">Aperçu illustratif — le contenu dépend du projet</p></div></div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-slate-400"><span>Plan, rédaction et mise en forme</span><span className="text-slate-300">MACEVO</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
