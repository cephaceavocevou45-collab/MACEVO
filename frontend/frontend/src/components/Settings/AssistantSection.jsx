import { useSettings } from "../../context/SettingsContext";

export default function AssistantSection() {

  const {
    settings,
    updateSettings,
    loading,
  } = useSettings();

  if (loading) {

    return (
      <div className="text-center py-10">
        Chargement...
      </div>
    );

  }

  return (

    <div>

      <h2 className="text-2xl font-bold mb-2">
        MACEVO IA
      </h2>

      <p className="text-gray-500 mb-8">
        Personnalisez le comportement de votre assistant intelligent.
      </p>

      <div className="space-y-5">

        <div className="border rounded-2xl p-5 flex justify-between items-center">

          <div>

            <h3 className="font-semibold">
              Sauvegarde automatique
            </h3>

            <p className="text-sm text-gray-500">
              Sauvegarder automatiquement les conversations et les brouillons.
            </p>

          </div>

          <input
            type="checkbox"
            checked={settings.auto_save}
            onChange={(e) =>
              updateSettings({
                auto_save: e.target.checked,
              })
            }
          />

        </div>

        <div className="border rounded-2xl p-5 flex justify-between items-center">

          <div>

            <h3 className="font-semibold">
              Confirmation avant suppression
            </h3>

            <p className="text-sm text-gray-500">
              Demander une confirmation avant de supprimer un document ou une conversation.
            </p>

          </div>

          <input
            type="checkbox"
            checked={settings.confirm_delete}
            onChange={(e) =>
              updateSettings({
                confirm_delete: e.target.checked,
              })
            }
          />

        </div>

      </div>

    </div>

  );

}