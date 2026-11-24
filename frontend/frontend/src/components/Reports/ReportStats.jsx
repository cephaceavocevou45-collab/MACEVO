import {

  FileText,

  BookOpen,

  BarChart3,

  Table,

} from "lucide-react";

export default function ReportStats({

  report,

}) {

  return (

    <div className="grid grid-cols-2 gap-4 mt-5 text-sm text-gray-600">

      <div className="flex items-center gap-2">

        <FileText size={16} />

        {report.pages || 0} pages

      </div>

      <div className="flex items-center gap-2">

        <BookOpen size={16} />

        {report.references || 0} références

      </div>

      <div className="flex items-center gap-2">

        <BarChart3 size={16} />

        {report.figures || 0} figures

      </div>

      <div className="flex items-center gap-2">

        <Table size={16} />

        {report.tables || 0} tableaux

      </div>

    </div>

  );

}