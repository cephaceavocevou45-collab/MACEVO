import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#3B82F6",
  "#F59E0B",
  "#10B981",
];

export default function ReportsChart({
  total,
  draft,
  completed,
}) {
  const data = [
    {
      name: "Brouillons",
      value: draft,
    },
    {
      name: "Terminés",
      value: completed,
    },
    {
      name: "Autres",
      value: Math.max(
        total - draft - completed,
        0
      ),
    },
  ];

  return (
    <div
      className="
        mt-8
        rounded-2xl
        border border-gray-200
        dark:border-slate-700
        bg-white
        dark:bg-slate-800
        shadow-lg
        p-6
        transition-all duration-300
      "
    >
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Répartition des rapports
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            outerRadius={120}
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index]}
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
            }}
            labelStyle={{
              color: "#ffffff",
            }}
          />

          <Legend
            wrapperStyle={{
              color: "#64748b",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}