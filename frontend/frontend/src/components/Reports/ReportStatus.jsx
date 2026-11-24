const STATUS = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-700",
  },

  EN_COURS: {
    label: "En cours",
    className: "bg-blue-100 text-blue-700",
  },

  SOUMIS: {
    label: "Soumis",
    className: "bg-yellow-100 text-yellow-700",
  },

  PUBLIE: {
    label: "Publié",
    className: "bg-green-100 text-green-700",
  },

  REJETE: {
    label: "Rejeté",
    className: "bg-red-100 text-red-700",
  },
};

export default function ReportStatus({ status }) {

  const current =
    STATUS[status] || STATUS.BROUILLON;

  return (

    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>

  );

}