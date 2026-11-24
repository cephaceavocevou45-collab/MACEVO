import { motion } from "framer-motion";

export default function BackgroundEffects() {
  return (
    <>
      {/* Dégradé principal */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-blue-50 via-white to-indigo-100" />

      {/* Grand cercle bleu */}
      <motion.div
        className="absolute -top-40 -left-32 -z-10 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Cercle violet */}
      <motion.div
        className="absolute top-1/3 -right-32 -z-10 h-[420px] w-[420px] rounded-full bg-indigo-300/25 blur-3xl"
        animate={{
          x: [0, -35, 0],
          y: [0, -25, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Cercle cyan */}
      <motion.div
        className="absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Petits points décoratifs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.span
            key={index}
            className="absolute h-2 w-2 rounded-full bg-blue-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Grille discrète */}
      <div
        className="absolute inset-0 -z-20 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #2563eb 1px, transparent 1px),
            linear-gradient(to bottom, #2563eb 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
    </>
  );
}