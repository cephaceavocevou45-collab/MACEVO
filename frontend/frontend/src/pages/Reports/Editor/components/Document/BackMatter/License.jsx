export default function License({
  name,
  description,
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Licence
      </h2>

      <h3 className="text-xl font-semibold">
        {name}
      </h3>

      <p className="mt-4 text-justify">
        {description}
      </p>
    </section>
  );
}