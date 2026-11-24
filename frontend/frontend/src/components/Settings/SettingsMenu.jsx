import { ChevronRight } from "lucide-react";

export default function SettingsMenu({
  sections,
  activeSection,
  setActiveSection,
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-gray-200
        dark:border-slate-700
        bg-white
        dark:bg-slate-800
        shadow-lg
        p-3
        transition-all
        duration-300
      "
    >
      {sections.map((section) => {
        const Icon = section.icon;

        const active = activeSection === section.id;

        return (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`
              w-full
              flex
              items-center
              justify-between
              rounded-2xl
              p-4
              mb-2
              transition-all
              duration-300
              ${
                active
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
              }
            `}
          >
            <div className="flex items-center gap-4">
              <Icon size={22} />

              <div className="text-left">
                <p className="font-semibold">
                  {section.title}
                </p>

                <p
                  className={`text-sm ${
                    active
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-slate-400"
                  }`}
                >
                  {section.description}
                </p>
              </div>
            </div>

            <ChevronRight size={18} />
          </button>
        );
      })}
    </div>
  );
}