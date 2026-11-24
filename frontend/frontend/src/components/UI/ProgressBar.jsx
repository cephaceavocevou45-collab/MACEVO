export default function ProgressBar({

  value = 0,

  height = "h-3",

  color = "bg-blue-600",

  showLabel = true,

  animated = true,

}) {

  const percentage = Math.max(
    0,
    Math.min(100, value)
  );

  return (

    <div className="w-full">

      {showLabel && (

        <div className="flex justify-between mb-2">

          <span className="text-sm font-medium">

            Progression

          </span>

          <span className="text-sm font-semibold">

            {percentage}%

          </span>

        </div>

      )}

      <div

        className={`
          w-full
          bg-gray-200
          rounded-full
          overflow-hidden
          ${height}
        `}

      >

        <div

          className={`
            ${height}
            ${color}
            rounded-full
            transition-all
            duration-700
            ease-in-out
            ${
              animated
                ? "animate-pulse"
                : ""
            }
          `}

          style={{
            width: `${percentage}%`,
          }}

        />

      </div>

    </div>

  );

}