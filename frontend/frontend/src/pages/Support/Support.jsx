import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { ArrowRight, BookOpen, Check, ChevronDown, ChevronUp, CircleHelp, FileText, LifeBuoy, Loader2, Mail, Search, Send, Sparkles, Workflow } from "lucide-react";

const faqs = [
  { category: "Création", question: "Comment démarrer un mémoire ou une thèse ?", answer: "Ouvrez Nouveau rapport et choisissez un parcours guidé, un modèle ou un document vierge. Les trois options ouvrent ensuite le même éditeur scientifique." },
  { category: "Création", question: "Où saisir les règles de mon établissement ?", answer: "Dans le parcours guidé, le catalogue de modèles ou les informations du document vierge, ajoutez les consignes et, si possible, le lien vers la page officielle. Vérifiez toujours les consignes de votre programme." },
  { category: "Éditeur", question: "Comment retrouver mon document ?", answer: "Vos documents enregistrés sont accessibles depuis Mes rapports. Ouvrez un rapport pour continuer sa rédaction dans l’éditeur." },
  { category: "Éditeur", question: "Comment exporter mon travail ?", answer: "Dans l’éditeur, utilisez les commandes d’export disponibles dans la barre d’outils. Le rendu dépend du format et des options proposés pour votre document." },
  { category: "Modèles", question: "Un modèle est-il obligatoire ?", answer: "Non. Le document vierge vous permet de partir sans plan ni contenu prérempli. Vous pourrez ajouter vos propres titres dans l’éditeur." },
  { category: "Compte", question: "Comment modifier mes informations de compte ?", answer: "Ouvrez Profil pour vos informations personnelles ou Paramètres pour vos préférences de compte." },
];

const categories = [
  { name: "Création", description: "Commencer un mémoire, un rapport ou une thèse.", icon: Sparkles, query: "démarrer mémoire thèse" },
  { name: "Éditeur", description: "Rédiger, retrouver et exporter un document.", icon: FileText, query: "éditeur document exporter" },
  { name: "Modèles", description: "Choisir une structure et appliquer vos consignes.", icon: Workflow, query: "modèle consignes établissement" },
  { name: "Compte", description: "Gérer votre profil et vos préférences.", icon: CircleHelp, query: "compte profil paramètres" },
];

