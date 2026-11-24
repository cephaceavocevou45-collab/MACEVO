import { useSettings } from "../../context/SettingsContext";

export default function DocumentsSection() {

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

  const formats = [

    {
      value: "pdf",
      title: "PDF",
      description: "Exporter automatiquement au format PDF.",
    },

    {
      value: "docx",
      title: "Microsoft Word (.docx)",
      description: "Exporter automatiquement au format Word.",
    },

    {
      value: "latex",
      title: "LaTeX",
      description: "Exporter automatiquement au format LaTeX.",
    },

  ];

  return (

    <div>

      <h2 className="text-2xl font-bold mb-2">
        Documents
      </h2>

      <p className="text-gray-500 mb-8">
        Choisissez le format utilisé par défaut lors des exportations.
      </p>

      <div className="space-y-4">

        {formats.map((format) => (

          <label
            key={format.value}
            className="border rounded-2xl p-5 flex justify-between items-center cursor-pointer hover:border-blue-600 transition"
          >

            <div>

              <h3 className="font-semibold">
                {format.title}
              </h3>

              <p className="text-sm text-gray-500">
                {format.description}
              </p>

            </div>

            <input
              type="radio"
              name="export_format"
              checked={settings.export_format === format.value}
              onChange={() =>
                updateSettings({
                  export_format: format.value,
                })
              }
            />

          </label>

        ))}

      </div>

    </div>

  );

}