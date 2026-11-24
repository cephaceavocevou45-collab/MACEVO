import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import logoi from "../../../assets/image/logo.png";

import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";

import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react";

function Footer() {

  return (

    <footer className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">

      {/* Halo */}

      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[150px]"></div>

      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-[150px]"></div>

      <div className="relative">

        {/* CTA */}

        <section id="cta" className="mx-auto max-w-7xl px-6 pt-16">

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

            className="rounded-[35px] bg-gradient-to-r from-blue-600 to-indigo-700 p-10 shadow-2xl"

          >

            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">

              <div>

                <h2 className="text-4xl font-extrabold">

                  Prêt à créer votre premier rapport ?

                </h2>

                <p className="mt-4 max-w-2xl text-lg text-blue-100">

                  Rejoignez Macevo dès aujourd'hui et simplifiez la rédaction
                  de tous vos rapports scientifiques.

                </p>

              </div>

              <Link

                to="/inscription"

                className="group flex items-center gap-3 rounded-2xl bg-white px-8 py-4 font-bold text-blue-700 transition hover:scale-105"

              >

                Commencer gratuitement

                <ArrowRight
                  size={20}
                  className="transition group-hover:translate-x-2"
                />

              </Link>

            </div>

          </motion.div>

        </section>

        {/* Footer principal */}

        <div className="mx-auto mt-20 max-w-7xl px-6 pb-10">

          <div className="grid gap-14 lg:grid-cols-4">

            {/* Logo */}

            <div>

              <img

                src={logoi}

                alt="Logo"

                className="mb-6 h-20"

              />

              <p className="leading-8 text-gray-300">

                Macevo est la plateforme intelligente qui permet aux étudiants,
                enseignants et chercheurs de créer rapidement des rapports
                scientifiques professionnels.

              </p>

              <div className="mt-8 space-y-4">

                <div className="flex items-center gap-3">

                  <MapPin
                    size={20}
                    className="text-blue-400"
                  />

                  <span>

                    Cotonou, Bénin

                  </span>

                </div>

                <div className="flex items-center gap-3">

                  <Mail
                    size={20}
                    className="text-blue-400"
                  />

                  <span>

                    contact@macevo.com

                  </span>

                </div>

                <div className="flex items-center gap-3">

                  <Phone
                    size={20}
                    className="text-blue-400"
                  />

                  <span>

                    +229 XX XX XX XX

                  </span>

                </div>

              </div>

              {/* Réseaux */}

              <div className="mt-8 flex gap-4">

                {[

                  FaGithub,

                  FaLinkedinIn,

                  FaInstagram,

                  FaXTwitter,

                ].map((Icon,index)=>(

                  <motion.a

                    key={index}

                    href="#"

                    whileHover={{
                      y:-6,
                      rotate:10,
                    }}

                    className="rounded-full border border-gray-700 p-3 transition hover:border-blue-500 hover:bg-blue-600"

                  >

                    <Icon size={18}/>

                  </motion.a>

                ))}

              </div>

            </div>

            {/* Plateforme */}
                        <div>

              <h3 className="mb-6 text-xl font-bold">
                Plateforme
              </h3>

              <ul className="space-y-4">

                <li>
                  <Link
                    to="/"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    Accueil
                  </Link>
                </li>

                <li>
                  <Link
                    to="/rapports/modeles-latex"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    Modèles LaTeX
                  </Link>
                </li>

                <li>
                  <Link
                    to="/inscription"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    Éditeur
                  </Link>
                </li>

                <li>
                  <Link
                    to="/dashboard"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    Tableau de bord
                  </Link>
                </li>

              </ul>

            </div>

            {/* Ressources */}

            <div>

              <h3 className="mb-6 text-xl font-bold">
                Ressources
              </h3>

              <ul className="space-y-4">

                <li>
                  <Link
                    to="/support"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    FAQ
                  </Link>
                </li>

                <li>
                  <Link
                    to="/support"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    Contact
                  </Link>
                </li>

                <li>
                  <Link
                    to="/#about"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    À propos
                  </Link>
                </li>

                <li>
                  <Link
                    to="/support"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    Blog
                  </Link>
                </li>

              </ul>

            </div>

            {/* Légal */}

            <div>

              <h3 className="mb-6 text-xl font-bold">
                Informations
              </h3>

              <ul className="space-y-4">

                <li>
                  <Link
                    to="/support"
                    className="transition hover:pl-2 hover:text-blue-400"
                  >
                    Aide et support
                  </Link>
                </li>

              </ul>

            </div>

          </div>

          {/* Séparateur */}

          <div className="my-10 border-t border-slate-700"></div>

          {/* Bas du footer */}

          <div className="flex flex-col items-center justify-between gap-4 text-sm text-gray-400 md:flex-row">

            <p>
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-white">
                Macevo
              </span>
              . Tous droits réservés.
            </p>

            <p className="text-center md:text-right">
              Conçu avec ❤️ pour simplifier la rédaction scientifique.
            </p>

          </div>

        </div>

      </div>

    </footer>

  );

}

export default Footer;
