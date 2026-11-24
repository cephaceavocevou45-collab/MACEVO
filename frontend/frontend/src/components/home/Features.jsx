import {
  FileText,
  PencilLine,
  Download,
  RefreshCcw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function Features() {
  const features = [
    {
      title: "Rapports LaTeX",
      description: "Accédez à des modèles de rapports scientifiques prêts à être utilisés.",
      icon: FileText,
      path: "/rapports/modeles-latex",
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Éditeur Intuitif",
      description: "Modifiez facilement vos rapports sans écrire une seule ligne de code LaTeX.",
      icon: PencilLine,
      path: "/inscription",
      color: "from-indigo-500 to-purple-600",
    },
    {
      title: "Export PDF",
      description: "Préparez un document structuré, puis choisissez un format d’export disponible dans votre espace.",
      icon: Download,
      path: "/fonctionnalites/export-pdf",
      color: "from-cyan-500 to-blue-600",
    },
    {
      title: "Word → LaTeX",
      description: "Accédez à l’outil de conversion Word vers LaTeX et reprenez le résultat dans votre espace.",
      icon: RefreshCcw,
      path: "/fonctionnalites/word-latex",
      color: "from-violet-500 to-indigo-600",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Importez ou Créez",
      description: "Démarrez avec un modèle, un document vierge ou un fichier Word.",
    },
    {
      num: "02",
      title: "Structurez votre travail",
      description: "Organisez votre plan et vos contenus avec les outils disponibles dans l’éditeur.",
    },
    {
      num: "03",
      title: "Relisez la mise en forme",
      description: "Vérifiez les sections, les éléments scientifiques et la cohérence du document avant l’export.",
    },
    {
      num: "04",
      title: "Exportez & Validez",
      description: "Exportez votre document et vérifiez les exigences de dépôt de votre établissement.",
    },
  ];

  return (
    <>
      {/* SECTION 1 : Fonctionnalités */}
      <section id="features" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white py-24">
        <div className="w-full max-w-[96%] mx-auto px-4 sm:px-8">
          <motion.div
            className="mx-auto mb-16 max-w-3xl text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Fonctionnalités
            </span>
            <h2 className="mt-6 text-4xl font-extrabold text-slate-900 lg:text-5xl">
              Tout ce qu'il vous faut pour réussir vos rapports
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              MACEVO rassemble tous les outils essentiels pour créer, modifier, convertir et exporter vos rapports scientifiques dans une interface moderne et intuitive.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  <Link
                    to={feature.path}
                    className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50 backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-300"
                  >
                    <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${feature.color} shadow-lg`}>
                      <Icon size={32} className="text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                    </div>
                    <h3 className="mb-4 text-2xl font-bold text-slate-900">{feature.title}</h3>
                    <p className="flex-grow leading-7 text-slate-600">{feature.description}</p>
                    <div className="mt-8 flex items-center gap-2 font-semibold text-blue-600">
                      Découvrir
                      <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-2" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2 : À PROPOS */}
      <section id="about" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-[96%] mx-auto px-4 sm:px-8 relative z-10">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/20 mb-6">
              <Sparkles size={14} /> Notre Philosophie
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-6">
              À propos : Née d'un besoin universitaire concret
            </h2>
            <p className="text-lg leading-relaxed text-slate-300">
              <strong className="text-white font-semibold">MACEVO</strong> est conçue par une équipe qui a vécu les nuits blanches passées à formater des mémoires. Notre mission est simple : <span className="text-blue-400 font-medium">que la mise en forme ne soit plus jamais un obstacle entre un étudiant et la validation de son diplôme.</span>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 : COMMENT ÇA MARCHE */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-[96%] mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              Processus
            </span>
            <h2 className="mt-6 text-4xl font-extrabold text-slate-900">
              Comment ça marche ?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Quatre étapes simples pour transformer vos notes en document académique d'excellence.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={idx} className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-8 shadow-sm hover:shadow-md transition">
                <span className="text-4xl font-black text-blue-600/20 font-mono mb-4 block">{step.num}</span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

export default Features;

