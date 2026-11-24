import { Save, Loader2 } from "lucide-react";

export default function SaveButton({
  onClick,
  loading = false,
}) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        disabled={loading}
        className="
          inline-flex
          items-center
          gap-2.5
          px-8
          py-3
          rounded-xl
          bg-blue-600
          hover:bg-blue-700
          dark:bg-indigo-600
          dark:hover:bg-indigo-500
          disabled:bg-slate-300
          dark:disabled:bg-slate-800
          text-white
          disabled:text-slate-500
          dark:disabled:text-slate-600
          font-semibold
          shadow-md
          shadow-blue-500/10
          dark:shadow-indigo-500/10
          transition-all
          duration-200
          active:scale-[0.98]
          disabled:scale-100
          disabled:cursor-not-allowed
        "
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}

        <span>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </span>
      </button>
    </div>
  );
}