const COLORS = {
  ARTICLE: "bg-blue-100 text-blue-700",
  THESE: "bg-purple-100 text-purple-700",
  MEMOIRE: "bg-green-100 text-green-700",
  TP: "bg-orange-100 text-orange-700",
  PROJET: "bg-indigo-100 text-indigo-700",
  STAGE: "bg-pink-100 text-pink-700",
};

export default function ReportBadge({ type }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        COLORS[type] || "bg-gray-100 text-gray-700"
      }`}
    >
      {type || "DOCUMENT"}
    </span>
  );
}