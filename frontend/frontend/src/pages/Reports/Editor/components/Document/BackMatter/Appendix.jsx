export default function Appendix({
  title,
  children,
}) {
  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Annexe : {title}
      </h2>

      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
}