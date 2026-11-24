export default function Glossary({
  items = [],
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Glossaire
      </h2>

      <dl className="space-y-6">
        {items.map((item) => (
          <div key={item.term}>
            <dt className="font-semibold">
              {item.term}
            </dt>

            <dd className="text-gray-700">
              {item.definition}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}