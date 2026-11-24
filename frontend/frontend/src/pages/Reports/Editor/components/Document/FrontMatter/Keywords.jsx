export default function Keywords({
  keywords = [],
}) {
  return (
    <section className="mt-8">
      <h3 className="font-semibold mb-2">
        Mots-clés
      </h3>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="px-3 py-1 bg-slate-100 rounded-full text-sm"
          >
            {keyword}
          </span>
        ))}
      </div>
    </section>
  );
}