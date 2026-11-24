import { Link } from "react-router-dom";

function ExportPDF() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">

      <div className="max-w-4xl">

        <h1 className="text-5xl font-bold text-gray-900">
          Export PDF
        </h1>

        <p className="mt-6 text-lg leading-8 text-gray-600">
          Une fois votre rapport terminé, exportez-le en PDF avec une mise en
          page professionnelle, prête à être imprimée ou envoyée à votre
          établissement.
        </p>

        <div className="mt-10">
          <Link
            to="/connexion"
            className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
          >
            Générer un PDF
          </Link>
        </div>

      </div>

    </section>
  );
}

export default ExportPDF;