export default function RecentReports({ reports }) {

  return (

    <div className="bg-white rounded-2xl shadow-lg p-6">

      <h2 className="text-2xl font-semibold mb-5">
        Les 5 derniers rapports
      </h2>

      {reports.length === 0 ? (

        <p className="text-gray-500">
          Aucun rapport disponible.
        </p>

      ) : (

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left py-3">
                Titre
              </th>

              <th className="text-left">
                Domaine
              </th>

              <th className="text-left">
                Statut
              </th>

            </tr>

          </thead>

          <tbody>

            {reports.map((report) => (

              <tr
                key={report.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="py-3">
                  {report.title}
                </td>

                <td>
                  {report.scientific_field}
                </td>

                <td>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium
                      ${
                        report.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : report.status === "progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                  >

                    {report.status}

                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}