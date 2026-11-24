import { motion } from "framer-motion";

import {
  Clock3,
  ShieldCheck,
  Sparkles,
  Cloud,
  FileCheck2,
  Laptop,
} from "lucide-react";

function WhyChoose() {
  const advantages = [
    {
      icon: Clock3,
      title: "Gagnez un temps précieux",
      description:
        "Rédigez vos rapports scientifiques beaucoup plus rapidement grâce à une interface intelligente.",
    },
    {
      icon: FileCheck2,
      title: "Compatible avec LaTeX",
      description:
        "Produisez des rapports professionnels sans avoir besoin de maîtriser le langage LaTeX.",
    },
    {
      icon: Sparkles,
      title: "Assistant intelligent",
      description:
        "Profitez d'outils intelligents pour accélérer votre rédaction et améliorer la qualité de vos documents.",
    },
    {
      icon: Cloud,
      title: "Sauvegarde automatique",
      description:
        "Vos rapports sont enregistrés automatiquement afin d'éviter toute perte de données.",
    },
    {
      icon: ShieldCheck,
      title: "Sécurité de vos données",
      description:
        "Toutes vos informations sont protégées et accessibles uniquement depuis votre espace personnel.",
    },
    {
      icon: Laptop,
      title: "Simple et moderne",
      description:
        "Une interface agréable, intuitive et responsive pensée pour les étudiants, enseignants et chercheurs.",
    },
  ];

  return (
    <section id="why-choose" className="relative overflow-hidden bg-white py-24">

      {/* Fond décoratif */}

      <div className="absolute left-0 top-20 h-80 w-80 rounded-full bg-blue-100 blur-3xl opacity-50"></div>

      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-indigo-100 blur-3xl opacity-50"></div>

      <div className="relative mx-auto max-w-7xl px-6">

        {/* Titre */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .7 }}
          className="mx-auto max-w-3xl text-center"
        >

          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">
            Pourquoi choisir Macevo ?
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-gray-900 lg:text-5xl">
            Une plateforme conçue pour simplifier
            la rédaction scientifique.
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Macevo réunit les meilleurs outils pour permettre aux étudiants,
            enseignants et chercheurs de créer facilement des rapports
            scientifiques modernes, professionnels et conformes aux normes.
          </p>

        </motion.div>

        {/* Contenu */}

        <div className="mt-20 grid items-center gap-16 lg:grid-cols-2">

          {/* Illustration */}

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .8 }}
            className="relative"
          >

            <div className="rounded-[35px] bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white shadow-2xl">

              <h3 className="text-3xl font-bold">
                Travaillez plus intelligemment.
              </h3>

              <p className="mt-5 text-blue-100 leading-8">
                Plus besoin de perdre des heures à apprendre LaTeX ou à
                mettre en forme vos rapports. Macevo automatise les tâches
                répétitives afin que vous puissiez vous concentrer sur
                votre contenu.
              </p>

              <div className="mt-10 rounded-2xl bg-white/10 p-6 backdrop-blur">

                <div className="flex items-center justify-between">

                  <span>Temps économisé</span>

                  <span className="font-bold text-2xl">
                    +80%
                  </span>

                </div>

                <div className="mt-4 h-3 rounded-full bg-white/20">

                  <motion.div
                    className="h-3 rounded-full bg-white"
                    initial={{ width: 0 }}
                    whileInView={{ width: "80%" }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1.5,
                    }}
                  />

                </div>

              </div>

            </div>

          </motion.div>

          {/* Avantages */}

          <div className="grid gap-6">

            {advantages.map((item, index) => {

              const Icon = item.icon;

              return (

                <motion.div
                  key={index}
                  initial={{
                    opacity: 0,
                    x: 50,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: .6,
                    delay: index * .1,
                  }}
                  whileHover={{
                    y: -6,
                  }}
                  className="flex gap-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg transition-all"
                >

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">

                    <Icon
                      size={30}
                      className="text-white"
                    />

                  </div>

                  <div>

                    <h3 className="text-xl font-bold text-gray-900">

                      {item.title}

                    </h3>

                    <p className="mt-2 leading-7 text-gray-600">

                      {item.description}

                    </p>

                  </div>

                </motion.div>

              );

            })}

          </div>

        </div>

      </div>

    </section>
  );
}

export default WhyChoose;