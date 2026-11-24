import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

function FAQ() {
  const faqs = [
    {
      question: "Qu'est-ce que Macevo ?",
      answer:
        "Macevo est une plateforme qui facilite la rédaction de rapports scientifiques grâce à des modèles, un éditeur intuitif et des outils intelligents.",
    },
    {
      question: "Dois-je connaître LaTeX ?",
      answer:
        "Non. Macevo a été conçu pour permettre à tout utilisateur de créer un rapport professionnel sans écrire une seule ligne de code LaTeX.",
    },
    {
      question: "Puis-je exporter mon rapport en PDF ?",
      answer:
        "Oui. Une fois votre rapport terminé, vous pourrez le compiler et le télécharger en PDF en quelques secondes.",
    },
    {
      question: "Mes documents sont-ils sauvegardés ?",
      answer:
        "Oui. Les rapports sont enregistrés automatiquement afin d'éviter toute perte de données pendant votre travail.",
    },
    {
      question: "Macevo est-il gratuit ?",
      answer:
        "Une version gratuite sera disponible pour permettre à chacun de découvrir la plateforme. Des fonctionnalités avancées pourront être proposées ultérieurement.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-gradient-to-b from-white to-blue-50 py-24">
      <div className="mx-auto max-w-5xl px-6">

        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">
            Questions fréquentes
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-gray-900 lg:text-5xl">
            Vous avez des questions ?
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Retrouvez ici les réponses aux questions les plus fréquentes sur Macevo.
          </p>
        </motion.div>

        <div className="space-y-5">

          {faqs.map((faq, index) => (

            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
              }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md"
            >

              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-lg font-semibold text-gray-900">
                  {faq.question}
                </span>

                <motion.div
                  animate={{
                    rotate: openIndex === index ? 180 : 0,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown />
                </motion.div>

              </button>

              <AnimatePresence>

                {openIndex === index && (

                  <motion.div
                    initial={{
                      height: 0,
                      opacity: 0,
                    }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.3,
                    }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 leading-8 text-gray-600">
                      {faq.answer}
                    </p>
                  </motion.div>

                )}

              </AnimatePresence>

            </motion.div>

          ))}

        </div>

      </div>
    </section>
  );
}

export default FAQ;