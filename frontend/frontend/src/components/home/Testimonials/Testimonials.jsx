import { motion } from "framer-motion";
import { Star } from "lucide-react";

function Testimonials() {
  const testimonials = [
    {
      name: "Programme Bêta",
      role: "Étudiants & Chercheurs",
      message:
        "Macevo a été pensé pour simplifier la rédaction scientifique grâce à une interface intuitive et moderne.",
    },
    {
      name: "Version Professionnelle",
      role: "Rapports scientifiques",
      message:
        "Créez des rapports de qualité professionnelle sans avoir besoin de maîtriser LaTeX.",
    },
    {
      name: "Objectif Macevo",
      role: "Innovation",
      message:
        "Notre ambition est d'offrir une plateforme rapide, élégante et intelligente pour tous les étudiants.",
    },
  ];

  return (
    <section className="bg-white py-24">

      <div className="mx-auto max-w-7xl px-6">

        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .7 }}
        >

          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">
            Ils feront confiance à Macevo
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-gray-900 lg:text-5xl">
            Une plateforme créée pour ses utilisateurs.
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Les témoignages réels apparaîtront progressivement après le lancement
            officiel de Macevo.
          </p>

        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {testimonials.map((item, index) => (

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
                y: -8,
              }}
              className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl"
            >

              <div className="mb-6 flex">

                {[1,2,3,4,5].map((star)=>(
                  <Star
                    key={star}
                    size={20}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}

              </div>

              <p className="leading-8 text-gray-600">

                "{item.message}"

              </p>

              <div className="mt-8">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-xl font-bold text-white">

                    {item.name.charAt(0)}

                  </div>

                  <div>

                    <h3 className="font-bold text-gray-900">

                      {item.name}

                    </h3>

                    <p className="text-sm text-gray-500">

                      {item.role}

                    </p>

                  </div>

                </div>

              </div>

            </motion.div>

          ))}

        </div>

      </div>

    </section>
  );
}

export default Testimonials;