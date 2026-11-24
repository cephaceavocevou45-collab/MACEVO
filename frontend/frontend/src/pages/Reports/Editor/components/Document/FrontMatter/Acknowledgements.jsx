export default function Acknowledgements({
  children,
}) {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">
        Remerciements
      </h2>

      <div className="prose max-w-none">
        {children}
      </div>
    </section>
  );
}