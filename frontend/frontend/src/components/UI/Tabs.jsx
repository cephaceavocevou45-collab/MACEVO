import { useState } from "react";

export default function Tabs({

  tabs = [],

  defaultTab = 0,

  onChange,

}) {

  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleChange = (index) => {

    setActiveTab(index);

    if (onChange) {

      onChange(index);

    }

  };

  return (

    <div className="w-full">

      {/* Barre des onglets */}

      <div className="flex border-b border-gray-200 overflow-x-auto">

        {tabs.map((tab, index) => (

          <button

            key={index}

            onClick={() => handleChange(index)}

            className={`
              relative
              px-5
              py-3
              font-medium
              whitespace-nowrap
              transition-all
              duration-200

              ${
                activeTab === index
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }
            `}

          >

            <div className="flex items-center gap-2">

              {tab.icon && <tab.icon size={18} />}

              {tab.label}

            </div>

            {activeTab === index && (

              <span
                className="
                  absolute
                  left-0
                  bottom-0
                  h-[3px]
                  w-full
                  rounded-full
                  bg-blue-600
                "
              />

            )}

          </button>

        ))}

      </div>

      {/* Contenu */}

      <div className="mt-6">

        {tabs[activeTab]?.content}

      </div>

    </div>

  );

}