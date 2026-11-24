import { useSettings } from "../../context/SettingsContext";

export default function AppearanceSection() {
  const {
    settings,
    updateSettings,
    loading,
  } = useSettings();

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-700 dark:text-slate-300">
        Chargement...
      </div>
    );
  }

  const themes = [
    {
      value: "light",
      title: "Mode clair",
      description: "Interface lumineuse.",
    },
    {
      value: "dark",
      title: "Mode sombre",
      description: "Réduit la fatigue visuelle.",
    },
    {
      value: "system",
      title: "Suivre le système",
      description:
        "Utilise automatiquement le thème de votre ordinateur.",
    },
  ];

  return (
    <div className="transition-colors duration-300">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Apparence
      </h2>

      <p className="mb-8 text-gray-500 dark:text-slate-400">
        Personnalisez l'apparence générale de MACEVO.
      </p>

      <div className="space-y-4">
        {themes.map((theme) => {
          const active = settings.theme === theme.value;

          return (
            <label
              key={theme.value}
              onClick={() => updateSettings({ theme: theme.value })}
              className={`
                flex items-center justify-between
                cursor-pointer
                rounded-2xl
                border
                p-5
                transition-all
                duration-300

                ${
                  active
                    ? "border-blue-600 bg-blue-50/80 dark:border-blue-500 dark:bg-blue-950/40"
                    : "border-gray-200 bg-white hover:border-blue-400 dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:border-blue-500"
                }
              `}
            >
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {theme.title}
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {theme.description}
                </p>
              </div>

              <input
                type="radio"
                name="theme"
                checked={active}
                onChange={() => updateSettings({ theme: theme.value })}
                className="h-5 w-5 accent-blue-600 cursor-pointer"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}