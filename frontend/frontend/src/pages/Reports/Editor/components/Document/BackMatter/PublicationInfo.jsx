export default function PublicationInfo({
  publisher,
  year,
  version,
  doi,
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Informations de publication
      </h2>

      <div className="space-y-3">
        <p>
          <strong>Éditeur :</strong> {publisher}
        </p>

        <p>
          <strong>Année :</strong> {year}
        </p>

        <p>
          <strong>Version :</strong> {version}
        </p>

        <p>
          <strong>DOI :</strong> {doi}
        </p>
      </div>
    </section>
  );
}