export default function Support() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [ticket, setTicket] = useState({ category: "document", subject: "", message: "" });
  const [tickets, setTickets] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [ticketHistoryError, setTicketHistoryError] = useState("");
  const [ticketNotice, setTicketNotice] = useState("");

  useEffect(() => {
    let active = true;
    api.get("supports/tickets/")
      .then(({ data }) => { if (active && Array.isArray(data)) setTickets(data); })
      .catch(() => { if (active) setTicketHistoryError("Historique momentanément indisponible."); });
    return () => { active = false; };
  }, []);

  const submitTicket = async (event) => {
    event.preventDefault();
    setTicketError("");
    setTicketNotice("");
    setTicketLoading(true);
    try {
      const { data } = await api.post("supports/tickets/", {
        category: ticket.category,
        subject: ticket.subject.trim(),
        message: ticket.message.trim(),
      });
      setTickets((current) => [data, ...current]);
      setTicket({ category: "document", subject: "", message: "" });
      setTicketNotice("Votre demande a bien été enregistrée. L’équipe MACEVO peut maintenant la consulter.");
    } catch (error) {
      const details = error?.response?.data;
      const message = details?.message?.[0] || details?.subject?.[0] || details?.category?.[0] || details?.detail;
      setTicketError(message || "La demande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.");
    } finally {
      setTicketLoading(false);
    }
  };
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    return faqs.filter((faq) => !query || `${faq.category} ${faq.question} ${faq.answer}`.toLocaleLowerCase("fr").includes(query));
  }, [searchQuery]);

  return (
    <div className="macevo-premium-canvas flex h-screen overflow-hidden text-slate-900 dark:text-slate-100"><Sidebar/><div className="flex min-w-0 flex-1 flex-col overflow-hidden"><Navbar/>
      <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-8 overflow-y-auto px-5 py-7 md:px-10 md:py-10">
        <section className="macevo-premium-hero relative isolate overflow-hidden rounded-[28px] p-7 text-white md:p-10">
          <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-100"><LifeBuoy size={14}/> CENTRE D’AIDE MACEVO</span><h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">On vous aide à avancer.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80">Trouvez une réponse rapidement ou explorez les guides pour chaque étape de votre travail scientifique.</p></div>
            <label className="relative block"><span className="sr-only">Rechercher dans l’aide</span><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setOpenFaq(0); }} placeholder="Ex. commencer une thèse, exporter…" className="w-full rounded-2xl border border-white/20 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-lg outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-cyan-300/30"/></label>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{categories.map(({name, description, icon: Icon, query}) => <button key={name} onClick={() => { setSearchQuery(query); setOpenFaq(0); }} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/50 dark:text-blue-300"><Icon size={19}/></span><span className="mt-4 block font-bold text-slate-900 dark:text-white">{name}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">Voir les réponses <ArrowRight size={13}/></span></button>)}</section>

        <section id="support-faq" className="grid gap-6 scroll-mt-20 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-7"><div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Centre de connaissances</p><h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Questions fréquentes</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 dark:bg-slate-800">{filteredFaqs.length} résultat{filteredFaqs.length > 1 ? "s" : ""}</span></div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">{filteredFaqs.map((faq, index) => <article key={faq.question} className="py-1"><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-4 text-left"><span><span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-blue-600">{faq.category}</span><span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{faq.question}</span></span>{openFaq === index ? <ChevronUp size={17} className="shrink-0 text-blue-600"/> : <ChevronDown size={17} className="shrink-0 text-slate-400"/>}</button>{openFaq === index && <p className="max-w-3xl pb-5 pr-8 text-sm leading-6 text-slate-500 dark:text-slate-400">{faq.answer}</p>}</article>)}{filteredFaqs.length === 0 && <div className="py-12 text-center"><Search className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Aucun article trouvé</p><p className="mt-1 text-xs text-slate-500">Essayez un autre mot-clé ou contactez l’équipe.</p><button onClick={() => setSearchQuery("")} className="mt-3 text-xs font-semibold text-blue-600">Effacer la recherche</button></div>}</div>
          </div>

          <aside className="space-y-4"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"><BookOpen size={20}/></span><h2 className="mt-4 font-bold text-slate-900 dark:text-white">Continuer dans MACEVO</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Reprenez votre projet ou explorez les outils utiles à votre recherche.</p><button onClick={() => navigate("/dashboard")} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"><Check size={15}/>Retour à l’accueil</button></div>
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 dark:border-blue-900/60 dark:bg-blue-950/20"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-900"><CircleHelp size={19}/></span><h3 className="mt-4 font-bold text-slate-900 dark:text-white">Besoin d’un coup de main ?</h3><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">Consultez les réponses rapides ou envoyez une demande à l’équipe MACEVO.</p><button onClick={() => { setSearchQuery(""); setOpenFaq(0); document.getElementById("support-faq")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">Voir les réponses <ArrowRight size={14}/></button></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40"><Mail size={18}/></span><div><p className="text-sm font-bold text-slate-900 dark:text-white">Contacter l’équipe</p><p className="text-xs text-slate-500">Votre demande reste liée à votre compte.</p></div></div>
              <form onSubmit={submitTicket} className="mt-4 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Sujet de la demande<input required minLength={5} maxLength={160} value={ticket.subject} onChange={(event) => setTicket((current) => ({ ...current, subject: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950" placeholder="Ex. export PDF de mon mémoire"/></label>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Catégorie<select value={ticket.category} onChange={(event) => setTicket((current) => ({ ...current, category: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal dark:border-slate-700 dark:bg-slate-950"><option value="document">Document et modèles</option><option value="editor">Éditeur et export</option><option value="academic">Consignes académiques</option><option value="account">Compte</option><option value="other">Autre demande</option></select></label>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Détails<textarea required minLength={20} maxLength={5000} rows={4} value={ticket.message} onChange={(event) => setTicket((current) => ({ ...current, message: event.target.value }))} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal leading-5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950" placeholder="Décrivez le problème et l’étape où il survient…"/></label>
                {ticketError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{ticketError}</p>}
                {ticketNotice && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{ticketNotice}</p>}
                <button type="submit" disabled={ticketLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60">{ticketLoading ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}Envoyer la demande</button>
                <p className="text-[10px] leading-4 text-slate-500">N’incluez pas de mot de passe ni de donnée personnelle sensible dans votre message.</p>
              </form>
              {(tickets.length > 0 || ticketHistoryError) && <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800"><h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Mes demandes précédentes</h3>{ticketHistoryError && <p role="status" className="mt-2 text-xs text-slate-500">{ticketHistoryError}</p>}{tickets.slice(0, 3).map((item) => <article key={item.id} className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950/70"><div className="flex items-start justify-between gap-3"><span className="min-w-0 font-medium text-slate-700 dark:text-slate-200">{item.subject}</span><span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] text-slate-500 dark:bg-slate-800">{item.status === "resolved" ? "Résolue" : item.status === "in_progress" ? "En cours" : "Ouverte"}</span></div>{item.response && <div className="mt-2 border-l-2 border-blue-400 pl-2.5 leading-5 text-slate-600 dark:text-slate-300"><strong className="block text-[10px] uppercase tracking-wide text-blue-700 dark:text-blue-300">Réponse de l’équipe</strong>{item.response}</div>}</article>)}</div>}
            </div>
          </aside>
        </section>
      </main>
    </div></div>
  );
}
