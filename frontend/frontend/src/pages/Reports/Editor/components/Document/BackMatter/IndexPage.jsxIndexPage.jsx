export default function IndexPage({
  entries = [],
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Index
      </h2>

      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.term}
            className="flex justify-between"
          >
            <span>{entry.term}</span>

            <span>{entry.page}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}