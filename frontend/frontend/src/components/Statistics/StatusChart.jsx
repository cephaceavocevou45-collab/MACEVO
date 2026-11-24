import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-gray-800">
        <p className="font-semibold">{data.name}</p>
        <p style={{ color: data.payload.fill }}>
          Quantité : <span className="font-bold text-white">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function StatusChart({ stats = {} }) {
  const rawData = [
    { name: "Brouillons", value: stats?.draft_reports ?? 0, color: "#f59e0b" },
    { name: "En cours", value: stats?.progress_reports ?? 0, color: "#06b6d4" },
    { name: "Terminés", value: stats?.completed_reports ?? 0, color: "#10b981" },
  ];

  // Calcul du total pour vérifier si des données existent
  const totalReports = rawData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-2xl font-semibold mb-5 text-gray-800">
        Répartition des statuts
      </h2>

      {totalReports === 0 ? (
        <div className="flex flex-col items-center justify-center h-[350px] text-gray-400">
          <p className="text-sm font-medium">Aucun rapport enregistré.</p>
        </div>
      ) : (
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rawData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                cornerRadius={6}
              >
                {rawData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm font-medium text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}