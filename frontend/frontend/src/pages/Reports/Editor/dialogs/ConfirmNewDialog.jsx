import { AlertTriangle } from "lucide-react";

export default function ConfirmNewDialog({

  open,
  onConfirm,
  onCancel,

}) {

  if (!open) return null;

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl shadow-xl w-[450px]">

        {/* =========================
            En-tête
        ========================= */}

        <div className="flex items-center gap-3 p-5 border-b">

          <AlertTriangle
            size={30}
            className="text-orange-500"
          />

          <div>

            <h2 className="text-lg font-bold">

              Nouveau document

            </h2>

            <p className="text-sm text-gray-500">

              Les modifications non enregistrées seront perdues.

            </p>

          </div>

        </div>

        {/* =========================
            Corps
        ========================= */}

        <div className="p-6 text-gray-700">

          Voulez-vous vraiment créer un nouveau document ?

        </div>

        {/* =========================
            Pied
        ========================= */}

        <div className="flex justify-end gap-3 p-5 border-t">

          <button

            onClick={onCancel}

            className="px-5 py-2 rounded-lg border hover:bg-gray-100"

          >

            Annuler

          </button>

          <button

            onClick={onConfirm}

            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"

          >

            Créer

          </button>

        </div>

      </div>

    </div>

  );

}