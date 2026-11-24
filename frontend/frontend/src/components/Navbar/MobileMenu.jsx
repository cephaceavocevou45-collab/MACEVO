import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import navLinks from "./navLinks";
import CTAButton from "./CTAButton";

function MobileMenu({ isOpen, setIsOpen }) {
  return (
    <AnimatePresence>

      {isOpen && (

        <>

          {/* Fond sombre */}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: .5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .25 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black"
          />

          {/* Menu */}

          <motion.div
            initial={{
              x: "100%",
            }}
            animate={{
              x: 0,
            }}
            exit={{
              x: "100%",
            }}
            transition={{
              duration: .35,
            }}
            className="fixed right-0 top-0 z-50 flex h-screen w-80 flex-col bg-white p-8 shadow-2xl"
          >

            {/* Fermer */}

            <div className="mb-10 flex justify-end">

              <button
                aria-label="Fermer le menu"
                onClick={() => setIsOpen(false)}
              >
                <X
                  size={30}
                  className="text-gray-700"
                />
              </button>

            </div>

            {/* Navigation */}

            <nav className="flex flex-col gap-6">

              {navLinks.map((link) => (

                link.href.startsWith("#") ? (

                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-semibold text-gray-700 transition hover:text-blue-600"
                  >
                    {link.name}
                  </a>

                ) : (

                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-semibold text-gray-700 transition hover:text-blue-600"
                  >
                    {link.name}
                  </Link>

                )

              ))}

            </nav>

            {/* Boutons */}

            <div className="mt-12 flex flex-col gap-4">

              <Link
                to="/connexion"
                onClick={() => setIsOpen(false)}
                className="rounded-2xl border border-blue-600 py-3 text-center font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
              >
                Connexion
              </Link>

              <div onClick={() => setIsOpen(false)}>
                <CTAButton />
              </div>

            </div>

          </motion.div>

        </>

      )}

    </AnimatePresence>
  );
}

export default MobileMenu;