import { motion } from "framer-motion";

import {
  FileText,
  PencilLine,
  Eye,
  Download,
} from "lucide-react";

function HowItWorks() {

  const steps = [

    {
      number: "01",
      title: "Choisissez un modèle",
      description:
        "Sélectionnez un modèle de rapport scientifique adapté à votre projet.",
      icon: FileText,
    },

    {
      number: "02",
      title: "Modifiez votre document",
      description:
        "Remplissez facilement les différentes sections grâce à un éditeur intuitif.",
      icon: PencilLine,
    },

    {
      number: "03",
      title: "Prévisualisez",
      description:
        "Visualisez immédiatement le rendu de votre rapport avant son exportation.",
      icon: Eye,
    },

    {
      number: "04",
      title: "Exportez en PDF",
      description:
        "Téléchargez votre rapport final au format PDF professionnel en un seul clic.",
      icon: Download,
    },

  ];

  return (

    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-24">

      {/* Décor */}

      <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl"></div>

      <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl px-6">

        {/* Titre */}

        <motion.div

          initial={{
            opacity:0,
            y:40,
          }}

          whileInView={{
            opacity:1,
            y:0,
          }}

          viewport={{
            once:true,
          }}

          transition={{
            duration:.7,
          }}

          className="mx-auto max-w-3xl text-center"

        >

          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">

            Comment ça fonctionne ?

          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-gray-900 lg:text-5xl">

            Créez votre rapport en seulement
            quelques étapes.

          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-600">

            Macevo simplifie totalement la création de rapports scientifiques.
            Quelques clics suffisent pour obtenir un document professionnel.

          </p>

        </motion.div>

        {/* Timeline */}

        <div className="relative mt-24">

          {/* Ligne verticale */}

          <div className="absolute left-8 top-0 hidden h-full w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 lg:block"></div>

          <div className="space-y-12">

            {steps.map((step, index) => {

              const Icon = step.icon;

              return (

                <motion.div

                  key={index}

                  initial={{
                    opacity:0,
                    x:80,
                  }}

                  whileInView={{
                    opacity:1,
                    x:0,
                  }}

                  viewport={{
                    once:true,
                  }}

                  transition={{
                    duration:.6,
                    delay:index*.15,
                  }}

                  className="relative flex flex-col gap-6 lg:flex-row lg:items-center"

                >

                  {/* Cercle */}
                                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">

                    <Icon size={30} />

                  </div>

                  {/* Carte */}

                  <motion.div

                    whileHover={{
                      y: -6,
                      scale: 1.01,
                    }}

                    className="flex-1 rounded-3xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300"

                  >

                    <div className="mb-3 text-sm font-bold tracking-widest text-blue-600">

                      ÉTAPE {step.number}

                    </div>

                    <h3 className="text-2xl font-bold text-gray-900">

                      {step.title}

                    </h3>

                    <p className="mt-4 leading-8 text-gray-600">

                      {step.description}

                    </p>

                  </motion.div>

                </motion.div>

              );

            })}

          </div>

        </div>

      </div>

    </section>

  );

}

export default HowItWorks;