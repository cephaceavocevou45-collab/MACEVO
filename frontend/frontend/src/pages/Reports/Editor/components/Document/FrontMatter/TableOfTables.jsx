export default function TableOfTables({
  tables = [],
}) {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">
        Liste des tableaux
      </h2>

      <ul className="space-y-2">
        {tables.map((table) => (
          <li
            key={table.id}
            className="flex justify-between"
          >
            <span>{table.title}</span>

            <span>{table.page}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}