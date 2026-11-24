import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

function Stats() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const stats = [
    {
      value: 500,
      suffix: "+",
      label: "Rapports créés",
    },
    {
      value: 120,
      suffix: "+",
      label: "Étudiants actifs",
    },
    {
      value: 30,
      suffix: "+",
      label: "Modèles disponibles",
    },
    {
      value: 99,
      suffix: "%",
      label: "Satisfaction",
    },
  ];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 py-24"
    >
      {/* Décor */}

      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>

      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl px-6">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .7 }}
          className="mb-16 text-center"
        >
          <span className="rounded-full bg-white/20 px-5 py-2 text-sm font-semibold text-white backdrop-blur">
            Macevo en chiffres
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Une plateforme pensée pour la réussite.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
            Chaque jour, Macevo aide les étudiants à produire
            des rapports scientifiques plus rapidement et avec
            une qualité professionnelle.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {stats.map((stat, index) => (

            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 50,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: .6,
                delay: index * .15,
              }}
              whileHover={{
                scale: 1.05,
              }}
              className="rounded-3xl bg-white/10 p-10 text-center shadow-xl backdrop-blur"
            >

              <div className="text-5xl font-extrabold text-white">

                {inView && (

                  <CountUp
                    end={stat.value}
                    duration={2.5}
                  />

                )}

                {stat.suffix}

              </div>

              <p className="mt-4 text-lg font-medium text-blue-100">
                {stat.label}
              </p>

            </motion.div>

          ))}

        </div>

      </div>
    </section>
  );
}

export default Stats;