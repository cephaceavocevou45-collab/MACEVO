export default function AbstractPage({
  language = "Français",
  abstract,
}) {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">
        Résumé ({language})
      </h2>

      <p className="text-justify leading-8">
        {abstract}
      </p>
    </section>
  );
}