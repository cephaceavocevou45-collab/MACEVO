export default function TableOfFigures({
  figures = [],
}) {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">
        Liste des figures
      </h2>

      <ul className="space-y-2">
        {figures.map((figure) => (
          <li
            key={figure.id}
            className="flex justify-between"
          >
            <span>{figure.title}</span>

            <span>{figure.page}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}