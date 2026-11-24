export default function Acronyms({
  items = [],
}) {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">
        Liste des acronymes
      </h2>

      <table className="w-full border-collapse">
        <tbody>
          {items.map(({ short, full }) => (
            <tr key={short} className="border-b">
              <td className="py-2 font-semibold">
                {short}
              </td>

              <td className="py-2">
                {full}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}