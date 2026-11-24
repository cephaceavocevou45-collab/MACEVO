export default function Bibliography({
  items = [],
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Bibliographie
      </h2>

      <ol className="list-decimal pl-6 space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            {item.reference}
          </li>
        ))}
      </ol>
    </section>
  );
}