import React from "react";

export default function StatCard({
  title,
  value,
  icon,
  color = "bg-blue-600",
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-gray-500 text-sm font-medium">
            {title}
          </h3>

          <h2 className="text-3xl font-bold mt-2 text-gray-800">
            {value}
          </h2>

        </div>

        <div
          className={`${color} w-14 h-14 rounded-xl flex items-center justify-center text-white`}
        >
          {icon}
        </div>

      </div>

    </div>
  );
}