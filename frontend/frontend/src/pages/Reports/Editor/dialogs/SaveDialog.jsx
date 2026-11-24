import {
  Save,
  FileText,
  X,
} from "lucide-react";

export default function SaveDialog({

  open,

  onClose,

  onSave,

}) {

  if (!open) return null;

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl shadow-xl w-[520px]">

        {/* ==========================
            En-tête
        ========================== */}

        <div className="flex items-center justify-between p-5 border-b">

          <div className="flex items-center gap-3">

            <Save
              size={28}
              className="text-blue-600"
            />

            <div>

              <h2 className="text-lg font-bold">

                Enregistrer le document

              </h2>

              <p className="text-sm text-gray-500">

                Les modifications seront enregistrées localement et synchronisées avec le serveur.

              </p>

            </div>

          </div>

          <button

            onClick={onClose}

            className="hover:bg-gray-100 rounded-lg p-2"

          >

            <X size={20} />

          </button>

        </div>

        {/* ==========================
            Corps
        ========================== */}

        <div className="p-6">

          <div className="flex items-center gap-4">

            <FileText
              size={42}
              className="text-blue-600"
            />

            <div>

              <h3 className="font-semibold">

                Document scientifique MACEVO

              </h3>

              <p className="text-gray-500 text-sm mt-1">

                La sauvegarde sera effectuée :

              </p>

              <ul className="mt-3 text-sm space-y-2 text-gray-600">

                <li>

                  ✅ Copie locale immédiate

                </li>

                <li>

                  ✅ Synchronisation avec Django

                </li>

                <li>

                  ✅ Historique du document

                </li>

              </ul>

            </div>

          </div>

        </div>

        {/* ==========================
            Pied
        ========================== */}

        <div className="flex justify-end gap-3 p-5 border-t">

          <button

            onClick={onClose}

            className="px-5 py-2 border rounded-lg hover:bg-gray-100"

          >

            Annuler

          </button>

          <button

            onClick={onSave}

            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"

          >

            Enregistrer

          </button>

        </div>

      </div>

    </div>

  );

}