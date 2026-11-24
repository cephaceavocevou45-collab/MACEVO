import { Link } from "react-router-dom";

function Editor() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      <div className="max-w-4xl">

        <h1 className="text-5xl font-bold text-gray-900">
          Éditeur Intuitif
        </h1>

        <p className="mt-6 text-lg leading-8 text-gray-600">
          Rédigez votre rapport dans un éditeur simple et moderne. Macevo
          transforme automatiquement votre travail au format LaTeX sans que
          vous ayez besoin de connaître ce langage.
        </p>

        <div className="mt-10">
          <Link
  to="/rapports/editeur"
            className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
          >
            Commencer à rédiger
          </Link>
        </div>

      </div>

    </section>
  );
}

export default Editor;