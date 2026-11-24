export default function StatisticsFilter({ period = "all", setPeriod }) {
  const options = [
    { value: "today", label: "Aujourd'hui" },
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "year", label: "Cette année" },
    { value: "all", label: "Toutes" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 flex flex-wrap items-center justify-between gap-4 border border-gray-100">
      <span className="font-semibold text-gray-700 text-sm ml-2">
        Période des statistiques :
      </span>

      <div className="flex flex-wrap items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
        {options.map((option) => {
          const isActive = period === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod?.(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}