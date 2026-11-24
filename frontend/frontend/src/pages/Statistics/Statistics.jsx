import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

import api from "../../api/axios";

import StatisticsFilter from "../../components/Statistics/StatisticsFilter";
import StatisticsCards from "../../components/Statistics/StatisticsCards";
import StatusChart from "../../components/Statistics/StatusChart";
import FieldChart from "../../components/Statistics/FieldChart";
import MonthlyChart from "../../components/Statistics/MonthlyChart";
import ScientificIndicators from "../../components/Statistics/ScientificIndicators";
import RecentReports from "../../components/Statistics/RecentReports";

export default function Statistics() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("all");

  const [stats, setStats] = useState({
    total_reports: 0,
    draft_reports: 0,
    progress_reports: 0,
    completed_reports: 0,
    reports_today: 0,
  });

  const [recentReports, setRecentReports] = useState([]);
  const [scientificFields, setScientificFields] = useState({});
  const [monthlyReports, setMonthlyReports] = useState([]);

  const [indicators, setIndicators] = useState({
    topField: "-",
    firstReport: "-",
    lastReport: "-",
    completionRate: 0,
    averageReportsPerMonth: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    setLoading(true);

    try {
      const response = await api.get(`dashboard/stats/?period=${period}`);

      setStats(response.data.stats);
      setRecentReports(response.data.recent_reports);
      setScientificFields(response.data.scientific_fields || {});
      setMonthlyReports(response.data.monthly_reports || []);

      setIndicators({
        topField: response.data.top_field,
        firstReport: response.data.first_report,
        lastReport: response.data.last_report,
        completionRate: response.data.completion_rate,
        averageReportsPerMonth: response.data.average_reports_per_month,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-100 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-300 min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />

        {/* Override automatique du theme pour tous les enfants */}
        <main className="flex-1 p-8 overflow-y-auto [&_.bg-white]:dark:bg-slate-900 [&_.bg-white]:dark:border-slate-800/80 [&_.bg-white]:dark:text-slate-100 [&_.text-gray-900]:dark:text-slate-100 [&_.text-gray-800]:dark:text-slate-100 [&_.text-gray-700]:dark:text-slate-200 [&_.text-gray-600]:dark:text-slate-400 [&_.text-gray-500]:dark:text-slate-400">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">
            {t("statistics.title", "Statistiques")}
          </h1>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            {t("statistics.subtitle", "Analyse complète de vos rapports scientifiques.")}
          </p>

          <div className="mt-8">
            <StatisticsFilter period={period} setPeriod={setPeriod} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center text-gray-500 dark:text-slate-400">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500" />
                {t("statistics.loading", "Chargement...")}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8">
                <StatisticsCards stats={stats} />
              </div>

              <div className="grid lg:grid-cols-2 gap-8 mt-10">
                <StatusChart stats={stats} />
                <FieldChart fields={scientificFields} />
              </div>

              <div className="mt-10">
                <MonthlyChart data={monthlyReports} />
              </div>

              <div className="mt-10">
                <ScientificIndicators
                  topField={indicators.topField}
                  firstReport={indicators.firstReport}
                  lastReport={indicators.lastReport}
                  completionRate={indicators.completionRate}
                  averageReportsPerMonth={indicators.averageReportsPerMonth}
                />
              </div>

              <div className="mt-10">
                <RecentReports reports={recentReports} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}