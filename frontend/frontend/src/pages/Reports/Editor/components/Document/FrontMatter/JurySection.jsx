export default function JurySection({
  president,
  rapporteur,
  examiner,
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">
        Jury
      </h2>

      <div className="space-y-2">
        <p>
          <strong>Président :</strong> {president}
        </p>

        <p>
          <strong>Rapporteur :</strong> {rapporteur}
        </p>

        <p>
          <strong>Examinateur :</strong> {examiner}
        </p>
      </div>
    </section>
  );
}