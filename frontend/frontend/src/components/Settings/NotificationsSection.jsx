import { Bell } from "lucide-react";

export default function NotificationsSection() {

  return (

    <div>

      <div className="flex items-center gap-3 mb-2">

        <Bell size={28} />

        <h2 className="text-2xl font-bold">
          Notifications
        </h2>

      </div>

      <p className="text-gray-500 mb-8">
        Les notifications seront disponibles dans une prochaine version de MACEVO.
      </p>

      <div className="space-y-4">

        <div className="border rounded-2xl p-5">

          <h3 className="font-semibold mb-2">
            Génération de documents
          </h3>

          <p className="text-gray-500">
            Vous serez informé lorsqu'un rapport, mémoire ou article sera terminé.
          </p>

        </div>

        <div className="border rounded-2xl p-5">

          <h3 className="font-semibold mb-2">
            Exportation
          </h3>

          <p className="text-gray-500">
            Notification après chaque export PDF, Word ou LaTeX.
          </p>

        </div>

        <div className="border rounded-2xl p-5">

          <h3 className="font-semibold mb-2">
            Nouveautés
          </h3>

          <p className="text-gray-500">
            Recevoir les nouvelles fonctionnalités et améliorations de MACEVO.
          </p>

        </div>

      </div>

    </div>

  );

}