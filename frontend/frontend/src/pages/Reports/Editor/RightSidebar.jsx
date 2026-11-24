import { useState } from "react";

import {
  Bot,
  BookOpen,
  Sigma,
  History,
} from "lucide-react";

export default function RightSidebar() {

  const [activeTab, setActiveTab] = useState("ia");

  const tabs = [
    {
      id: "ia",
      icon: Bot,
      label: "IA",
    },
    {
      id: "references",
      icon: BookOpen,
      label: "Références",
    },
    {
      id: "latex",
      icon: Sigma,
      label: "LaTeX",
    },
    {
      id: "history",
      icon: History,
      label: "Historique",
    },
  ];

  return (

    <aside className="h-full flex flex-col bg-white">

      {/* Onglets */}

      <div className="flex border-b">

        {tabs.map((tab) => {

          const Icon = tab.icon;

          return (

            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1
                flex
                flex-col
                items-center
                gap-1
                py-3
                transition

                ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "hover:bg-gray-100 text-gray-500"
                }
              `}
            >

              <Icon size={20} />

              <span className="text-xs">

                {tab.label}

              </span>

            </button>

          );

        })}

      </div>

      {/* Contenu */}

      <div className="flex-1 overflow-auto p-5">

        {activeTab === "ia" && (

          <div>

            <h2 className="font-bold text-lg mb-4">
              Assistant IA
            </h2>

            <p className="text-gray-500">

              Utilisez l'IA pour :

            </p>

            <ul className="mt-4 space-y-2 text-sm">

              <li>• Résumer le document</li>

              <li>• Corriger les fautes</li>

              <li>• Reformuler un paragraphe</li>

              <li>• Traduire</li>

              <li>• Générer une introduction</li>

              <li>• Générer une conclusion</li>

            </ul>

          </div>

        )}

        {activeTab === "references" && (

          <div>

            <h2 className="font-bold text-lg mb-4">

              Références

            </h2>

            <p className="text-gray-500">

              Les références bibliographiques
              apparaîtront ici.

            </p>

          </div>

        )}

        {activeTab === "latex" && (

          <div>

            <h2 className="font-bold text-lg mb-4">

              Équations LaTeX

            </h2>

            <p className="text-gray-500">

              Insérez et modifiez vos équations
              scientifiques.

            </p>

          </div>

        )}

        {activeTab === "history" && (

          <div>

            <h2 className="font-bold text-lg mb-4">

              Historique

            </h2>

            <p className="text-gray-500">

              Les versions du document
              apparaîtront ici.

            </p>

          </div>

        )}

      </div>

    </aside>

  );

}