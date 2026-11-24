export default function References({
  items = [],
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Références
      </h2>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            {item.reference}
          </li>
        ))}
      </ul>
    </section>
  );
}