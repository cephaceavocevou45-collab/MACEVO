import { Link } from "react-router-dom";

function WordToLatex() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      <div className="max-w-4xl">

        <h1 className="text-5xl font-bold text-gray-900">
          Conversion Word → LaTeX
        </h1>

        <p className="mt-6 text-lg leading-8 text-gray-600">
          Importez votre document Word et laissez Macevo le convertir
          automatiquement vers un document LaTeX bien structuré.
        </p>

        <div className="mt-10">
          <Link
            to="/connexion"
            className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
          >
            Importer un document
          </Link>
        </div>

      </div>

    </section>
  );
}

export default WordToLatex;