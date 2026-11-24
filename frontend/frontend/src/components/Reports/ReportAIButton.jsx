import { Sparkles } from "lucide-react";

export default function ReportAIButton({

  onClick,

}) {

  return (

    <button

      onClick={onClick}

      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl transition"

    >

      <Sparkles size={18} />

      IA

    </button>

  );

}