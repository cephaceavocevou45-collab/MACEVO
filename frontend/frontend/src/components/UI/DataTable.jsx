import {
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function DataTable({

  columns,

  data,

  sortKey,

  sortDirection,

  onSort,

}) {

  return (

    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">

      <table className="w-full">

        <thead className="bg-gray-50">

          <tr>

            {columns.map((column) => (

              <th

                key={column.key}

                className="px-5 py-4 text-left font-semibold text-gray-700"

              >

                <button

                  onClick={() => onSort(column.key)}

                  className="flex items-center gap-2"

                >

                  {column.label}

                  {sortKey === column.key && (

                    sortDirection === "asc"

                      ? <ChevronUp size={16} />

                      : <ChevronDown size={16} />

                  )}

                </button>

              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {data.map((row, index) => (

            <tr

              key={index}

              className="border-t hover:bg-gray-50 transition"

            >

              {columns.map((column) => (

                <td

                  key={column.key}

                  className="px-5 py-4"

                >

                  {column.render

                    ? column.render(row)

                    : row[column.key]}

                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}