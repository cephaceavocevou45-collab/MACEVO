import {
  BookOpen,
  CalendarDays,
  TrendingUp,
  Award,
} from "lucide-react";

export default function ScientificIndicators({
  topField = "Non défini",
  firstReport = "-",
  lastReport = "-",
  completionRate = 0,
  averageReportsPerMonth = 0,
}) {
  const indicators = [
    {
      title: "Domaine principal",
      value: topField,
      icon: <BookOpen size={22} className="text-blue-600" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Premier rapport",
      value: firstReport,
      icon: <CalendarDays size={22} className="text-emerald-600" />,
      bgColor: "bg-emerald-50",
    },
    {
      title: "Dernier rapport",
      value: lastReport,
      icon: <CalendarDays size={22} className="text-amber-600" />,
      bgColor: "bg-amber-50",
    },
    {
      title: "Taux de complétion",
      value: `${completionRate}%`,
      icon: <Award size={22} className="text-purple-600" />,
      bgColor: "bg-purple-50",
    },
    {
      title: "Moyenne / mois",
      value: averageReportsPerMonth,
      icon: <TrendingUp size={22} className="text-cyan-600" />,
      bgColor: "bg-cyan-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Indicateurs scientifiques
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {indicators.map((item) => (
          <div
            key={item.title}
            className="border border-gray-100 bg-gray-50/50 rounded-xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
                {item.icon}
              </div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {item.title}
              </p>
            </div>

            <h3 className="text-xl font-bold text-gray-900 break-words">
              {item.value}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}