import { motion } from "framer-motion";
import logoi from "../../../assets/image/logoi.png";

import BackgroundEffects from "./BackgroundEffects";
import FloatingCards from "./FloatingCards";
import HeroButtons from "./HeroButtons";

function Hero() {
  return (
    
    <section id="hero" className="relative overflow-hidden">

      {/* Arrière-plan animé */}
      <BackgroundEffects />

      <div className="relative mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-between gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:min-h-[90vh] lg:flex-row lg:gap-16 lg:py-20">

        {/* ========================= */}
        {/* Partie gauche */}
        {/* ========================= */}

        <motion.div
          className="w-full max-w-2xl"
          initial={{
            opacity: 0,
            x: -50,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.8,
          }}
        >

          {/* Badge */}

          <motion.span
            className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-xs font-semibold text-blue-700 shadow sm:px-5 sm:text-sm"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            🚀 Plateforme intelligente pour les étudiants
          </motion.span>

          {/* Titre */}

          <motion.h1
            className="mt-6 text-4xl font-extrabold leading-tight text-gray-900 sm:mt-8 sm:text-5xl lg:text-6xl"
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
              duration: 0.8,
            }}
          >
            Rédigez vos{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              rapports scientifiques
            </span>{" "}
            en quelques minutes.
          </motion.h1>

          {/* Description */}

          <motion.p
            className="mt-8 text-lg leading-8 text-gray-600"
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.4,
              duration: 0.8,
            }}
          >
            Macevo simplifie totalement la rédaction de rapports
            scientifiques grâce à une interface moderne, intuitive et
            intelligente. Plus besoin de maîtriser LaTeX pour produire
            un document professionnel.
          </motion.p>

          {/* Boutons */}

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.6,
              duration: 0.8,
            }}
          >
            <HeroButtons />
          </motion.div>

          {/* Informations */}

          <motion.div
            className="mt-10 flex flex-wrap gap-6 text-sm text-gray-600"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 1,
            }}
          >
            <span>✔ Gratuit pour commencer</span>

            <span>✔ Export PDF rapide</span>

            <span>✔ Compatible LaTeX</span>
          </motion.div>

        </motion.div>

        {/* ========================= */}
        {/* Partie droite */}
        {/* ========================= */}

        <motion.div
            className="relative flex w-full items-center justify-center px-8 sm:px-12 lg:w-auto lg:px-0"
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 1,
          }}
        >

          {/* Halo lumineux */}

          <motion.div
            className="absolute h-[420px] w-[420px] rounded-full bg-blue-400/30 blur-[120px]"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.55, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
          />

          {/* Début de la carte du logo */}
                    <motion.div
            className="relative rounded-3xl bg-white/80 p-10 shadow-2xl backdrop-blur-xl border border-white/40"
            whileHover={{
              y: -8,
              transition: {
                duration: 0.3,
              },
            }}
          >

            {/* Cartes flottantes */}
            <FloatingCards />

            {/* Logo */}
            <motion.img
              src={logoi}
              alt="Logo Macevo"
              className="relative z-10 w-72 md:w-80 lg:w-96 select-none"
              animate={{
                rotate: 360,
                y: [0, -12, 0],
              }}
              transition={{
                rotate: {
                  duration: 18,
                  repeat: Infinity,
                  ease: "linear",
                },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />

          </motion.div>

        </motion.div>

      </div>

    </section>
  );
}

export default Hero;
