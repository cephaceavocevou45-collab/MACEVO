import ReportBadge from "./ReportBadge";

export default function ReportHeader({

  report,

}) {

  return (

    <div className="flex justify-between items-start">

      <div>

        <h2 className="text-2xl font-bold">

          {report.title}

        </h2>

        <div className="flex items-center gap-3 mt-2">

          <ReportBadge

            type={report.report_type}

          />

        </div>

      </div>

      {report.is_pinned && (

        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">

          ⭐ ÉPINGLÉ

        </span>

      )}

    </div>

  );

}