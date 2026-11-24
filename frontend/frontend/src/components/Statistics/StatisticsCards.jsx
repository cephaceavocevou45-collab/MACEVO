export default function StatisticsCards({ stats = {}, isLoading = false }) {
  const cards = [
    {
      title: "Total des rapports",
      value: stats?.total_reports ?? 0,
      color: "text-blue-600",
      bgLight: "bg-blue-50/50",
    },
    {
      title: "Brouillons",
      value: stats?.draft_reports ?? 0,
      color: "text-amber-500",
      bgLight: "bg-amber-50/50",
    },
    {
      title: "En cours",
      value: stats?.progress_reports ?? 0,
      color: "text-cyan-600",
      bgLight: "bg-cyan-50/50",
    },
    {
      title: "Terminés",
      value: stats?.completed_reports ?? 0,
      color: "text-emerald-600",
      bgLight: "bg-emerald-50/50",
    },
    {
      title: "Aujourd'hui",
      value: stats?.reports_today ?? 0,
      color: "text-purple-600",
      bgLight: "bg-purple-50/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
        >
          <p className="text-sm font-medium text-gray-500">
            {card.title}
          </p>

          {isLoading ? (
            <div className="h-10 w-20 bg-gray-200 animate-pulse rounded-lg mt-3" />
          ) : (
            <h2 className={`text-4xl font-bold mt-3 ${card.color}`}>
              {card.value}
            </h2>
          )}
        </div>
      ))}
    </div>
  );
}