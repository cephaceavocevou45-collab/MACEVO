import { Link } from "react-router-dom";

function ModelesLatex() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      <div className="max-w-4xl">

        <h1 className="text-5xl font-bold text-gray-900">
          Rapports LaTeX
        </h1>

        <p className="mt-6 text-lg leading-8 text-gray-600">
          Macevo met à votre disposition plusieurs modèles de rapports
          scientifiques conformes aux exigences universitaires. Choisissez
          simplement un modèle et commencez votre rédaction sans écrire une
          seule ligne de code LaTeX.
        </p>

        <div className="mt-10">
          <Link
            to="/connexion"
            className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
          >
            Commencer maintenant
          </Link>
        </div>

      </div>

    </section>
  );
}

export default ModelesLatex;