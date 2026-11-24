export default function StatsCard({ title, value, subtitle, icon, iconBgColor }) {
  return (
    <div className="bg-white dark:bg-[#161b22] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${iconBgColor}`}>
        {icon}
      </div>
      <div>
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</span>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{title}</p>
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}